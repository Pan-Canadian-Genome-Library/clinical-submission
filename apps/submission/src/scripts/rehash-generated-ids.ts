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
 * - The row at a record's old hash, for the record's entity config, is moved to the record's new hash. A row is
 *   moved once: the first record in stream order with that old hash keeps the existing PCGL ID.
 * - Records whose old hash was already moved for another record (the same value in another study), or whose old
 *   hash belongs to another entity's config, are collisions and are left without an ID.
 * - Records that already have a row at their new hash are counted as already migrated, so running it again
 *   updates nothing.
 *
 * Every update runs in one transaction, which is rolled back if any of them fails.
 */

import { VIEW_TYPE } from '@overture-stack/lyric';
import { and, eq, isNotNull } from 'drizzle-orm';

import { logger } from '@/common/logger.js';
import { dbConfig } from '@/config/dbConfig.js';
import { env } from '@/config/envConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { connectToDb } from '@/db/index.js';
import { generatedIdentifiers } from '@/db/schemas/idGenerationConfig.js';
import { study } from '@/db/schemas/studiesSchema.js';
import { generateEntityHash, generateHash } from '@/internal/id-manager/utils.js';
import iimService from '@/service/idManagerService.js';

const db = connectToDb(dbConfig.connectionString);
const iimRepo = iimService(db);

const counts = {
	updated: 0,
	alreadyMigrated: 0,
	collisions: 0,
	withoutId: 0,
	missingValue: 0,
};

let exitCode = 0;

try {
	const idConfigs = await iimRepo.getAllIIMConfigs();
	const studies = await db.select().from(study).where(isNotNull(study.category_id));

	await db.transaction(async (transaction) => {
		// The new hash that each old hash, per config, was claimed by. A later record with the same old hash and a
		// different new hash is a collision.
		const claimedOldHashes = new Map<string, string>();

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
					const submitterValue = record.data[idConfig.fieldName];
					if (submitterValue === undefined || submitterValue === null) {
						counts.missingValue++;
						continue;
					}

					const oldHash = generateHash(String(submitterValue), env.ID_MANAGER_SECRET);
					const newHash = generateEntityHash(
						{ entityName: idConfig.entityName, studyId: record.organization, value: String(submitterValue) },
						env.ID_MANAGER_SECRET,
					);
					const claimKey = `${idConfig.id}:${oldHash}`;

					const newHashRows = await iimRepo.getIDByHash(newHash, transaction);
					if (newHashRows.some((row) => row.configId === idConfig.id)) {
						counts.alreadyMigrated++;
						// Records later in the stream with the same old hash are collisions, as they are on the first run
						if (!claimedOldHashes.has(claimKey)) {
							claimedOldHashes.set(claimKey, newHash);
						}
						continue;
					}

					const claimedBy = claimedOldHashes.get(claimKey);
					if (claimedBy !== undefined && claimedBy !== newHash) {
						counts.collisions++;
						continue;
					}

					const updatedRows = await transaction
						.update(generatedIdentifiers)
						.set({ sourceHash: newHash })
						.where(and(eq(generatedIdentifiers.sourceHash, oldHash), eq(generatedIdentifiers.configId, idConfig.id)))
						.returning({ id: generatedIdentifiers.id });

					if (updatedRows.length > 0) {
						counts.updated++;
						claimedOldHashes.set(claimKey, newHash);
						continue;
					}

					// No row of this entity's config has the old hash. When another config's row has it, the value
					// collided with another entity's submitter value and never got an ID of its own.
					const oldHashRows = await iimRepo.getIDByHash(oldHash, transaction);
					if (oldHashRows.length > 0) {
						counts.collisions++;
					} else {
						counts.withoutId++;
					}
				}
			}
		}
	});

	logger.info(`[IIM rehash]: Finished rehashing generated IDs: ${JSON.stringify(counts)}`);
} catch (error) {
	logger.error(error, '[IIM rehash]: Error rehashing generated IDs, no changes were saved');
	exitCode = 1;
} finally {
	await lyricProvider.shutdown();
	await db.$client.end();
}

process.exit(exitCode);
