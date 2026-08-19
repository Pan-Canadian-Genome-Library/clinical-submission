import { StudyTranslationDTO } from './studyTranslations.js';

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

export const AllowedLanguages = {
	ENGLISH_CANADA: 'en_ca',
	FRENCH_CANADA: 'fr_ca',
} as const;

export type AllowedLanguagesValues = (typeof AllowedLanguages)[keyof typeof AllowedLanguages];

export type StudyDTO = {
	studyId: string;
	dacId?: string | null;
	studyName: string;
	status: StudyStatusValues;
	context: StudyContextValues;
	domain: string[];
	principalInvestigators: string[];
	leadOrganizations: string[];
	collaborators?: string[] | null;
	publicationLinks?: string[] | null;
	createdAt: Date;
	updatedAt?: Date | null;
	categoryId?: number | null;
	defaultTranslation?: number;
};

export type StudyResponse = {
	translations?: StudyTranslationDTO[];
} & StudyDTO;
