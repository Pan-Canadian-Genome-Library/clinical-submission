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
import { env } from '@/config/envConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance, type PostgresDb } from '@/db/index.js';
import {
	findIDByHash,
	generateHash,
	generateID,
	getNextSequenceValue,
	retrieveIIMConfiguration,
} from '@/internal/id-manager/utils.js';
import iimService from '@/service/idManagerService.js';

const processInsertedRecords = async (insertedRecords: SubmittedDataResponse[], db: PostgresDb) => {
	const iimRepo = iimService(db);

	for (const record of insertedRecords) {
		const entityIIMConfig = await retrieveIIMConfiguration(record.entityName);

		if (!entityIIMConfig) {
			logger.error(
				`[Middleware/IIM]: ${record.entityName} does NOT exist in IIM configuration table. Configuration record must be added prior.`,
			);

			throw new lyricProvider.utils.errors.InternalServerError(
				'The Internal ID Manager is misconfigured. Please check configuration and try again later.',
			);
		}

		const entityToHash = entityIIMConfig.fieldName;
		const hashableData = record.data[entityToHash];

		if (hashableData === undefined) {
			logger.error(`[Middleware/IIM]: ${entityToHash} does NOT exist in record. IIM may be misconfigured.`);

			throw new lyricProvider.utils.errors.InternalServerError(
				'The Internal ID Manager is misconfigured. Please check configuration and try again later.',
			);
		}

		const idmHash = generateHash(String(hashableData), env.ID_MANAGER_SECRET);

		const existingHashEntry = await findIDByHash(idmHash);

		if (existingHashEntry) {
			//TODO: make this a better error message
			throw new lyricProvider.utils.errors.BadRequest(
				`Hashed record already exists in IIM table. Data must be unique.`,
			);
		}

		const nextSequence = await getNextSequenceValue(entityIIMConfig.sequenceName);
		if (!nextSequence) {
			logger.error(
				`[Middleware/IIM]: Error creating new IIM record. IIM Config somehow references an unknown sequence? ${entityIIMConfig.sequenceName}`,
			);
			throw new lyricProvider.utils.errors.InternalServerError('Unable to create IIM record. Cannot generate ID.');
		}

		const generatedID = generateID(nextSequence, entityIIMConfig.prefix, entityIIMConfig.paddingLength);

		const createID = await iimRepo.createIDRecord({
			sourceHash: idmHash,
			configId: entityIIMConfig.id,
			generatedId: generatedID,
		});

		if (!createID) {
			throw new lyricProvider.utils.errors.BadRequest(`Unable to create IIM record with provided data.`);
		}

		return createID;
	}
};

export const onFinishCommitCallback = (resultOnCommit: ResultOnCommit) => {
	const { data } = resultOnCommit;
	const db = getDbInstance();

	/**
	 * For now, we only care about updating IIM data on insert.
	 */
	if (!data?.inserts) {
		return;
	}

	Promise.resolve(processInsertedRecords(data.inserts, db));
};
