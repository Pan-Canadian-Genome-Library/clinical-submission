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

import { logger } from '@/common/logger.js';
import { type IIMConfig, type IIMConfigObject } from '@/common/validation/id-manager-validation.js';
import { getDbInstance } from '@/db/index.js';
import iimService from '@/service/idManagerService.js';

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
				if (sequenceResult) {
					logger.debug(`[IIM]: Added sequence to DB: ${config.sequenceName} with start ${config.sequenceStart}`);
				}
			} catch (exception) {
				logger.error(
					'[IIM]: IIM not configured! Unable to initialize IIM Config due to DB errors, rolling back configuration...',
				);
			}
		});
	}
};

const retrieveIIMConfiguration = async (entityName: IIMConfigObject['entityName']) => {
	const database = getDbInstance();
	const config = await iimService(database).getIIMConfig(entityName);

	if (config.length && config[0]) {
		return config[0];
	}
	return undefined;
};

const generateHash = (plainText: string, secret: string, outputOptions: BinaryToTextEncoding = 'base64') => {
	return createHmac('sha256', secret).update(plainText).digest(outputOptions);
};

const findIDByHash = async (hashedValue: string) => {
	const database = getDbInstance();
	const hashedRecord = await iimService(database).getIDByHash(hashedValue);

	if (hashedRecord.length && hashedRecord[0]) {
		return hashedRecord[0];
	}
	return undefined;
};

const getNextSequenceValue = async (sequenceName: IIMConfigObject['sequenceName']): Promise<number | undefined> => {
	const database = getDbInstance();
	return await iimService(database).getNextSequenceValue(sequenceName);
};

const generateID = (
	nextSequenceValue: number,
	entityPrefix: IIMConfigObject['prefix'],
	paddingLength: IIMConfigObject['paddingLength'],
) => {
	const paddedString = String(nextSequenceValue).padStart(paddingLength, '0');
	return `${entityPrefix}${paddedString}`;
};

export {
	findIDByHash,
	generateHash,
	generateID,
	getNextSequenceValue,
	processIIMConfiguration,
	retrieveIIMConfiguration,
};
