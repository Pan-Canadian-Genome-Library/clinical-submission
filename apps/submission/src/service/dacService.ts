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

import { asc, desc, eq, sql } from 'drizzle-orm';

import { logger } from '@/common/logger.js';
import { DACFields } from '@/common/types/dac.js';
import { CreateDacDataFields, UpdateDacDataFields } from '@/common/validation/dac-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { PostgresDb } from '@/db/index.js';
import { dac } from '@/db/schemas/dacSchema.js';
import { isPostgresError, PostgresErrors } from '@/db/utils.js';

const dacService = (db: PostgresDb) => {
	return {
		listAllDac: async ({
			orderBy = 'asc',
			page = 1,
			pageSize = 20,
		}: {
			orderBy?: string;
			page?: number;
			pageSize?: number;
		}): Promise<DACFields[] | undefined> => {
			let dacRecord: DACFields[];

			try {
				dacRecord = await db
					.select({
						dacId: dac.dac_id,
						dacName: dac.dac_name,
						dacDescription: dac.dac_description,
						contactName: dac.contact_name,
						contactEmail: dac.contact_email,
						createdAt: dac.created_at,
						updatedAt: dac.updated_at,
					})
					.from(dac)
					.orderBy(orderBy === 'desc' ? desc(dac.created_at) : asc(dac.created_at))
					.limit(pageSize)
					.offset((page - 1) * pageSize);

				return dacRecord;
			} catch (error) {
				logger.error(error, 'Error at getAllDac service');

				throw new lyricProvider.utils.errors.InternalServerError(
					'Something went wrong while fetching your dac users. Please try again later.',
				);
			}
		},
		getDacById: async (dacId: string): Promise<DACFields | undefined> => {
			let dacRecord: DACFields[];
			try {
				dacRecord = await db
					.select({
						dacId: dac.dac_id,
						dacName: dac.dac_name,
						dacDescription: dac.dac_description,
						contactName: dac.contact_name,
						contactEmail: dac.contact_email,
						createdAt: dac.created_at,
						updatedAt: dac.updated_at,
					})
					.from(dac)
					.where(eq(dac.dac_id, dacId));

				return dacRecord[0];
			} catch (error) {
				logger.error(error, 'Error at getDacById service');

				throw new lyricProvider.utils.errors.InternalServerError(
					'Something went wrong while fetching your dac user. Please try again later.',
				);
			}
		},
		getDacByName: async (dacName: string): Promise<DACFields | undefined> => {
			try {
				const [dacRecord] = await db
					.select({
						dacId: dac.dac_id,
						dacName: dac.dac_name,
						dacDescription: dac.dac_description,
						contactName: dac.contact_name,
						contactEmail: dac.contact_email,
						createdAt: dac.created_at,
						updatedAt: dac.updated_at,
					})
					.from(dac)
					.where(eq(dac.dac_name, dacName));

				return dacRecord;
			} catch (error) {
				logger.error(error, 'Error at getDacByName service');

				throw new lyricProvider.utils.errors.InternalServerError(
					'Something went wrong while fetching your dac user. Please try again later.',
				);
			}
		},
		saveDac: async ({
			contactEmail,
			contactName,
			dacDescription,
			dacName,
		}: CreateDacDataFields): Promise<DACFields | undefined> => {
			let dacRecord: DACFields[];
			try {
				dacRecord = await db
					.insert(dac)
					.values({
						dac_name: dacName,
						dac_description: dacDescription,
						contact_name: contactName,
						contact_email: contactEmail,
					})
					.returning({
						dacId: dac.dac_id,
						dacName: dac.dac_name,
						dacDescription: dac.dac_description,
						contactName: dac.contact_name,
						contactEmail: dac.contact_email,
						createdAt: dac.created_at,
						updatedAt: dac.updated_at,
					});

				return dacRecord[0];
			} catch (error) {
				logger.error(error, 'Error at saveDac service');

				const postgresError = isPostgresError(error);

				switch (postgresError?.code) {
					case PostgresErrors.UNIQUE_KEY_VIOLATION:
						throw new lyricProvider.utils.errors.BadRequest(
							`${dacName} already exists in DAC. DAC name must be unique.`,
						);
					default:
						throw new lyricProvider.utils.errors.InternalServerError(
							'Something went wrong while creating your dac user. Please try again later.',
						);
				}
			}
		},
		deleteDacById: async (dacId: string): Promise<Pick<DACFields, 'dacId'> | undefined> => {
			try {
				const dacRecord = await db.delete(dac).where(eq(dac.dac_id, dacId)).returning({ dacId: dac.dac_id });

				return dacRecord[0];
			} catch (error) {
				logger.error(error, 'Error at deleteDac service');

				throw new lyricProvider.utils.errors.InternalServerError(
					'Something went wrong while deleting your dac user. Please try again later.',
				);
			}
		},
		updateDacById: async (
			dacId: string,
			{ dacName, contactEmail, contactName, dacDescription }: UpdateDacDataFields,
		): Promise<DACFields | undefined> => {
			let dacRecord: DACFields[];

			try {
				dacRecord = await db
					.update(dac)
					.set({
						dac_name: dacName,
						dac_description: dacDescription,
						contact_name: contactName,
						contact_email: contactEmail,
						updated_at: sql`NOW()`,
					})
					.where(eq(dac.dac_id, dacId))
					.returning({
						dacId: dac.dac_id,
						dacName: dac.dac_name,
						dacDescription: dac.dac_description,
						contactName: dac.contact_name,
						contactEmail: dac.contact_email,
						createdAt: dac.created_at,
						updatedAt: dac.updated_at,
					});

				return dacRecord[0];
			} catch (error) {
				logger.error(error, 'Error at updateDacById service');

				throw new lyricProvider.utils.errors.InternalServerError(
					'Something went wrong while updating your dac user. Please try again later.',
				);
			}
		},
	};
};

export default dacService;
