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

import type { ResultOnCommit, SubmittedDataResponse } from '@overture-stack/lyric';

import { logger } from '@/common/logger.js';
import { getDbInstance } from '@/db/index.js';
import { generateIdForRecord, retrieveAllIIMConfigurations } from '@/internal/id-manager/utils.js';
import iimService from '@/service/idManagerService.js';

/**
 * Generates and stores a PCGL ID for each inserted record of an entity in the ID manager config. Records of other
 * entities are skipped. Each ID is scoped to the record's entity and study, and records are handled one at a time,
 * outside of any transaction, so the IDs stored before a failure are kept.
 *
 * A record is counted as errored, logged, and left without a new ID when:
 * - it has no value in the config's `fieldName`.
 * - it already has a PCGL ID.
 * - the config's sequence returns no value.
 *
 * @returns The number of records given an ID (`inserted`), `skipped` and `errored`, or `undefined` when the ID manager
 * config is empty, in which case no ID is generated.
 * @throws `Error` when the database can't be read or written. Records after the failing one are not
 * processed.
 */
const processInsertedRecords = async (
	insertedRecords: SubmittedDataResponse[],
): Promise<{ inserted: number; skipped: number; errored: number } | undefined> => {
	const iimRepo = iimService(getDbInstance());
	const allIDConfigs = await retrieveAllIIMConfigurations();

	let numberOfInsertedRecords = 0;
	let numberOfErroredRecords = 0;
	let numberOfSkippedRecords = 0;

	if (!allIDConfigs) {
		logger.error(
			`[IIM commit]: No ID config records exist in IIM configuration table. Configuration records must be added prior to attempting to use the IIM.`,
		);
		return;
	}

	for (const record of insertedRecords) {
		const entityIIMConfig = allIDConfigs.find((configRecord) => configRecord.entityName === record.entityName);

		/**
		 * Skip any records which don't have a config record associated with it, we don't need to hash these.
		 */
		if (!entityIIMConfig) {
			logger.debug(`[IIM commit]: ${record.entityName} does NOT exist in IIM configuration table. Skipping...`);
			numberOfSkippedRecords++;
			continue;
		}

		const hashableData = record.data[entityIIMConfig.fieldName];

		if (hashableData === undefined) {
			logger.error(
				`[IIM commit]: ${entityIIMConfig.fieldName} does NOT exist in table referenced. IIM may be misconfigured.`,
			);
			numberOfErroredRecords++;
			continue;
		}

		const generateResult = await generateIdForRecord(iimRepo, {
			idConfig: entityIIMConfig,
			studyId: record.organization,
			value: String(hashableData),
		});

		if (generateResult.outcome === 'alreadyExists') {
			logger.info(
				`[IIM commit]: ${generateResult.generatedId} record already exists in IIM table. Data must be unique.`,
			);
			numberOfErroredRecords++;
			continue;
		}

		if (generateResult.outcome === 'missingSequence') {
			logger.error(
				`[IIM commit]: Error creating new IIM record. IIM Config somehow references an unknown sequence? ${entityIIMConfig.sequenceName}`,
			);
			numberOfErroredRecords++;
			continue;
		}

		numberOfInsertedRecords++;
	}

	const recordStats = {
		inserted: numberOfInsertedRecords,
		skipped: numberOfSkippedRecords,
		errored: numberOfErroredRecords,
	};

	logger.info(`[IIM commit]: Number of ID records generated: ${JSON.stringify(recordStats)}`);
	return recordStats;
};

export const onFinishCommitCallback = async (resultOnCommit: ResultOnCommit) => {
	const { data } = resultOnCommit;

	/**
	 * For now, we only care about updating IIM data on insert.
	 */
	if (!data?.inserts) {
		return;
	}

	try {
		await processInsertedRecords(data.inserts);
	} catch (error) {
		logger.error(`[IIM commit]: Error processing inserted records: ${error}`);
		// We don't want to throw an error here. We just log the error and continue.
	}
};
