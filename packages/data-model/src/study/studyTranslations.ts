import { AllowedLanguagesValues, StudyDTO } from './study.js';

export type TranslationFields = Omit<StudyTranslationDTO, 'studyTranslationId' | 'createdAt' | 'updatedAt'>;

export type StudyAdditionalParams = {
	defaultLanguage: AllowedLanguagesValues;
};

export type UpsertStudyParams = StudyDTO & TranslationFields & StudyAdditionalParams;

export type StudyTranslationDTO = {
	studyTranslationId?: number;
	languageId: AllowedLanguagesValues;
	studyDescription: string;
	programName?: string | null;
	keywords?: string[] | null;
	participantCriteria?: string | null;
	fundingSources: string[];
	createdAt: string | Date;
	updatedAt?: string | Date | null;
};
