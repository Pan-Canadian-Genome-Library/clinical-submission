/*
 * Copyright (c) 2026 The Ontario Institute for Cancer Research. All rights reserved
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

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { logger } from '@/common/logger.js';
import type { StudyDTO, StudyRecord } from '@/common/types/study.js';
import { StudyTranslationDTO, StudyTranslationRecord } from '@/common/types/studyTranslations.js';
import { StudyTranslationFields, UpsertStudyFields } from '@/common/validation/study-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { PostgresDb } from '@/db/index.js';
import { study, studyIdDefault } from '@/db/schemas/studiesSchema.js';
import { studyTranslations } from '@/db/schemas/studyTranslationsSchema.js';
import { PostgresTransaction } from '@/db/types.js';
import { isPostgresError, PostgresErrors } from '@/db/utils.js';

const convertFromRecordToStudyDTO = (study: StudyRecord): StudyDTO => {
	return {
		studyId: study.study_id,
		dacId: study.dac_id,
		studyName: study.study_name,
		status: study.status,
		context: study.context,
		domain: study.domain,
		principalInvestigators: study.principal_investigators,
		leadOrganizations: study.lead_organizations,
		collaborators: study.collaborators,
		publicationLinks: study.publication_links,
		defaultTranslation: study.default_translation,
		createdAt: study.created_at,
		updatedAt: study.updated_at,
		categoryId: study.category_id,
	};
};

const convertStudyTranslations = (translations: StudyTranslationRecord[]): StudyTranslationDTO[] => {
	return translations.map((translation) => ({
		languageId: translation.language_id,
		studyDescription: translation.study_description,
		fundingSources: translation.funding_sources,
		keywords: translation.keywords,
		participantCriteria: translation.participant_criteria,
		programName: translation.program_name,
		createdAt: translation.created_at,
		updatedAt: translation.updated_at,
	}));
};

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
			logger.error(exception, 'Error at listStudies');
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
			logger.error(exception, 'Error at getStudyById');
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while fetching your requested study. Please try again later.',
			);
		}

		if (studyRecords[0]) {
			return convertFromRecordToStudyDTO(studyRecords[0]);
		}

		return studyRecords[0];
	},
	getStudyByName: async (studyName: string): Promise<StudyDTO | undefined> => {
		try {
			const [studyRecords] = await db.select().from(study).where(eq(study.study_name, studyName));
			if (studyRecords) {
				return convertFromRecordToStudyDTO(studyRecords);
			}

			return;
		} catch (exception) {
			logger.error(exception, 'Error at getStudyByName');
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while fetching your requested study. Please try again later.',
			);
		}
	},

	createStudy: async (
		studyData: UpsertStudyFields,
		transaction?: PostgresTransaction,
	): Promise<StudyDTO | undefined> => {
		const dbDriver = transaction ? transaction : db;

		try {
			// Create CTE to insert translation first
			const insertTranslation = dbDriver.$with('insert_translation').as(
				dbDriver
					.insert(studyTranslations)
					.values({
						study_id: studyIdDefault,
						language_id: studyData.defaultLanguage,
						study_description: studyData.studyDescription,
						program_name: studyData.programName,
						keywords: studyData.keywords,
						participant_criteria: studyData.participantCriteria,
						funding_sources: studyData.fundingSources,
					})
					.returning(),
			);

			// Insert study using the translation_id from the CTE
			const studyResult = await dbDriver
				.with(insertTranslation)
				.insert(study)
				.values({
					study_id: sql`(SELECT study_id FROM ${insertTranslation})`,
					default_translation: sql`(SELECT study_translation_id FROM ${insertTranslation})`,
					dac_id: studyData.dacId,
					study_name: studyData.studyName,
					status: studyData.status,
					context: studyData.context,
					domain: studyData.domain.map((domains) => domains.toUpperCase()),
					principal_investigators: studyData.principalInvestigators,
					lead_organizations: studyData.leadOrganizations,
					collaborators: studyData.collaborators,
					category_id: studyData.categoryId,
					publication_links: studyData.publicationLinks,
				})
				.returning();

			if (!studyResult[0]) {
				logger.error(`No results returned from the insertTranslation CTE for study ${studyData.studyName}`);
				throw new Error();
			}

			// Format return object
			const translationResult = await dbDriver
				.select()
				.from(studyTranslations)
				.where(eq(studyTranslations.study_id, studyResult[0].study_id));

			// Group translations into an array
			if (translationResult.length > 0 && translationResult[0]) {
				const resultTranslations = convertStudyTranslations(translationResult);

				return {
					...convertFromRecordToStudyDTO(studyResult[0]),
					translations: resultTranslations,
				};
			}
			return undefined;
		} catch (error) {
			const postgresError = isPostgresError(error);

			switch (postgresError?.code) {
				case PostgresErrors.UNIQUE_KEY_VIOLATION:
					throw new lyricProvider.utils.errors.BadRequest(
						`${studyData.studyName} already exists in studies. Study name must be unique.`,
					);
				case PostgresErrors.FOREIGN_KEY_VIOLATION:
					throw new lyricProvider.utils.errors.BadRequest(
						`${studyData.dacId} does not appear to be a valid DAC ID, please ensure this DAC record exists prior to creating a study.`,
					);
				default:
					logger.error(error, 'Error at createStudy in StudyService');
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
			logger.error(error, 'Error at deleteStudy in StudyService');

			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while deleting this requested study. Please try again later.',
			);
		}
	},
	updateStudy: async (studyId: string, studyData: Partial<StudyDTO>): Promise<StudyDTO | undefined> => {
		try {
			const updatedRecord = await db
				.update(study)
				.set({
					dac_id: studyData.dacId,
					study_name: studyData.studyName,
					status: studyData.status,
					context: studyData.context,
					domain: studyData.domain?.map((domains) => domains.toUpperCase()),
					principal_investigators: studyData.principalInvestigators,
					lead_organizations: studyData.leadOrganizations,
					collaborators: studyData.collaborators,
					publication_links: studyData.publicationLinks,
					category_id: studyData.categoryId,
					updated_at: sql`NOW()`,
				})
				.where(eq(study.study_id, studyId))
				.returning();

			if (updatedRecord[0]) {
				return convertFromRecordToStudyDTO(updatedRecord[0]);
			}

			return updatedRecord[0];
		} catch (error) {
			logger.error(error, 'Error at updateStudy in StudyService');

			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while updating the requested study. Please try again later.',
			);
		}
	},
	getStudiesByCategoryId: async (categoryId: number) => {
		try {
			return await db.select().from(study).where(eq(study.category_id, categoryId));
		} catch (error) {
			logger.error(error, 'Error at getStudiesByCategoryId service');
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while fetching studies for category. Please try again later.',
			);
		}
	},
	getStudiesByCategoryIds: async (categoryIds: number[]) => {
		try {
			return await db.select().from(study).where(inArray(study.category_id, categoryIds));
		} catch (error) {
			logger.error(error, 'Error at getStudiesByCategoryIds service');
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while fetching studies for category. Please try again later.',
			);
		}
	},
	unlinkStudiesFromCategory: async (categoryId: number) => {
		try {
			return await db.update(study).set({ category_id: null }).where(eq(study.category_id, categoryId));
		} catch (error) {
			logger.error(error, 'Error at unlinkStudiesFromCategory service');
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while unlinking studies from category. Please try again later.',
			);
		}
	},
	// STUDY TRANSLATIONS
	createStudyTranslation: async (
		translations: StudyTranslationFields & { studyId: string },
	): Promise<StudyTranslationDTO | undefined> => {
		try {
			const result = await db
				.insert(studyTranslations)
				.values({
					study_id: translations.studyId,
					language_id: translations.languageId,
					study_description: translations.studyDescription,
					program_name: translations.programName,
					keywords: translations.keywords,
					participant_criteria: translations.participantCriteria,
					funding_sources: translations.fundingSources,
				})
				.returning({
					studyId: studyTranslations.study_id,
					languageId: studyTranslations.language_id,
					studyDescription: studyTranslations.study_description,
					programName: studyTranslations.program_name,
					keywords: studyTranslations.keywords,
					participantCriteria: studyTranslations.participant_criteria,
					fundingSources: studyTranslations.funding_sources,
					createdAt: studyTranslations.created_at,
					updatedAt: studyTranslations.updated_at,
				});

			return result[0];
		} catch (error) {
			logger.error(error, 'Error at createStudyTranslation service');
			const postgresError = isPostgresError(error);

			switch (postgresError?.code) {
				case PostgresErrors.UNIQUE_KEY_VIOLATION:
					throw new lyricProvider.utils.errors.BadRequest(
						`${translations.languageId} already exists in studies. Study name must be unique.`,
					);
				default:
					logger.error(error, 'Error at createStudy in StudyService');
					throw new lyricProvider.utils.errors.InternalServerError(
						'Something went wrong while creating a new study. Please try again later.',
					);
			}
		}
	},
	updateStudyTranslation: async (
		translations: StudyTranslationFields & { studyId: string },
	): Promise<StudyTranslationDTO | undefined> => {
		try {
			const result = await db
				.update(studyTranslations)
				.set({
					study_description: translations.studyDescription,
					program_name: translations.programName,
					keywords: translations.keywords,
					participant_criteria: translations.participantCriteria,
					funding_sources: translations.fundingSources,
				})
				.where(
					and(
						eq(studyTranslations.language_id, translations.languageId),
						eq(studyTranslations.study_id, translations.studyId),
					),
				)
				.returning({
					studyId: studyTranslations.study_id,
					languageId: studyTranslations.language_id,
					studyDescription: studyTranslations.study_description,
					programName: studyTranslations.program_name,
					keywords: studyTranslations.keywords,
					participantCriteria: studyTranslations.participant_criteria,
					fundingSources: studyTranslations.funding_sources,
					createdAt: studyTranslations.created_at,
					updatedAt: studyTranslations.updated_at,
				});

			return result[0];
		} catch (error) {
			logger.error(error, 'Error at updateStudyTranslation service');
			const postgresError = isPostgresError(error);

			switch (postgresError?.code) {
				case PostgresErrors.UNIQUE_KEY_VIOLATION:
					throw new lyricProvider.utils.errors.BadRequest(
						`${translations.languageId} already exists in studies. Study name must be unique.`,
					);
				default:
					logger.error(error, 'Error at createStudy in StudyService');
					throw new lyricProvider.utils.errors.InternalServerError(
						'Something went wrong while creating a new study. Please try again later.',
					);
			}
		}
	},
});

export { studyService };
