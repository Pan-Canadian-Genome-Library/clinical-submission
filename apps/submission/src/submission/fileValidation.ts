import { BATCH_ERROR_TYPE, type BatchError, type Schema } from '@overture-stack/lyric';

import { logger } from '@/common/logger.js';

import { getSeparatorCharacter } from './format.js';
import { readHeaders } from './readFile.js';

/**
 * Pre-validates a new data file before submission.
 *
 * This function performs a series of checks on the provided file to ensure it meets the necessary criteria before it can be submitted for data processing.
 * The following checks are performed:
 * - Verifies that the file has the correct extension.
 * - Ensures the file's text format is correct.
 * - Confirms that the file contains the required column names as per the provided schema.
 *
 * If any of these checks fail, an error is returned along with the file.
 * @param file The file to be validated
 * @param schema The schema against which the file will be validated
 * @returns
 */
export const prevalidateNewDataFile = async (
	file: Express.Multer.File,
	schema: Schema,
): Promise<{ error?: BatchError; file: Express.Multer.File }> => {
	// check if extension is supported
	const separatorCharacter = getSeparatorCharacter(file.originalname);
	if (!separatorCharacter) {
		const message = `Invalid file extension ${file.originalname.split('.')[1]}`;
		logger.info(`Prevalidation file '${file.originalname}' failed - ${message}`);
		return {
			error: {
				type: BATCH_ERROR_TYPE.INVALID_FILE_EXTENSION,
				message,
				batchName: file.originalname,
			},
			file,
		};
	}

	const firstLine = await readHeaders(file);
	const fileHeaders = firstLine.split(separatorCharacter).map((str) => str.trim());

	const missingRequiredFields = schema.fields
		.filter((field) => field.restrictions && 'required' in field.restrictions) // filter required fields
		.map((field) => field.meta?.displayName?.toString() || field.name) // map displayName if exists
		.filter((fieldName) => !fileHeaders.includes(fieldName));
	if (missingRequiredFields.length > 0) {
		const message = `Missing required fields '${JSON.stringify(missingRequiredFields)}'`;
		logger.info(`Prevalidation file '${file.originalname}' failed - ${message}`);
		return {
			error: {
				type: BATCH_ERROR_TYPE.MISSING_REQUIRED_HEADER,
				message,
				batchName: file.originalname,
			},
			file,
		};
	}
	return { file };
};

/**
 * Pre-validates a new data file before submission.
 *
 * This function performs a series of checks on the provided file to ensure it meets the necessary criteria before it can be submitted for data processing.
 * The following checks are performed:
 * - Verifies that the file has the correct extension.
 * - Ensures the file's text format is correct.
 * - Confirms that the file contains the required column names as per the provided schema.
 *
 * If any of these checks fail, an error is returned along with the file.
 * @param file The file to be validated
 * @param schema The schema against which the file will be validated
 * @returns
 */
export const prevalidateEditFile = async (
	file: Express.Multer.File,
	schema: Schema,
): Promise<{ error?: BatchError; file: Express.Multer.File }> => {
	// check if extension is supported
	const separatorCharacter = getSeparatorCharacter(file.originalname);
	if (!separatorCharacter) {
		const message = `Invalid file extension ${file.originalname.split('.')[1]}`;
		logger.info(`Prevalidation file '${file.originalname}' failed - ${message}`);
		return {
			error: {
				type: BATCH_ERROR_TYPE.INVALID_FILE_EXTENSION,
				message,
				batchName: file.originalname,
			},
			file,
		};
	}

	const firstLine = await readHeaders(file);
	const fileHeaders = firstLine.split(separatorCharacter).map((str) => str.trim());

	if (!fileHeaders.includes('systemId')) {
		const message = `File is missing the column 'systemId'`;
		logger.info(`Prevalidation file '${file.originalname}' failed - ${message}`);
		return {
			error: {
				type: BATCH_ERROR_TYPE.MISSING_REQUIRED_HEADER,
				message,
				batchName: file.originalname,
			},
			file,
		};
	}

	const missingRequiredFields = schema.fields
		.filter((field) => field.restrictions && 'required' in field.restrictions) // filter required fields
		.map((field) => field.meta?.displayName?.toString() || field.name) // map displayName if exists
		.filter((fieldName) => !fileHeaders.includes(fieldName));
	if (missingRequiredFields.length > 0) {
		const message = `Missing required fields '${JSON.stringify(missingRequiredFields)}'`;
		logger.info(`Prevalidation file '${file.originalname}' failed - ${message}`);
		return {
			error: {
				type: BATCH_ERROR_TYPE.MISSING_REQUIRED_HEADER,
				message,
				batchName: file.originalname,
			},
			file,
		};
	}
	return { file };
};
