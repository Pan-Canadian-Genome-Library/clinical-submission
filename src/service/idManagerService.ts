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

import { eq } from 'drizzle-orm';

import { logger } from '@/common/logger.js';
import { type IIMConfigObject } from '@/common/validation/id-manager-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { PostgresDb } from '@/db/index.js';
import { generatedIdentifiers, idGenerationConfig } from '@/db/schemas/idGenerationConfig.js';
import { PostgresTransaction } from '@/db/types.js';
import { isPostgresError, PostgresErrors } from '@/db/utils.js';

const iimService = (db: PostgresDb) => ({
	addIIMConfig: async (iimData: IIMConfigObject, transaction?: PostgresTransaction) => {
		const dbTransaction = transaction ?? db;
		return dbTransaction.transaction(async (transaction) => {
			try {
				const record = await transaction
					.insert(idGenerationConfig)
					.values({
						entityName: iimData.entityName,
						fieldName: iimData.fieldName,
						paddingLength: iimData.paddingLength,
						prefix: iimData.prefix,
						sequenceName: iimData.sequenceName,
						sequenceStart: iimData.sequenceStart,
					})
					.returning();

				return record;
			} catch (exception) {
				const postgresError = isPostgresError(exception);
				if (postgresError && postgresError.code === PostgresErrors.UNIQUE_KEY_VIOLATION) {
					logger.debug(
						`[IIM]: Can't insert record {"entityName: "${iimData.entityName}", "fieldName": "${iimData.fieldName}", "sequenceName": "${iimData.sequenceName}" ...}. This record already exists within the IIM Configuration table, skipping...`,
					);
					return;
				} else {
					logger.error(`[IIM]: Unable to insert IIM Configuration into database. ${exception}`);
					throw new lyricProvider.utils.errors.InternalServerError('Unable to insert a IIM Configuration');
				}
			}
		});
	},

	getIIMConfig: async (entityName: IIMConfigObject['entityName'], transaction?: PostgresTransaction) => {
		const dbTransaction = transaction ?? db;
		return dbTransaction.transaction(async (transaction) => {
			try {
				return await transaction.select().from(idGenerationConfig).where(eq(idGenerationConfig.entityName, entityName));
			} catch (exception) {
				logger.error(`[IIM]: Unexpected error retrieving IIM Configuration. ${exception}`);
				throw new lyricProvider.utils.errors.InternalServerError('Unexpected error retrieving IIM Configuration');
			}
		});
	},

	getIDByHash: async (hashedValue: string, transaction?: PostgresTransaction) => {
		const dbTransaction = transaction ?? db;
		return dbTransaction.transaction(async (transaction) => {
			try {
				return await transaction
					.select()
					.from(generatedIdentifiers)
					.where(eq(generatedIdentifiers.sourceHash, hashedValue));
			} catch (exception) {
				logger.error(`[IIM]: Unexpected error retrieving ID . ${exception}`);
				throw new lyricProvider.utils.errors.InternalServerError('Unexpected error retrieving ID');
			}
		});
	},

	createIMMSequence: async () => {
		// await transaction.execute(sql`CREATE SEQUENCE ${iimData.sequenceName} START ${iimData.sequenceStart};`);
	},
});

export default iimService;
