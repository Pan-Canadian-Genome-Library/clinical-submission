/*
 * Copyright (c) 2025 The Ontario Institute for Cancer Research. All rights reserved
 *
 * This program and the accompanying materials are made available under the terms of
 * the GNU Affero General Public License v3.0. You should have received a copy of the
 * GNU Affero General Public License along with this program.
 *  If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * One-off migration of `generated_identifiers.source_hash` from a hash of the submitter value alone to a hash scoped
 * to the entity and study (`generateEntityHash`). Old hashes can't be reversed, so the submitted data of every study
 * is read back from Lyric, and each record's old and new hash are computed from its submitter value.
 *
 * Records are grouped by their old hash, since every record with the same submitter value shared one old hash:
 * - Records that already have a row at their new hash are already migrated and are left as they are.
 * - When the old hash has a row, the earliest committed record of that row's entity keeps its PCGL ID: the row is
 *   moved to that record's new hash. Records are ordered by Lyric's `created_at`. On an exact tie the record with the
 *   lowest system ID keeps it, and the tie is logged.
 * - Every other record in the group is a collision, and a group without any row has records without an ID. With
 *   `--generate-missing`, each of them gets a new PCGL ID, generated the same way as on commit.
 *
 * Options:
 * - `--generate-missing`: generate PCGL IDs for collisions and records without an ID. Without it they are only logged.
 * - `--dry-run`: run every step, then roll the transaction back. No sequence values are taken, so the IDs that would
 *   be generated are not known.
 *
 * Each collision and each record without an ID is logged with its entity, study and Lyric system ID, and collisions
 * also name the record that kept the existing ID. Submitter values are never logged, since they are the values PCGL
 * IDs exist to hide. The summary logs the totals, then the counts of each entity in each study.
 *
 * Every change runs in one transaction, which is rolled back if any of them fails.
 */

import { VIEW_TYPE } from '@overture-stack/lyric';
import { eq, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { logger } from '@/common/logger.js';
import { dbConfig } from '@/config/dbConfig.js';
import { env } from '@/config/envConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { connectToDb } from '@/db/index.js';
import { generatedIdentifiers } from '@/db/schemas/idGenerationConfig.js';
import { study } from '@/db/schemas/studiesSchema.js';
import type { IDGenerationConfigRecord, PostgresTransaction } from '@/db/types.js';
import { generateEntityHash, generateHash, generateIdForRecord } from '@/internal/id-manager/utils.js';
import iimService from '@/service/idManagerService.js';

const generateMissing = process.argv.includes('--generate-missing');
const dryRun = process.argv.includes('--dry-run');

const db = connectToDb(dbConfig.connectionString);
const iimRepo = iimService(db);

type RehashOutcome = 'updated' | 'alreadyMigrated' | 'collisions' | 'withoutId' | 'missingValue' | 'generated';
type RehashCounts = Record<RehashOutcome, number>;

// A submitted record of a configured entity, with the hashes computed from its submitter value
type ReadRecord = {
	idConfig: IDGenerationConfigRecord;
	studyId: string;
	systemId: string;
	// Needed to generate an ID for the record. Never logged.
	submitterValue: string;
	oldHash: string;
	newHash: string;
};

// The record that kept the PCGL ID of an old hash. When no record read in this run keeps it, only the ID's entity is
// known.
type IdHolder = {
	entityName: string | undefined;
	studyId?: string;
	systemId?: string;
	generatedId: string;
};

// Thrown at the end of a dry run, so that the transaction is rolled back
class DryRunRollback extends Error {}

const submittedDataCreatedAt = z.object({ system_id: z.string(), created_at: z.string() });

const emptyCounts = (): RehashCounts => ({
	updated: 0,
	alreadyMigrated: 0,
	collisions: 0,
	withoutId: 0,
	missingValue: 0,
	generated: 0,
});

const totals = emptyCounts();

// Counts per entity, then per study, for the summary
const countsByEntityAndStudy = new Map<string, Map<string, RehashCounts>>();

const countRecord = (entityName: string, studyId: string, outcome: RehashOutcome): void => {
	totals[outcome]++;

	const countsByStudy = countsByEntityAndStudy.get(entityName) ?? new Map<string, RehashCounts>();
	countsByEntityAndStudy.set(entityName, countsByStudy);

	const studyCounts = countsByStudy.get(studyId) ?? emptyCounts();
	countsByStudy.set(studyId, studyCounts);

	studyCounts[outcome]++;
};

const recordDetails = (record: ReadRecord): { entityName: string; studyId: string; systemId: string } => ({
	entityName: record.idConfig.entityName,
	studyId: record.studyId,
	systemId: record.systemId,
});

/**
 * Reads every submitted record of every configured entity, in every study that has a category. Records without a
 * submitter value are counted and left out.
 */
const readRecords = async (idConfigs: IDGenerationConfigRecord[]): Promise<ReadRecord[]> => {
	const studies = await db.select().from(study).where(isNotNull(study.category_id));
	const readRecordsList: ReadRecord[] = [];

	for (const studyRecord of studies) {
		if (studyRecord.category_id === null) {
			continue;
		}

		for (const idConfig of idConfigs) {
			const records = lyricProvider.services.submittedData.getSubmittedDataByCategoryStream(studyRecord.category_id, {
				view: VIEW_TYPE.Values.flat,
				entityName: [idConfig.entityName],
				organizations: [studyRecord.study_id],
			});

			for await (const record of records) {
				const fieldValue = record.data[idConfig.fieldName];
				if (fieldValue === undefined || fieldValue === null) {
					countRecord(idConfig.entityName, record.organization, 'missingValue');
					continue;
				}

				const submitterValue = String(fieldValue);
				readRecordsList.push({
					idConfig,
					studyId: record.organization,
					systemId: record.systemId,
					submitterValue,
					oldHash: generateHash(submitterValue, env.ID_MANAGER_SECRET),
					newHash: generateEntityHash(
						{ entityName: idConfig.entityName, studyId: record.organization, value: submitterValue },
						env.ID_MANAGER_SECRET,
					),
				});
			}
		}
	}

	return readRecordsList;
};

/**
 * Picks the earliest committed of `candidates` by Lyric's `submitted_data.created_at`. On an exact tie, picks the one
 * with the lowest system ID and logs the tie.
 */
const chooseEarliestCommitted = async (
	candidates: ReadRecord[],
	transaction: PostgresTransaction,
): Promise<ReadRecord | undefined> => {
	if (candidates.length <= 1) {
		return candidates[0];
	}

	// Lyric's records don't include their commit time, so it is read from Lyric's table. The text form keeps the
	// full microsecond precision, so a tie is an exact match.
	const systemIds = candidates.map((candidate) => candidate.systemId);
	const result = await transaction.execute(
		sql`SELECT system_id, created_at::text AS created_at FROM submitted_data WHERE system_id IN (${sql.join(
			systemIds.map((systemId) => sql`${systemId}`),
			sql`, `,
		)}) ORDER BY created_at ASC`,
	);
	const rows = result.rows.map((row) => submittedDataCreatedAt.parse(row));

	const earliestCreatedAt = rows[0]?.created_at;
	if (rows.length !== candidates.length || earliestCreatedAt === undefined) {
		throw new Error(`Commit times not found for every record with system IDs ${systemIds.join(', ')}`);
	}

	// Default sort compares UTF-16 code units, so the order doesn't depend on the locale
	const tiedSystemIds = rows
		.filter((row) => row.created_at === earliestCreatedAt)
		.map((row) => row.system_id)
		.sort();
	const chosenSystemId = tiedSystemIds[0];
	const chosen = candidates.find((candidate) => candidate.systemId === chosenSystemId);

	if (tiedSystemIds.length > 1 && chosen !== undefined) {
		logger.warn(
			`[IIM rehash]: Records committed at the same time, the lowest system ID keeps the PCGL ID: ${JSON.stringify({
				entityName: chosen.idConfig.entityName,
				createdAt: earliestCreatedAt,
				tiedRecords: candidates
					.filter((candidate) => tiedSystemIds.includes(candidate.systemId))
					.map((candidate) => ({ studyId: candidate.studyId, systemId: candidate.systemId })),
				chosenSystemId,
			})}`,
		);
	}

	return chosen;
};

/**
 * Generates a PCGL ID for a record that has none, when `--generate-missing` is set, and describes what was done for
 * the log. Throws when the ID can't be generated, which rolls the run back.
 */
const generateMissingId = async (
	record: ReadRecord,
	transaction: PostgresTransaction,
): Promise<{ action: string; generatedId?: string }> => {
	if (!generateMissing) {
		return { action: 'not generated, run without --generate-missing' };
	}

	countRecord(record.idConfig.entityName, record.studyId, 'generated');

	if (dryRun) {
		return { action: 'would generate (dry run)' };
	}

	const result = await generateIdForRecord(
		{ idConfig: record.idConfig, studyId: record.studyId, value: record.submitterValue },
		transaction,
	);

	if (result.outcome === 'created') {
		return { action: 'generated', generatedId: result.generatedId };
	}

	if (result.outcome === 'alreadyExists') {
		// The decision phase found no row at this hash, so another process stored one during the run
		throw new Error(`A PCGL ID was stored for ${JSON.stringify(recordDetails(record))} while the script was running`);
	}

	throw new Error(`The sequence ${record.idConfig.sequenceName} returned no value`);
};

let exitCode = 0;

// What the script was doing, for the failure log
let phase = 'loading the ID configs';
let changesSaved = false;

try {
	const idConfigs = await iimRepo.getAllIIMConfigs();
	const entityNameOfConfig = (configId: number | null): string | undefined =>
		idConfigs.find((config) => config.id === configId)?.entityName;

	phase = 'reading submitted records';
	const records = await readRecords(idConfigs);

	const recordsByOldHash = new Map<string, ReadRecord[]>();
	for (const record of records) {
		recordsByOldHash.set(record.oldHash, [...(recordsByOldHash.get(record.oldHash) ?? []), record]);
	}

	phase = 'moving and generating IDs';
	try {
		await db.transaction(async (transaction) => {
			const rowsByHash = new Map(
				(await transaction.select().from(generatedIdentifiers)).map((row) => [row.sourceHash, row]),
			);

			// Each group holds every record whose submitter value gave the same old hash, across all entities and
			// studies. Under the old hash they all shared the one PCGL ID stored at that hash, if any.
			for (const [oldHash, groupRecords] of recordsByOldHash) {
				// Records whose entity already has a row at their new hash keep that ID and are not changed. They were
				// moved by an earlier run, or committed after the deploy and given an ID under the new hash.
				const migrated = groupRecords.filter(
					(record) => rowsByHash.get(record.newHash)?.configId === record.idConfig.id,
				);
				for (const record of migrated) {
					countRecord(record.idConfig.entityName, record.studyId, 'alreadyMigrated');
				}

				// The remaining records have no ID at their new hash. When there are none, the group is done.
				let withoutRow = groupRecords.filter((record) => !migrated.includes(record));
				if (withoutRow.length === 0) {
					continue;
				}

				// The record that keeps the group's existing PCGL ID, for the collision logs. It stays undefined when
				// the group has no existing ID, so the remaining records are records without an ID.
				let holder: IdHolder | undefined;
				const oldRow = rowsByHash.get(oldHash);

				if (oldRow !== undefined) {
					// The existing ID stays with its entity. Of the records of the row's entity that have no ID yet, the
					// earliest committed one keeps it.
					const keeper = await chooseEarliestCommitted(
						withoutRow.filter((record) => record.idConfig.id === oldRow.configId),
						transaction,
					);

					if (keeper !== undefined) {
						// Move the row to the keeper's new hash. The PCGL ID itself doesn't change.
						await transaction
							.update(generatedIdentifiers)
							.set({ sourceHash: keeper.newHash })
							.where(eq(generatedIdentifiers.id, oldRow.id));
						countRecord(keeper.idConfig.entityName, keeper.studyId, 'updated');
						holder = { ...recordDetails(keeper), generatedId: oldRow.generatedId };
						withoutRow = withoutRow.filter((record) => record !== keeper);
					} else {
						// No record read in this run keeps the row, for example because the record it was generated for was
						// deleted, or because it already has an ID at its new hash
						holder = { entityName: entityNameOfConfig(oldRow.configId), generatedId: oldRow.generatedId };
					}
				} else if (migrated.length > 0) {
					// On a rerun, the old row was already moved to the earliest committed record of the group
					const keeper = await chooseEarliestCommitted(migrated, transaction);
					const keeperRow = keeper && rowsByHash.get(keeper.newHash);
					if (keeper !== undefined && keeperRow !== undefined) {
						holder = { ...recordDetails(keeper), generatedId: keeperRow.generatedId };
					}
				}

				// Every record still without an ID is a collision when the group's existing ID went to another record,
				// and a record without an ID otherwise. Each one is counted, given a new ID when --generate-missing is
				// set, and logged.
				for (const record of withoutRow) {
					const outcome = holder === undefined ? 'withoutId' : 'collisions';
					countRecord(record.idConfig.entityName, record.studyId, outcome);

					const generation = await generateMissingId(record, transaction);

					if (holder === undefined) {
						logger.warn(
							`[IIM rehash]: Record has no PCGL ID: ${JSON.stringify({ ...recordDetails(record), ...generation })}`,
						);
					} else {
						logger.warn(
							`[IIM rehash]: Collision, record does not keep the existing PCGL ID: ${JSON.stringify({
								...recordDetails(record),
								idKeptBy: holder,
								...generation,
							})}`,
						);
					}
				}
			}

			if (dryRun) {
				throw new DryRunRollback();
			}
		});
		changesSaved = true;
	} catch (error) {
		if (!(error instanceof DryRunRollback)) {
			throw error;
		}
	}

	phase = 'logging the summary';
	const runDescription = dryRun ? 'Dry run finished, no changes were saved' : 'Finished rehashing generated IDs';
	logger.info(`[IIM rehash]: ${runDescription}. Totals: ${JSON.stringify(totals)}`);
	for (const [entityName, countsByStudy] of countsByEntityAndStudy) {
		for (const [studyId, studyCounts] of countsByStudy) {
			logger.info(`[IIM rehash]: Counts for ${JSON.stringify({ entityName, studyId, ...studyCounts })}`);
		}
	}
} catch (error) {
	exitCode = 1;

	if (changesSaved) {
		logger.error(error, `[IIM rehash]: Failed while ${phase}, after the changes were saved`);
	} else {
		logger.error(
			error,
			`[IIM rehash]: Failed while ${phase}. The transaction was rolled back and nothing was saved, including the IDs reported as generated above`,
		);
		logger.error(`[IIM rehash]: Counts up to the failure, all rolled back: ${JSON.stringify(totals)}`);

		if (totals.generated > 0 && !dryRun) {
			logger.error(
				'[IIM rehash]: Postgres does not roll back sequence values, so the values taken for the IDs reported as generated above will not be used again',
			);
		}
	}
} finally {
	try {
		await lyricProvider.shutdown();
		await db.$client.end();
	} catch (closeError) {
		const savedDescription = changesSaved ? 'the changes were saved' : 'nothing was saved';
		logger.error(closeError, `[IIM rehash]: Error closing the connections after the run, ${savedDescription}`);
	}
}

process.exit(exitCode);
