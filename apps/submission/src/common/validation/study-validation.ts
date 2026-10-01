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

import {
	AllowedLanguages,
	StudyContext,
	StudyDTO,
	StudyStatus,
	StudyTranslationDTO,
	UpsertStudyParams,
} from '@clinical-submission/data-model';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { z } from 'zod';

import { RequestValidation } from '@/middleware/requestValidation.js';

import { orderByString, PaginationParams, positiveInteger, stringNotEmpty } from './common.js';

const ALLOWED_DOMAINS = [
	'AGING',
	'BIRTH DEFECTS',
	'CANCER',
	'CIRCULATORY AND RESPIRATORY HEALTH',
	'GENERAL HEALTH',
	'INFECTION AND IMMUNITY',
	'MUSCULOSKELETAL HEALTH AND ARTHRITIS',
	'NEURODEVELOPMENTAL CONDITIONS',
	'NEUROSCIENCES, MENTAL HEALTH AND ADDICTION',
	'NUTRITION, METABOLISM AND DIABETES',
	'POPULATION GENOMICS',
	'RARE DISEASES',
	'OTHER',
];

/**
 * Check if provided DUO is disease specific research, if this is true then they must provide a valid regex in the diseaseSpecificModifier field
 * @param DUO
 * @returns
 */
export const checkIfDiseaseDUO = (DUO: string) => {
	return DUO === AllowedDUOPermissions.DISEASE_SPECIFIC_MODIFIER;
};

const diseaseCodeRegex = /^MONDO:\d{7}$/;
/**
 * Check if the the values in the array of strings are valid regex's. Used for disease specific research
 * @param patterns
 * @returns
 */
export const isAllValidRegex = (codes: string[]) => codes.every((code) => diseaseCodeRegex.test(code));

export const AllowedDUOPermissions = {
	GENERAL_RESEARCH_USE: 'DUO:0000042', // general research use
	HEALTH_MEDICAL_BIOMEDICAL_RESEARCH: 'DUO:0000006', // health or medical or biomedical research
	DISEASE_SPECIFIC_MODIFIER: 'DUO:0000007', // disease specific research
	POPULATION_ORIGINS_ANCESTRY_RESEARCH_ONLY: 'DUO:0000011', // population origins or ancestry research only
	NO_RESTRICTION: `DUO:0000004`, // no restriction
} as const;

export type AllowedDUOPermissionsValues = (typeof AllowedDUOPermissions)[keyof typeof AllowedDUOPermissions];

const DUO_PERMISSIONS: string[] = [
	AllowedDUOPermissions.GENERAL_RESEARCH_USE,
	AllowedDUOPermissions.HEALTH_MEDICAL_BIOMEDICAL_RESEARCH,
	AllowedDUOPermissions.DISEASE_SPECIFIC_MODIFIER,
	AllowedDUOPermissions.POPULATION_ORIGINS_ANCESTRY_RESEARCH_ONLY,
	AllowedDUOPermissions.NO_RESTRICTION,
];

const createStudyPropertiesBase = z
	.object({
		dacId: z.string().optional().nullable(),
		defaultLanguage: z.nativeEnum(AllowedLanguages),
		studyName: stringNotEmpty,
		studyDescription: stringNotEmpty,
		duoPermission: stringNotEmpty.refine(
			(duoCode) => DUO_PERMISSIONS.includes(duoCode.trim().toLocaleUpperCase()),
			`Only DUO from the following list are allowed: [${DUO_PERMISSIONS.join(', ')}]`,
		),
		diseaseSpecificModifier: z.array(z.string()),
		programName: z.string().optional(),
		keywords: z.array(z.string()).optional(),
		status: z.nativeEnum(StudyStatus),
		context: z.nativeEnum(StudyContext),
		domain: z.array(
			z
				.string()
				.refine(
					(domainString) => ALLOWED_DOMAINS.includes(domainString.trim().toUpperCase()),
					`Only domains from the following list are allowed: [${ALLOWED_DOMAINS.join(', ')}]`,
				),
		),
		participantCriteria: z.string().optional(),
		principalInvestigators: z.array(z.string()),
		leadOrganizations: z.array(z.string()),
		collaborators: z.array(z.string()).optional(),
		fundingSources: z.array(z.string()),
		publicationLinks: z.array(z.string()).optional(),
	})
	.strict();

type DiseaseRefineFields = Partial<
	Pick<z.infer<typeof createStudyPropertiesBase>, 'duoPermission' | 'diseaseSpecificModifier'>
>;

const diseaseSuperRefine = (fields: DiseaseRefineFields, context: z.RefinementCtx) => {
	const isDiseaseDUO = fields.duoPermission && checkIfDiseaseDUO(fields.duoPermission);

	// diseaseSpecificModifier should not exist if duoPermission doesnt
	if (fields.duoPermission === undefined && fields.diseaseSpecificModifier !== undefined) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			message: '`diseaseSpecificModifier` should not exist when `duoPermission` is not provided.',
			path: ['diseaseSpecificModifier'],
		});
	}

	// diseaseSpecificModifier should not be empty or undefined if isDiseaseDUO is true
	if (isDiseaseDUO && (fields.diseaseSpecificModifier === undefined || fields.diseaseSpecificModifier.length === 0)) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			message: '`diseaseSpecificModifier` requires an array of MONDO values if changing to disease DUO permission.',
			path: ['diseaseSpecificModifier'],
		});
	}

	// diseaseSpecificModifier must contain valid MONDO codes
	if (
		isDiseaseDUO &&
		fields.diseaseSpecificModifier !== undefined &&
		!isAllValidRegex(fields.diseaseSpecificModifier)
	) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			message: `Invalid value provided in the 'diseaseSpecificModifier' array. Does not fit the regex ${diseaseCodeRegex}`,
			path: ['diseaseSpecificModifier'],
		});
	}

	// If the duo permission is not disease specific research, and the diseaseSpecificModifier not defined. We must pass an empty array.
	if (!isDiseaseDUO && fields.diseaseSpecificModifier === undefined) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				'`diseaseSpecificModifier` must be an empty array if updating DUO permission outside disease research DUO code.',
			path: ['diseaseSpecificModifier'],
		});
	}

	// If the duo permission is not disease specific research, and the diseaseSpecificModifier contains values
	if (!isDiseaseDUO && fields.diseaseSpecificModifier !== undefined && fields.diseaseSpecificModifier.length > 0) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				'`diseaseSpecificModifier` must not contain any values if duoPermission is not disease specific research',
			path: ['diseaseSpecificModifier'],
		});
	}
};

const createStudyProperties = createStudyPropertiesBase.superRefine(diseaseSuperRefine);

const updateStudyProperties = createStudyPropertiesBase.omit({
	defaultLanguage: true,
	studyDescription: true,
	fundingSources: true,
	keywords: true,
	participantCriteria: true,
	programName: true,
});

interface StudyIDParams extends ParamsDictionary {
	studyId: string;
}

export const getOrDeleteStudyByID: RequestValidation<object, ParsedQs, StudyIDParams> = {
	pathParams: z.object({
		studyId: stringNotEmpty,
	}),
};

export type UpsertStudyFields = Omit<UpsertStudyParams, 'studyId' | 'languageId' | 'createdAt' | 'updatedAt'>;
export const createStudy: RequestValidation<UpsertStudyFields, ParsedQs, ParamsDictionary> = {
	body: createStudyProperties,
};

export const updateStudy: RequestValidation<
	Partial<
		Omit<
			StudyDTO,
			| 'studyId'
			| 'updatedAt'
			| 'createdAt'
			| 'defaultLanguage'
			| 'studyDescription'
			| 'fundingSources'
			| 'keywords'
			| 'participantCriteria'
			| 'programName'
		>
	>,
	ParsedQs,
	StudyIDParams
> = {
	pathParams: z.object({
		studyId: stringNotEmpty,
	}),
	body: updateStudyProperties
		.partial()
		.strict({
			message:
				'Unrecognized keys in object. Properties defaultLanguage, studyDescription, fundingSources, keywords, participantCriteria, or programName should be updated in the update translations endpoint.',
		})
		.superRefine(diseaseSuperRefine),
};

export const listAllStudies: RequestValidation<object, PaginationParams, ParamsDictionary> = {
	query: z.object({
		orderBy: orderByString.optional(),
		page: positiveInteger.optional(),
		pageSize: positiveInteger.optional(),
	}),
};

export type StudyTranslationFields = Omit<StudyTranslationDTO, 'createdAt' | 'updatedAt'>;
export const createStudyTranslation: RequestValidation<StudyTranslationFields, ParsedQs, StudyIDParams> = {
	body: z
		.object({
			languageId: z.nativeEnum(AllowedLanguages),
			studyDescription: z.string(),
			programName: z.string().optional(),
			keywords: z.array(z.string()).optional(),
			participantCriteria: z.string().optional(),
			fundingSources: z.array(z.string()),
		})
		.strict(),
};

export const dacToStudy: RequestValidation<{ dacId: string }, ParsedQs, StudyIDParams> = {
	pathParams: z.object({
		studyId: stringNotEmpty,
	}),
	body: z.object({
		dacId: stringNotEmpty,
	}),
};
