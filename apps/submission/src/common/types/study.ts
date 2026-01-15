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

import { study } from '@/db/schemas/studiesSchema.js';

export const StudyStatus = {
	ONGOING: 'Ongoing',
	COMPLETED: 'Completed',
} as const;

export type StudyStatusValues = (typeof StudyStatus)[keyof typeof StudyStatus];

export const StudyContext = {
	CLINICAL: 'Clinical',
	RESEARCH: 'Research',
} as const;

export type StudyContextValues = (typeof StudyContext)[keyof typeof StudyContext];

export type StudyDTO = {
	studyId: string;
	dacId: string;
	studyName: string;
	studyDescription: string;
	programName?: string | null;
	keywords?: string[] | null;
	status: StudyStatusValues;
	context: StudyContextValues;
	domain: string[];
	participantCriteria?: string | null;
	principalInvestigators: string[];
	leadOrganizations: string[];
	collaborators?: string[] | null;
	fundingSources: string[];
	publicationLinks?: string[] | null;
	createdAt: Date;
	updatedAt?: Date | null;
	categoryId?: number | null;
};

export type StudyRecord = typeof study.$inferSelect;
export type StudyModel = typeof study.$inferInsert;
