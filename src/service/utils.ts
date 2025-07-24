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

import { StudyDTO, StudyModel, StudyRecord } from '@/common/types/study.js';

export const convertToStudyDTO = (study: StudyRecord): StudyDTO => {
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

export const convertFromStudyDTO = (
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

export const convertFromPartialStudyDTO = (
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
