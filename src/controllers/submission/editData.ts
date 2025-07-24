import { BATCH_ERROR_TYPE, type BatchError } from '@overture-stack/lyric';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { z } from 'zod';

import { logger } from '@/common/logger.js';
import { lyricProvider } from '@/core/provider.js';
import { extractAccessTokenFromHeader, hasAllowedAccess } from '@/external/pcglAuthZClient.js';
import { type RequestValidation, validateRequest } from '@/middleware/requestValidation.js';
import { prevalidateEditFile } from '@/submission/fileValidation.js';
import { parseFileToRecords } from '@/submission/readFile.js';

interface EditRequestPathParams extends ParamsDictionary {
	categoryId: string;
}

export const editDataRequestSchema: RequestValidation<{ organization: string }, ParsedQs, EditRequestPathParams> = {
	body: z.object({
		organization: z.string(),
	}),
	pathParams: z.object({
		categoryId: z.string(),
	}),
};

const EDIT_DATA_SUBMISSION_STATUS = {
	PROCESSING: 'PROCESSING',
	INVALID_SUBMISSION: 'INVALID_SUBMISSION',
	PARTIAL_SUBMISSION: 'PARTIAL_SUBMISSION',
} as const;

export const editData = validateRequest(editDataRequestSchema, async (req, res, next) => {
	try {
		const categoryId = Number(req.params.categoryId);
		const files = Array.isArray(req.files) ? req.files : [];
		const organization = req.body.organization;

		const user = req.user;
		const token = extractAccessTokenFromHeader(req);

		if (!token || !user) {
			throw new lyricProvider.utils.errors.Forbidden('Unauthorized: Unable to authorize user');
		}

		if (!(await hasAllowedAccess(organization, 'WRITE', token, user.isAdmin))) {
			throw new lyricProvider.utils.errors.Forbidden('You do not have permission to access this resource');
		}

		const username = user.username;

		logger.info(
			`Edit Data Submission Request: categoryId '${categoryId}'`,
			` organization '${organization}'`,
			` files: '${files?.map((f) => f.originalname)}'`,
		);

		if (!files || files.length == 0) {
			throw new lyricProvider.utils.errors.BadRequest(
				'The "files" parameter is missing or empty. Please include files in the request for processing.',
			);
		}

		// get the current dictionary
		const currentDictionary = await lyricProvider.services.dictionary.getActiveDictionaryByCategory(categoryId);

		if (!currentDictionary) {
			throw new lyricProvider.utils.errors.BadRequest(`Dictionary in category '${categoryId}' not found`);
		}

		const fileErrors: BatchError[] = [];
		let submissionId: number | undefined;
		const entityList: string[] = [];

		for (const file of files) {
			try {
				// // validate if entity name is present in the dictionary
				const entityName = file.originalname.split('.')[0]?.toLowerCase();
				const schema = currentDictionary.dictionary.find((schema) => schema.name.toLowerCase() === entityName);
				if (!schema || !entityName) {
					fileErrors.push({
						type: BATCH_ERROR_TYPE.INVALID_FILE_NAME,
						message: `Invalid entity name for submission`,
						batchName: file.originalname,
					});
					continue;
				}

				const { file: prevalidatedFile, error } = await prevalidateEditFile(file, schema);
				if (error) {
					fileErrors.push(error);
					continue;
				}

				const extractedData = await parseFileToRecords(prevalidatedFile, schema);

				const uploadResult = await lyricProvider.services.submittedData.editSubmittedData({
					records: extractedData,
					entityName,
					categoryId,
					organization,
					username,
				});

				submissionId = uploadResult.submissionId;
				entityList.push(entityName);
			} catch (error) {
				logger.error(`Error processing file`, error);
			}
		}

		let status: string = EDIT_DATA_SUBMISSION_STATUS.PROCESSING;
		if (entityList.length === 0) {
			logger.info('Unable to process the submission');
			status = EDIT_DATA_SUBMISSION_STATUS.INVALID_SUBMISSION;
		} else if (fileErrors.length > 0) {
			logger.info('Submission processed with some errors');
			status = EDIT_DATA_SUBMISSION_STATUS.PARTIAL_SUBMISSION;
		} else {
			logger.info(`Submission processed successfully`);
		}

		// This response provides the details of file Submission
		return res.status(200).send({
			submissionId,
			status,
			batchErrors: fileErrors,
			inProcessEntities: entityList,
		});
	} catch (error) {
		next(error);
	}
});
