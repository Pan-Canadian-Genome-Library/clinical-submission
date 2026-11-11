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
import { generateIdForRecord, retrieveAllIIMConfigurations } from '@/internal/id-manager/utils.js';

const processInsertedRecords = async (insertedRecords: SubmittedDataResponse[]) => {
	const allIDConfigs = await retrieveAllIIMConfigurations();

	let numberOfInsertedRecords = 0;
	let numberOfErroredRecords = 0;
	let numberOfSkippedRecords = 0;

	if (!allIDConfigs) {
		logger.error(
			`[Middleware/IIM]: No ID config records exist in IIM configuration table. Configuration records must be added prior to attempting to use the IIM.`,
		);
		return;
	}

	for (const record of insertedRecords) {
		const entityIIMConfig = allIDConfigs.find((configRecord) => configRecord.entityName === record.entityName);

		/**
		 * Skip any records which don't have a config record associated with it, we don't need to hash these.
		 */
		if (!entityIIMConfig) {
			logger.debug(`[Middleware/IIM]: ${record.entityName} does NOT exist in IIM configuration table. Skipping...`);
			numberOfSkippedRecords++;
			continue;
		}

		const hashableData = record.data[entityIIMConfig.fieldName];

		if (hashableData === undefined) {
			logger.error(
				`[Middleware/IIM]: ${entityIIMConfig.fieldName} does NOT exist in table referenced. IIM may be misconfigured.`,
			);
			numberOfErroredRecords++;
			continue;
		}

		// The organization of a submitted record is its study ID. The ID is scoped to the entity and study, so the
		// same submitter value gets its own PCGL ID in each entity and each study.
		const generateResult = await generateIdForRecord({
			idConfig: entityIIMConfig,
			studyId: record.organization,
			value: String(hashableData),
		});

		if (generateResult.outcome === 'alreadyExists') {
			logger.info(
				`[Middleware/IIM]: ${generateResult.generatedId} record already exists in IIM table. Data must be unique.`,
			);
			numberOfErroredRecords++;
			continue;
		}

		if (generateResult.outcome === 'missingSequence') {
			logger.error(
				`[Middleware/IIM]: Error creating new IIM record. IIM Config somehow references an unknown sequence? ${entityIIMConfig.sequenceName}`,
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

	logger.info(`[Middleware/IIM]: Number of ID records generated: ${JSON.stringify(recordStats)}`);
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
		logger.error(`[Middleware/IIM]: Error processing inserted records: ${error}`);
		// We don't want to throw an error here. We just log the error and continue.
	}
};
