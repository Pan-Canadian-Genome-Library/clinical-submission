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

import { asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { logger } from '@/common/logger.js';
import type { StudyDTO } from '@/common/types/study.js';
import { CreateStudyFields } from '@/common/validation/study-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { PostgresDb } from '@/db/index.js';
import { study } from '@/db/schemas/studiesSchema.js';
import { PostgresTransaction } from '@/db/types.js';
import { isPostgresError, PostgresErrors } from '@/db/utils.js';
import {
	convertFromRecordToStudyDTO,
	convertToRecordFromPartialStudyDTO,
	convertToRecordFromStudyDTO,
} from '@/service/dtoConversion.js';

const studyService = (db: PostgresDb) => ({
	listStudies: async ({
		orderBy = 'asc',
		page = 1,
		pageSize = 20,
	}: {
		orderBy?: string;
		page?: number;
		pageSize?: number;
	}): Promise<StudyDTO[]> => {
		let studyRecords;
		try {
			studyRecords = await db
				.select()
				.from(study)
				.orderBy(orderBy === 'desc' ? desc(study.created_at) : asc(study.created_at))
				.limit(pageSize)
				.offset((page - 1) * pageSize);
		} catch (exception) {
			logger.error('Error at listStudies', exception);
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while fetching studies. Please try again later.',
			);
		}
		return studyRecords.map((studies) => convertFromRecordToStudyDTO(studies));
	},

	getStudyById: async (studyId: string): Promise<StudyDTO | undefined> => {
		let studyRecords;
		try {
			studyRecords = await db.select().from(study).where(eq(study.study_id, studyId));
		} catch (exception) {
			logger.error('Error at getStudyById', exception);
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while fetching your requested study. Please try again later.',
			);
		}

		if (studyRecords[0]) {
			return convertFromRecordToStudyDTO(studyRecords[0]);
		}

		return studyRecords[0];
	},

	createStudy: async (
		studyData: CreateStudyFields,
		transaction?: PostgresTransaction,
	): Promise<StudyDTO | undefined> => {
		const dbDriver = transaction ? transaction : db;

		try {
			const newStudyRecord = await dbDriver.insert(study).values(convertToRecordFromStudyDTO(studyData)).returning();

			if (newStudyRecord[0]) {
				return convertFromRecordToStudyDTO(newStudyRecord[0]);
			}

			return newStudyRecord[0];
		} catch (error) {
			const postgresError = isPostgresError(error);

			switch (postgresError?.code) {
				case PostgresErrors.UNIQUE_KEY_VIOLATION:
					throw new lyricProvider.utils.errors.BadRequest(
						`${studyData.studyId} already exists in studies. Study name must be unique.`,
					);
				case PostgresErrors.FOREIGN_KEY_VIOLATION:
					throw new lyricProvider.utils.errors.BadRequest(
						`${studyData.dacId} does not appear to be a valid DAC ID, please ensure this DAC record exists prior to creating a study.`,
					);
				default:
					logger.error('Error at createStudy in StudyService', error);
					throw new lyricProvider.utils.errors.InternalServerError(
						'Something went wrong while creating a new study. Please try again later.',
					);
			}
		}
	},

	deleteStudy: async (studyId: string): Promise<StudyDTO | undefined> => {
		try {
			const deletedRecord = await db.delete(study).where(eq(study.study_id, studyId)).returning();
			if (deletedRecord[0]) {
				return convertFromRecordToStudyDTO(deletedRecord[0]);
			}

			return deletedRecord[0];
		} catch (error) {
			logger.error('Error at deleteStudy in StudyService', error);

			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while deleting this requested study. Please try again later.',
			);
		}
	},

	updateStudy: async (studyId: string, studyData: Partial<StudyDTO>): Promise<StudyDTO | undefined> => {
		try {
			const convertedStudyData = convertToRecordFromPartialStudyDTO(studyData);

			const updatedRecord = await db
				.update(study)
				.set({ ...convertedStudyData, updated_at: sql`NOW()` })
				.where(eq(study.study_id, studyId))
				.returning();

			if (updatedRecord[0]) {
				return convertFromRecordToStudyDTO(updatedRecord[0]);
			}

			return updatedRecord[0];
		} catch (error) {
			logger.error('Error at updateStudy in StudyService', error);

			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while updating the requested study. Please try again later.',
			);
		}
	},
	getStudiesByCategoryId: async (categoryId: number) => {
		try {
			return await db.select().from(study).where(eq(study.category_id, categoryId));
		} catch (error) {
			logger.error('Error at getStudiesByCategoryId service', error);
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while fetching studies for category. Please try again later.',
			);
		}
	},
	getStudiesByCategoryIds: async (categoryIds: number[]) => {
		try {
			return await db.select().from(study).where(inArray(study.category_id, categoryIds));
		} catch (error) {
			logger.error('Error at getStudiesByCategoryIds service', error);
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while fetching studies for category. Please try again later.',
			);
		}
	},
	unlinkStudiesFromCategory: async (categoryId: number) => {
		try {
			return await db.update(study).set({ category_id: null }).where(eq(study.category_id, categoryId));
		} catch (error) {
			logger.error('Error at unlinkStudiesFromCategory service', error);
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while unlinking studies from category. Please try again later.',
			);
		}
	},
});

export { studyService };
