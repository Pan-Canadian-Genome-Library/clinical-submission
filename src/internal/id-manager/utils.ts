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
	try {
		iimEnvConfig.map(async (iimConfig) => {
			const result = await iimService(database).addIIMConfig(iimConfig);
			if (result && result[0]) {
				logger.debug(`[IIM]: Added record to config table: ${JSON.stringify(result[0])}`);
			}
		});
	} catch (exception) {
		logger.error(exception);
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

export { findIDByHash, generateHash, processIIMConfiguration, retrieveIIMConfiguration };
