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

import { eq, sql } from 'drizzle-orm';
import { QueryResult } from 'pg';

import { logger } from '@/common/logger.js';
import { type IIMConfigObject } from '@/common/validation/id-manager-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { PostgresDb } from '@/db/index.js';
import { generatedIdentifiers, idGenerationConfig } from '@/db/schemas/idGenerationConfig.js';
import type { GeneratedIdentifiersTable, IDGenerationConfigRecord, PostgresTransaction } from '@/db/types.js';
import { isPostgresError, PostgresErrors } from '@/db/utils.js';

const generateSequenceName = (iimData: IIMConfigObject): string => {
	return `${iimData.entityName}_${iimData.fieldName}_seq`.toLowerCase();
};

const iimService = (db: PostgresDb) => ({
	addIIMConfig: async (iimData: IIMConfigObject, transaction?: PostgresTransaction) => {
		const dbTransaction = transaction ?? db;

		try {
			const record = await dbTransaction
				.insert(idGenerationConfig)
				.values({
					entityName: iimData.entityName.toLowerCase().trim(),
					fieldName: iimData.fieldName,
					paddingLength: iimData.paddingLength,
					prefix: iimData.prefix,
					sequenceName: generateSequenceName(iimData),
					sequenceStart: iimData.sequenceStart,
				})
				.returning();

			return record;
		} catch (exception) {
			const postgresError = isPostgresError(exception);
			if (postgresError && postgresError.code === PostgresErrors.UNIQUE_KEY_VIOLATION) {
				logger.debug(
					`[IIM]: Can't insert record {"entityName: "${iimData.entityName}"...}. This record already exists within the IIM Configuration table, skipping...`,
				);
				return;
			} else {
				logger.error(`[IIM]: Unable to insert IIM Configuration into database. ${exception}`);
				throw new lyricProvider.utils.errors.InternalServerError('Unable to initialize IIM Service.');
			}
		}
	},

	getAllIIMConfigs: async (transaction?: PostgresTransaction): Promise<IDGenerationConfigRecord[]> => {
		const dbTransaction = transaction ?? db;
		try {
			return await dbTransaction.select().from(idGenerationConfig);
		} catch (exception) {
			logger.error(`[IIM]: Unexpected error retrieving IIM all configurations. ${exception}`);
			throw new lyricProvider.utils.errors.InternalServerError(
				'IIM service encountered an Unexpected error retrieving IIM configurations.',
			);
		}
	},

	getIIMConfig: async (
		entityName: IIMConfigObject['entityName'],
		transaction?: PostgresTransaction,
	): Promise<IDGenerationConfigRecord[]> => {
		const dbTransaction = transaction ?? db;

		try {
			return await dbTransaction.select().from(idGenerationConfig).where(eq(idGenerationConfig.entityName, entityName));
		} catch (exception) {
			logger.error(`[IIM]: Unexpected error retrieving IIM Configuration. ${exception}`);
			throw new lyricProvider.utils.errors.InternalServerError(
				'IIM service encountered an Unexpected error retrieving IIM Configuration.',
			);
		}
	},

	getIDByHash: async (hashedValue: string, transaction?: PostgresTransaction) => {
		const dbTransaction = transaction ?? db;

		try {
			return await dbTransaction
				.select()
				.from(generatedIdentifiers)
				.where(eq(generatedIdentifiers.sourceHash, hashedValue));
		} catch (exception) {
			logger.error(`[IIM]: Unexpected error retrieving ID . ${exception}`);
			throw new lyricProvider.utils.errors.InternalServerError(
				'IIM Service encountered an unexpected error while retrieving generated ID.',
			);
		}
	},

	getNextSequenceValue: async (sequenceName: string) => {
		try {
			const nextValue: QueryResult<Record<'nextval', number>> = await db.execute(sql`SELECT nextval(${sequenceName})`);
			return nextValue.rows[0] ? nextValue.rows[0].nextval : undefined;
		} catch (exception) {
			logger.error(`[IIM]: Unexpected error getting next sequence value. ${exception}`);
			throw new lyricProvider.utils.errors.InternalServerError(
				'IIM Service encountered an unexpected error while retrieving next IIM sequence value.',
			);
		}
	},

	createIDRecord: async (IdRecord: GeneratedIdentifiersTable, transaction?: PostgresTransaction) => {
		const dbTransaction = transaction ?? db;

		try {
			const record = await dbTransaction.insert(generatedIdentifiers).values(IdRecord).returning();
			return record;
		} catch (exception) {
			const postgresError = isPostgresError(exception);
			if (postgresError && postgresError.code === PostgresErrors.UNIQUE_KEY_VIOLATION) {
				logger.error(
					`[IIM]: Can't insert record with ID ${IdRecord.generatedId}. Record already exists within the table.`,
				);
				throw new lyricProvider.utils.errors.BadRequest(
					`Unable to create new ID record ${IdRecord.generatedId}. ID already exists, but must be unique.`,
				);
			} else {
				logger.error(`[IIM]: Unexpected error. Unable to insert new generated ID record. ${exception}`);
				throw new lyricProvider.utils.errors.InternalServerError(
					'IIM Service encountered an error creating new generated ID.',
				);
			}
		}
	},

	// Generating to public, needs to be in PCGL
	createIMMSequence: async (
		iimData: IIMConfigObject,
		transaction?: PostgresTransaction,
	): Promise<[QueryResult<Record<string, unknown>> | undefined, string]> => {
		const dbTransaction = transaction ?? db;
		const sequenceName = generateSequenceName(iimData);

		try {
			const sequenceCreationResult = await dbTransaction.execute(
				sql.raw(`CREATE SEQUENCE "${sequenceName}" START ${iimData.sequenceStart};`),
			);

			return [sequenceCreationResult, sequenceName];
		} catch (exception) {
			const postgresError = isPostgresError(exception);
			if (postgresError && postgresError.code === PostgresErrors.UNIQUE_KEY_VIOLATION) {
				logger.debug(
					`[IIM]: Can't add sequence ${sequenceName}. This sequence already exists within the IIM Configuration table, skipping...`,
				);
				return [undefined, sequenceName];
			} else if (postgresError && postgresError.code === PostgresErrors.IN_FAILED_SQL_TRANSACTION) {
				logger.debug(
					`[IIM]: Can't add sequence "${sequenceName}". The SQL command prior to this one has caused the SQL transaction to abort. This is not necessarily a fatal error and can be intended behaviour if this function is chained with insertion into the configuration table.`,
				);
				return [undefined, sequenceName];
			} else {
				logger.error(`[IIM]: Unable to create sequence specified by IIM config record. ${exception}`);
				throw new lyricProvider.utils.errors.InternalServerError('Unable to initialize IIM Service.');
			}
		}
	},
});

export default iimService;
