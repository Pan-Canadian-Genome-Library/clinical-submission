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

import { BATCH_ERROR_TYPE, type BatchError, EntityData, SUBMISSION_ACTION_TYPE } from '@overture-stack/lyric';

import { logger } from '@/common/logger.js';
import {
	deleteEntityRequestSchema,
	editDataRequestSchema,
	submitRequestSchema,
} from '@/common/validation/submit-validation.js';
import { authConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import { hasAllowedAccess } from '@/external/pcglAuthZClient.js';
import { validateRequest } from '@/middleware/requestValidation.js';
import { studyService } from '@/service/studyService.js';
import { prevalidateEditFile, prevalidateNewDataFile } from '@/submission/fileValidation.js';
import { parseFileToRecords } from '@/submission/readFile.js';

const EDIT_DATA_SUBMISSION_STATUS = {
	PROCESSING: 'PROCESSING',
	INVALID_SUBMISSION: 'INVALID_SUBMISSION',
	PARTIAL_SUBMISSION: 'PARTIAL_SUBMISSION',
} as const;

const editData = validateRequest(editDataRequestSchema, async (req, res, next) => {
	try {
		const categoryId = Number(req.params.categoryId);
		const files = Array.isArray(req.files) ? req.files : [];
		const organization = req.body.organization;
		const db = getDbInstance();
		const studySvc = studyService(db);

		const user = req.user;

		if (!hasAllowedAccess(organization, 'WRITE', user)) {
			throw new lyricProvider.utils.errors.Forbidden('You do not have permission to access this resource');
		}

		const results = await studySvc.getStudiesByCategoryId(categoryId);

		if (!results?.length) {
			throw new lyricProvider.utils.errors.NotFound(`No Study found with categoryId "${categoryId}".`);
		}

		const study = results[0];

		if (study?.study_id !== organization) {
			throw new lyricProvider.utils.errors.BadRequest(
				`Study ${organization} is being submitted to the incorrect category.`,
			);
		}

		const username = user?.username;

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
					username: username ?? '',
				});

				submissionId = uploadResult.submissionId;
				entityList.push(entityName);
			} catch (error) {
				logger.error(`File processing failed. Error: ${error}`);
				throw new lyricProvider.utils.errors.BadRequest(`File processing failed`, error);
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

const CREATE_SUBMISSION_STATUS = {
	PROCESSING: 'PROCESSING',
	INVALID_SUBMISSION: 'INVALID_SUBMISSION',
	PARTIAL_SUBMISSION: 'PARTIAL_SUBMISSION',
} as const;

const submit = validateRequest(submitRequestSchema, async (req, res, next) => {
	try {
		const categoryId = Number(req.params.categoryId);
		const files = Array.isArray(req.files) ? req.files : [];
		const organization = req.body.organization;
		const user = req.user;
		const db = getDbInstance();
		const studySvc = studyService(db);

		if (!hasAllowedAccess(organization, 'WRITE', user)) {
			throw new lyricProvider.utils.errors.Forbidden('You do not have permission to access this resource');
		}

		const results = await studySvc.getStudiesByCategoryId(categoryId);

		if (!results?.length) {
			throw new lyricProvider.utils.errors.NotFound(`No Study found with categoryId - ${categoryId}.`);
		}

		const foundStudy = results[0];

		if (foundStudy?.study_id !== organization) {
			throw new lyricProvider.utils.errors.BadRequest(
				`The provided organization '${organization}' is not associated with categoryId '${categoryId}'. Please verify that you are submitting to the correct categoryId  for the organization `,
			);
		}

		const username = user?.username;

		logger.info(
			`Upload Submission Request: categoryId '${categoryId}'` +
				` organization '${organization}'` +
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
		const entityData: EntityData = {};

		for (const file of files) {
			try {
				// validate if entity name is present in the dictionary
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

				const { file: prevalidatedFile, error } = await prevalidateNewDataFile(file, schema);
				if (error) {
					fileErrors.push(error);
					continue;
				}

				// converts TSV/CSV into JSON object format
				const extractedData = await parseFileToRecords(prevalidatedFile, schema);

				entityData[entityName] = extractedData;
			} catch (error) {
				logger.error(`File processing failed. Error: ${error}`);
				throw new lyricProvider.utils.errors.BadRequest(`File processing failed`, error);
			}
		}

		// Send submission data, organized by entity.
		const submitResult = await lyricProvider.services.submission.submit({
			data: entityData,
			categoryId,
			organization,
			username: username ?? '',
		});

		// Entity names that are sent for Submission
		const entityList = Object.keys(entityData);

		let status: string = CREATE_SUBMISSION_STATUS.PROCESSING;
		if (entityList.length === 0) {
			logger.info('Unable to process the submission');
			status = CREATE_SUBMISSION_STATUS.INVALID_SUBMISSION;
		} else if (fileErrors.length > 0) {
			logger.info('Submission processed with some errors');
			status = CREATE_SUBMISSION_STATUS.PARTIAL_SUBMISSION;
		} else {
			logger.info(`Submission processed successfully`);
		}

		// This response provides the details of file Submission
		return res.status(200).send({
			submissionId: submitResult.submissionId,
			status,
			batchErrors: fileErrors,
			inProcessEntities: entityList,
		});
	} catch (error) {
		next(error);
	}
});

/**
 * Custom lyric Get Submission by Category Id
 * @override lyricProvider.controllers.submission.getSubmissionById
 * @description Overrides functionality of lyric getSubmissionById and implements auth
 */
const getSubmissionById = validateRequest(
	lyricProvider.utils.schema.submissionByIdRequestSchema,
	async (req, res, next) => {
		try {
			const submissionId = Number(req.params.submissionId);
			const user = req.user;

			const submission = await lyricProvider.services.submission.getSubmissionById(submissionId);

			if (!submission) {
				throw new lyricProvider.utils.errors.NotFound(`Submission not found`);
			}

			const organization = submission?.organization;

			if (!hasAllowedAccess(organization, 'READ', user)) {
				throw new lyricProvider.utils.errors.Forbidden('You do not have permission to access this resource');
			}

			return res.status(200).send(submission);
		} catch (error) {
			next(error);
		}
	},
);

/**
 * Custom lyric Get Submission by Category Id
 * @override lyricProvider.controllers.submission.getSubmissionsByCategory
 * @description Overrides functionality of lyric getSubmissionsByCategory and implements auth
 */
const getSubmissionsByCategory = validateRequest(
	lyricProvider.utils.schema.submissionsByCategoryRequestSchema,
	async (req, res, next) => {
		try {
			const categoryId = Number(req.params.categoryId);
			const onlyActive = req.query.onlyActive?.toLowerCase() === 'true';
			const organization = req.query.organization;
			const page = parseInt(String(req.query.page)) || 1;
			const pageSize = parseInt(String(req.query.pageSize)) || 20;
			const user = req.user;

			const submissionsResult = await lyricProvider.services.submission.getSubmissionsByCategory(
				categoryId,
				{ page, pageSize },
				{ onlyActive, username: user?.username, organization },
			);

			if (submissionsResult.metadata.totalRecords === 0) {
				throw new lyricProvider.utils.errors.NotFound(`Submission not found`);
			}

			const retrievedOrg = submissionsResult.result[0]?.organization;
			// User can provide an organization optionally, if they do, we check against that input instead of the returned org from submissionsResult
			const orgToCheck = organization ?? retrievedOrg;

			if (!hasAllowedAccess(orgToCheck || '', 'READ', user)) {
				throw new lyricProvider.utils.errors.Forbidden('You do not have permission to access this resource');
			}

			const response = {
				pagination: {
					currentPage: page,
					pageSize: pageSize,
					totalPages: Math.ceil(submissionsResult.metadata.totalRecords / pageSize),
					totalRecords: submissionsResult.metadata.totalRecords,
				},
				records: submissionsResult.result,
			};

			return res.status(200).send(response);
		} catch (error) {
			next(error);
		}
	},
);

/**
 * Custom Lyric Delete Active Submission by Id
 * @extends lyricProvider.controllers.submission.delete
 * @description Extends functionality of lyric delete submissions by adding
 * an additional auth check if the user attempting the delete action is the same user who create the submission regardless of user belongs to said organization
 */
// Note: I tried to name this controller the same as lyrics (delete) but typescript complains cause strict mode
const deleteSubmissionById = validateRequest(
	lyricProvider.utils.schema.submissionDeleteRequestSchema,
	async (req, res, next) => {
		try {
			const submissionId = Number(req.params.submissionId);
			const user = req.user;
			const authEnabled = authConfig.enabled;

			const submission = await lyricProvider.services.submission.getSubmissionById(submissionId);
			if (!submission) {
				throw new lyricProvider.utils.errors.BadRequest(`Submission '${submissionId}' not found`);
			}

			if (authEnabled && !user?.isAdmin && user?.username !== submission?.createdBy) {
				throw new lyricProvider.utils.errors.Forbidden('You do not have permission to delete this resource');
			}

			const response = lyricProvider.controllers.submission.delete(req, res, next);

			return res.status(200).send(response);
		} catch (error) {
			next(error);
		}
	},
);

/**
 * Custom Lyric Delete Active Submission by EntityName
 * @extends lyricProvider.controllers.submission.deleteEntityName
 * @description Extends functionality of lyric delete submissions by adding
 * an additional auth check if the user attempting the delete action is the same user who create the submission regardless of user belongs to said organization
 */
const deleteEntityName = validateRequest(deleteEntityRequestSchema, async (req, res, next) => {
	try {
		const user = req.user;

		const submissionId = Number(req.params.submissionId);
		const index = Number(req.query.index);
		const actionType = SUBMISSION_ACTION_TYPE.parse(req.params.actionType.toUpperCase());
		const entityName = req.query.entityName;

		const submission = await lyricProvider.services.submission.getSubmissionById(submissionId);

		if (!submission) {
			throw new lyricProvider.utils.errors.BadRequest(`Submission '${submissionId}' not found`);
		}

		if (!hasAllowedAccess(submission.organization, 'WRITE', user) && user?.username !== submission?.createdBy) {
			throw new lyricProvider.utils.errors.Forbidden('You do not have permission to delete this resource');
		}

		// If index doesn't exists, we can skip validation here
		if (index) {
			let actionObj;

			switch (actionType) {
				case SUBMISSION_ACTION_TYPE.enum.INSERTS:
					actionObj = submission.data?.inserts;
					break;
				case SUBMISSION_ACTION_TYPE.enum.UPDATES:
					actionObj = submission.data?.updates;
					break;
				case SUBMISSION_ACTION_TYPE.enum.DELETES:
					actionObj = submission.data?.deletes;
					break;
				default:
					throw new lyricProvider.utils.errors.BadRequest(`Invalid actionType '${actionType}'`);
			}

			if (!actionObj) {
				throw new lyricProvider.utils.errors.BadRequest(`Action type '${actionType}' not found in submission data`);
			}

			const entityObj = actionObj[entityName];

			if (!entityObj) {
				throw new lyricProvider.utils.errors.NotFound(`Entity with name '${entityName}' not found`);
			}

			let records;

			// Check of its array, if it is then we are removing index of SubmissionUpdateData[] | SubmissionDeleteData[]
			if (Array.isArray(entityObj)) {
				records = entityObj;
			} else {
				// if its not an array, then its of type SubmissionInsertData which we will remove index from DataRecord[]
				records = entityObj.records; //
			}

			if (records[index] === undefined) {
				throw new lyricProvider.utils.errors.NotFound(`Index '${index}' not found`);
			}
		}

		const username = user?.username || '';

		const response = await lyricProvider.services.submission.deleteActiveSubmissionEntity(submissionId, username, {
			actionType,
			entityName,
			index,
		});

		return res.status(200).send(response);
	} catch (error) {
		next(error);
	}
});

export default {
	getSubmissionById,
	getSubmissionsByCategory,
	deleteSubmissionById,
	deleteEntityName,
	editData,
	submit,
};
