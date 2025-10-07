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

import { logger } from '@/common/logger.js';
import {
	createStudy,
	getOrDeleteStudyByID,
	listAllStudies,
	updateStudy,
} from '@/common/validation/study-validation.js';
import { env } from '@/config/envConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import {
	findIDByHash,
	generateHash,
	generateID,
	getNextSequenceValue,
	isValidStudyField,
	retrieveIIMConfiguration,
} from '@/internal/id-manager/utils.js';
import { validateRequest } from '@/middleware/requestValidation.js';
import { shouldBypassAuth } from '@/service/authService.js';
import { convertToRecordFromStudyDTO } from '@/service/dtoConversion.js';
import iimService from '@/service/idManagerService.js';
import { studyService } from '@/service/studyService.js';

export const getAllStudies = validateRequest(listAllStudies, async (req, res, next) => {
	const db = getDbInstance();
	const { page, orderBy, pageSize } = req.query;
	const studyRepo = studyService(db);

	try {
		const results = await studyRepo.listStudies({ page: Number(page), orderBy, pageSize: Number(pageSize) });
		res.status(200).send(results);
		return;
	} catch (exception) {
		next(exception);
	}
});

export const getStudyById = validateRequest(getOrDeleteStudyByID, async (req, res, next) => {
	const studyId = req.params.studyId;
	const db = getDbInstance();
	const studyRepo = studyService(db);

	try {
		const results = await studyRepo.getStudyById(studyId);
		if (!results) {
			throw new lyricProvider.utils.errors.NotFound(`No Study with ID - ${studyId} found.`);
		}
		res.status(200).send(results);
		return;
	} catch (exception) {
		next(exception);
	}
});

export const createNewStudy = validateRequest(createStudy, async (req, res, next) => {
	const IIM_CONFIG_NAME = 'study';
	const studyData = req.body;
	const db = getDbInstance();
	const studyRepo = studyService(db);
	const iimRepo = iimService(db);
	const user = req.user;

	const authEnabled = !shouldBypassAuth(req);

	try {
		if (authEnabled && !user?.isAdmin) {
			throw new lyricProvider.utils.errors.Forbidden('You must be an admin user to use this endpoint.');
		}

		const studyConfig = await retrieveIIMConfiguration(IIM_CONFIG_NAME);

		if (!studyConfig) {
			logger.error(`[Study/IIM]: ID Generation is misconfigured! Study table ID Generation does NOT exist.`);
			throw new lyricProvider.utils.errors.InternalServerError(
				'Study table ID generation config does not exist. Unable to create studies.',
			);
		}

		const convertedStudyData = convertToRecordFromStudyDTO(studyData);

		if (!isValidStudyField(studyConfig.fieldName)) {
			logger.error(
				`[Study/IIM]: ID Generation is misconfigured! ${studyConfig.fieldName} does NOT exist within the study table!`,
			);
			throw new lyricProvider.utils.errors.InternalServerError(
				`ID generation is misconfigured! ${studyConfig.fieldName} doesn't exist in study table.`,
			);
		}

		const entityToHash = studyConfig.fieldName;
		const hashableData: string = String(convertedStudyData[entityToHash]);
		const idmHash = generateHash(hashableData, env.ID_MANAGER_SECRET);

		const existingHashEntry = await findIDByHash(idmHash);

		if (existingHashEntry) {
			throw new lyricProvider.utils.errors.BadRequest(
				`${studyData.studyId} already exists in studies. Study name must be unique.`,
			);
		}

		// if (studyData.categoryId) {
		// 	const foundStudy = await studyRepo.getStudiesByCategoryId(studyData.categoryId);

		// 	if (foundStudy[0]) {
		// 		throw new lyricProvider.utils.errors.BadRequest(
		// 			`Study already present with categoryId ${studyData.categoryId}`,
		// 		);
		// 	}
		// }

		const nextSequence = await getNextSequenceValue(studyConfig.sequenceName);
		if (!nextSequence) {
			logger.error(
				`[Study/IIM]: Error creating study. IIM Config somehow references an unknown sequence? ${studyConfig.sequenceName}`,
			);
			throw new lyricProvider.utils.errors.InternalServerError('Unable to create study. Cannot generate ID.');
		}

		const generatedID = generateID(nextSequence, studyConfig.prefix, studyConfig.paddingLength);
		const studyTransaction = await db.transaction(async (transaction) => {
			try {
				const createID = await iimRepo.createIDRecord(
					{
						sourceHash: idmHash,
						configId: studyConfig.id,
						generatedId: generatedID,
					},
					transaction,
				);

				const results = await studyRepo.createStudy(studyData, transaction);

				if (!results || !createID) {
					throw new lyricProvider.utils.errors.BadRequest(`Unable to create study with provided data.`);
				}

				return results;
			} catch (exception) {
				next(exception);
			}
		});

		if (!studyTransaction) {
			logger.info(
				`[Study/IIM]: Create study transaction returned undefined but was still was able to create resource.`,
			);
			res.status(201).send({});
			return;
		}

		delete studyTransaction['categoryId'];
		res.status(201).send(studyTransaction);
		return;
	} catch (exception) {
		next(exception);
	}
});

export const deleteStudyById = validateRequest(getOrDeleteStudyByID, async (req, res, next) => {
	const studyId = req.params.studyId;
	const db = getDbInstance();
	const studyRepo = studyService(db);
	const user = req.user;

	const authEnabled = !shouldBypassAuth(req);

	try {
		if (authEnabled && !user?.isAdmin) {
			throw new lyricProvider.utils.errors.Forbidden('You must be an admin user to use this endpoint.');
		}

		const results = await studyRepo.deleteStudy(studyId);

		if (!results) {
			throw new lyricProvider.utils.errors.NotFound(`No Study with ID - ${studyId} found.`);
		}

		//DELETE requests should send a blank 204 on success. No need to send deleted data back.
		res.status(204).send();

		return;
	} catch (exception) {
		next(exception);
	}
});

export const updateStudyById = validateRequest(updateStudy, async (req, res, next) => {
	const studyId = req.params.studyId;
	const updateData = req.body;

	const db = getDbInstance();
	const studyRepo = studyService(db);

	const user = req.user;

	try {
		if (!user?.isAdmin) {
			throw new lyricProvider.utils.errors.Forbidden('You must be an admin user to use this endpoint.');
		}

		const results = await studyRepo.updateStudy(studyId, updateData);

		if (!results) {
			throw new lyricProvider.utils.errors.NotFound(`No Study with ID - ${studyId} found.`);
		}

		res.status(200).send(results);

		return;
	} catch (exception) {
		next(exception);
	}
});
