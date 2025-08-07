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

import { type BinaryToTextEncoding, createHmac } from 'node:crypto';

import { getTableColumns } from 'drizzle-orm';

import { logger } from '@/common/logger.js';
import { StudyModel } from '@/common/types/study.js';
import { type IIMConfig, type IIMConfigObject } from '@/common/validation/id-manager-validation.js';
import { getDbInstance } from '@/db/index.js';
import { study } from '@/db/schemas/studiesSchema.js';
import { GeneratedIdentifiersRecord, type IDGenerationConfigRecord } from '@/db/types.js';
import iimService from '@/service/idManagerService.js';

/**
 * Processes IIM Configuration passed in via the applications environment variables,
 * and inserts them into the IIM Configuration table. It then also creates the associated
 * sequences within the DB.
 *
 * **NOTE:** *This function operates as a transaction, meaning that if insertion of the record
 * into the config table fails, or if the sequence creation fails, the transaction will rollback,
 * leaving the table in a state as to what it was prior.*
 *
 * @param iimEnvConfig The required `ID_MANAGER_CONFIG` environment variable.
 */
const processIIMConfiguration = (iimEnvConfig: IIMConfig) => {
	const database = getDbInstance();
	if (!iimEnvConfig.length) {
		logger.warn('[IIM]: No IIM configurations present.');
	}

	for (const config of iimEnvConfig) {
		database.transaction(async (transaction) => {
			try {
				const recordResult = await iimService(database).addIIMConfig(config, transaction);
				const sequenceResult = await iimService(database).createIMMSequence(config, transaction);
				if (recordResult && recordResult[0]) {
					logger.debug(`[IIM]: Added record to config table: ${JSON.stringify(recordResult[0])}`);
				}

				const [sequenceSQLResult, sequenceName] = sequenceResult;
				if (sequenceSQLResult) {
					logger.debug(`[IIM]: Added sequence to DB: ${sequenceName} with start ${config.sequenceStart}`);
				}
			} catch (exception) {
				logger.error(
					'[IIM]: IIM not configured! Unable to initialize IIM Config due to DB errors, rolling back configuration...',
				);
				return;
			}
		});
	}
};

/**
 * Retrieves all available IIM configurations in the table.
 * @returns `Promise<IDGenerationConfigRecord[] | undefined>` - list of IDGenerationConfigRecords if found, undefined if none.
 */
const retrieveAllIIMConfigurations = async (): Promise<IDGenerationConfigRecord[] | undefined> => {
	const database = getDbInstance();
	const config = await iimService(database).getAllIIMConfigs();

	if (config.length) {
		return config;
	}

	return undefined;
};
/**
 * Retrieves the IIM Configuration variables associated with a particular entity.
 * @param entityName The name of the entity to which this IIM config applies to.
 * @returns `Promise<IDGenerationConfigTable | undefined>` - A promise containing the record from the config table associated with the entity,`undefined` if not found.
 */
const retrieveIIMConfiguration = async (
	entityName: IIMConfigObject['entityName'],
): Promise<IDGenerationConfigRecord | undefined> => {
	const database = getDbInstance();
	const config = await iimService(database).getIIMConfig(entityName);

	if (config.length && config[0]) {
		return config[0];
	}
	return undefined;
};

/**
 * Generates a HMAC SHA-256 hash value using a provided secret. Output can be specified via the `outputOptions` param
 * by default this function outputs in `base64`.
 * @param plainText A string containing the plaintext value that needs to be hashed.
 * @param secret `ID_MANAGER_SECRET` - secret value used to hash the plaintext string.
 * @param outputOptions Which format you would like the hash to output to. By default this is `base64`.
 * @returns Hashed output string in various encoding options, based upon what `outputOptions` is set to. By default this is base64.
 */
const generateHash = (plainText: string, secret: string, outputOptions: BinaryToTextEncoding = 'base64'): string => {
	return createHmac('sha256', secret).update(plainText).digest(outputOptions);
};

/**
 * Finds a ID for an entity based upon its Hashed ID value.
 * @param hashedValue the Hashed ID for an entity.
 * @returns `Promise<IDGenerationConfigRecord | undefined>` - A promise containing the ID record. `undefined` if not found.
 */
const findIDByHash = async (hashedValue: string): Promise<GeneratedIdentifiersRecord | undefined> => {
	const database = getDbInstance();
	const hashedRecord = await iimService(database).getIDByHash(hashedValue);

	if (hashedRecord.length && hashedRecord[0]) {
		return hashedRecord[0];
	}
	return undefined;
};

/**
 * Gets the next value in a specified sequence.
 * @param sequenceName The name of the sequence in the database.
 * @returns `Promise<number | undefined>` - A number containing the next value in the sequence. `undefined` if not found.
 */
const getNextSequenceValue = async (sequenceName: string): Promise<number | undefined> => {
	const database = getDbInstance();
	return await iimService(database).getNextSequenceValue(sequenceName);
};

/**
 * Generates an unique padded ID based upon the next sequence value provided to it via the DB, the prefix for the entity and the padding length.
 * @param nextSequenceValue `number` containing the next sequence value.
 * @param entityPrefix `string` containing the prefix for the ID.
 * @param paddingLength `number` containing the total number of 0's preceding the value.
 * @returns `string` - with the generated ID.
 */
const generateID = (
	nextSequenceValue: number,
	entityPrefix: IIMConfigObject['prefix'],
	paddingLength: IIMConfigObject['paddingLength'],
): string => {
	const paddedString = String(nextSequenceValue).padStart(paddingLength, '0');
	return `${entityPrefix}${paddedString}`;
};

function isValidStudyField(value: string): value is keyof Omit<StudyModel, 'created_at' | 'updated_at'> {
	return Object.keys(getTableColumns(study)).includes(value);
}

export {
	findIDByHash,
	generateHash,
	generateID,
	getNextSequenceValue,
	isValidStudyField,
	processIIMConfiguration,
	retrieveAllIIMConfigurations,
	retrieveIIMConfiguration,
};
