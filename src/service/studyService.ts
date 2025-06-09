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
import type { StudyDTO, StudyModel, StudyRecord } from '@/common/types/study.js';
import { CreateStudyFields } from '@/common/validation/study-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { PostgresDb } from '@/db/index.js';
import { study } from '@/db/schemas/studiesSchema.js';
import { isPostgresError, PostgresErrors } from '@/db/utils.js';

const convertToStudyDTO = (study: StudyRecord): StudyDTO => {
	return {
		studyId: study.study_id,
		dacId: study.dac_id,
		studyName: study.study_name,
		studyDescription: study.study_description,
		programName: study.program_name,
		status: study.status,
		context: study.context,
		domain: study.domain,
		participantCriteria: study.participant_criteria,
		principalInvestigators: study.principal_investigators,
		leadOrganizations: study.lead_organizations,
		collaborators: study.collaborators,
		fundingSources: study.funding_sources,
		publicationLinks: study.publication_links,
		keywords: study.keywords,
		createdAt: study.created_at,
		updatedAt: study.updated_at,
	};
};

const convertFromStudyDTO = (
	studyData: Omit<StudyDTO, 'updatedAt' | 'createdAt'>,
): Omit<StudyModel, 'created_at' | 'updated_at'> => {
	return {
		study_id: studyData.studyId,
		dac_id: studyData.dacId,
		study_name: studyData.studyName,
		study_description: studyData.studyDescription,
		program_name: studyData.programName,
		status: studyData.status,
		context: studyData.context,
		domain: studyData.domain.map((domains) => domains.toUpperCase()),
		participant_criteria: studyData.participantCriteria,
		principal_investigators: studyData.principalInvestigators,
		lead_organizations: studyData.leadOrganizations,
		collaborators: studyData.collaborators,
		funding_sources: studyData.fundingSources,
		publication_links: studyData.publicationLinks,
		keywords: studyData.keywords,
	};
};

const convertFromPartialStudyDTO = (
	studyData: Partial<Omit<StudyDTO, 'updatedAt' | 'createdAt' | 'studyId'>>,
): Partial<Omit<StudyModel, 'created_at' | 'updated_at' | 'study_id'>> => {
	return {
		dac_id: studyData.dacId,
		study_name: studyData.studyName,
		study_description: studyData.studyDescription,
		program_name: studyData.programName,
		status: studyData.status,
		context: studyData.context,
		domain: studyData.domain?.map((domains) => domains.toUpperCase()),
		participant_criteria: studyData.participantCriteria,
		principal_investigators: studyData.principalInvestigators,
		lead_organizations: studyData.leadOrganizations,
		collaborators: studyData.collaborators,
		funding_sources: studyData.fundingSources,
		publication_links: studyData.publicationLinks,
		keywords: studyData.keywords,
	};
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
			logger.error('Error at listStudies', exception);
			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while fetching studies. Please try again later.',
			);
		}
		return studyRecords.map((studies) => convertToStudyDTO(studies));
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
			return convertToStudyDTO(studyRecords[0]);
		}

		return studyRecords[0];
	},

	createStudy: async (studyData: CreateStudyFields): Promise<StudyDTO | undefined> => {
		try {
			const newStudyRecord = await db.insert(study).values(convertFromStudyDTO(studyData)).returning();

			if (newStudyRecord[0]) {
				return convertToStudyDTO(newStudyRecord[0]);
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
				return convertToStudyDTO(deletedRecord[0]);
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
			const convertedStudyData = convertFromPartialStudyDTO(studyData);

			const updatedRecord = await db
				.update(study)
				.set({ ...convertedStudyData, updated_at: sql`NOW()` })
				.where(eq(study.study_id, studyId))
				.returning();

			if (updatedRecord[0]) {
				return convertToStudyDTO(updatedRecord[0]);
			}

			return updatedRecord[0];
		} catch (error) {
			logger.error('Error at updateStudy in StudyService', error);

			throw new lyricProvider.utils.errors.InternalServerError(
				'Something went wrong while updating the requested study. Please try again later.',
			);
		}
	},
});

export { studyService };
