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

import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { z } from 'zod';

import { RequestValidation } from '@/middleware/requestValidation.js';

import { StudyContext, StudyDTO, StudyStatus } from '../types/study.js';
import { stringNotEmpty } from './common.js';

interface StudyIDParams extends ParamsDictionary {
	studyId: string;
}

export const getOrDeleteStudyByID: RequestValidation<object, ParsedQs, StudyIDParams> = {
	pathParams: z.object({
		studyId: stringNotEmpty,
	}),
};

export type CreateStudyFields = Omit<StudyDTO, 'createdAt' | 'updatedAt'>;

export const createStudy: RequestValidation<CreateStudyFields, ParsedQs, ParamsDictionary> = {
	body: z.object({
		studyId: stringNotEmpty,
		dacId: stringNotEmpty,
		studyName: stringNotEmpty,
		studyDescription: stringNotEmpty,
		programName: z.string().optional(),
		keywords: z.array(z.string()).optional(),
		status: z.nativeEnum(StudyStatus),
		context: z.nativeEnum(StudyContext),
		domain: z.array(z.string()),
		participantCriteria: z.string().optional(),
		principalInvestigators: z.array(z.string()),
		leadOrganizations: z.array(z.string()),
		collaborators: z.array(z.string()).optional(),
		fundingSources: z.array(z.string()),
		publicationLinks: z.array(z.string()).optional(),
	}),
};
