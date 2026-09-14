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
	createStudyTranslation,
	dacToStudy,
	getOrDeleteStudyByID,
	listAllStudies,
	updateStudy,
} from '@/common/validation/study-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import {
	createStudy as createAuthzStudy,
	extractAccessTokenFromHeader,
	getStudyById as getAuthzStudyById,
} from '@/external/pcglAuthZClient.js';
import { validateRequest } from '@/middleware/requestValidation.js';
import dacService from '@/service/dacService.js';
import { studyService } from '@/service/studyService.js';

import type { PCGLAuthZStudyAuthorizationRequest } from '../common/validation/authz-validation.js';

/**
 * Ensures the AuthZ service's record of a study's DAC matches the given dacId, creating/updating
 * the AuthZ study record if it doesn't. Callers should run this inside the same DB transaction as
 * their local write so that a sync failure rolls back the local change instead of leaving the two
 * systems inconsistent.
 * @param studyId - ID of the study to sync
 * @param dacId - DAC ID that should be associated with the study in AuthZ
 * @param accessToken - Access token used to authenticate with AuthZ
 * @throws ServiceUnavailable if the AuthZ read or write fails
 */
const syncAuthzStudyDac = async (studyId: string, dacId: string, accessToken: string) => {
	try {
		const authzStudy = await getAuthzStudyById(studyId, accessToken);

		if (!authzStudy || authzStudy.dac_id !== dacId) {
			const authzStudyData: PCGLAuthZStudyAuthorizationRequest = {
				dac_id: dacId,
				data_submitters: authzStudy?.data_submitters || [],
				study_id: studyId,
				team_members: authzStudy?.team_members || [],
				date_created: authzStudy?.date_created,
			};

			await createAuthzStudy(authzStudyData, accessToken);
		}
	} catch (error) {
		logger.error(
			error,
			`[AUTHZ]: Failed to sync DAC ID '${dacId}' for study '${studyId}' with the Authorization system.`,
		);

		throw new lyricProvider.utils.errors.ServiceUnavailable(
			'Unable to sync changes with the Authorization system. Try again, but if errors persist contact system administrators.',
		);
	}
};

export const getAllStudies = validateRequest(listAllStudies, async (req, res, next) => {
	const db = getDbInstance();
	const { page, orderBy, pageSize } = req.query;
	const studyRepo = studyService(db);

	try {
		const results = await studyRepo.listStudies({
			page: Number(page),
			orderBy,
			pageSize: Number(pageSize),
		});

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
	} catch (exception) {
		next(exception);
	}
});

export const createNewStudy = validateRequest(createStudy, async (req, res, next) => {
	try {
		const studyData = req.body;
		const accessToken = extractAccessTokenFromHeader(req);
		const db = getDbInstance();
		const { getStudyByName, createStudy } = studyService(db);
		const { getDacById } = dacService(db);

		if (!accessToken) {
			throw new lyricProvider.utils.errors.Forbidden('Unauthorized: No access token provided');
		}

		const studyTransaction = await db.transaction(async (transaction) => {
			const studyFound = await getStudyByName(studyData.studyName);
			if (studyFound) {
				throw new lyricProvider.utils.errors.BadRequest(
					`${studyData.studyName} already exists in studies. Study name must be unique.`,
				);
			}

			// If the dacId does exist, make sure it is valid dac record
			if (studyData.dacId) {
				const dacFound = await getDacById(studyData.dacId);
				if (!dacFound) {
					throw new lyricProvider.utils.errors.BadRequest(`${studyData.dacId} is not a valid DAC ID.`);
				}
			}

			const results = await createStudy(studyData, transaction);

			if (!results) {
				throw new lyricProvider.utils.errors.BadRequest(`Unable to create study with provided data.`);
			}

			await syncAuthzStudyDac(results.studyId, studyData.dacId || '', accessToken);

			return results;
		});

		res.status(201).send(studyTransaction);
		return;
	} catch (exception) {
		next(exception);
	}
});

export const deleteStudyById = validateRequest(getOrDeleteStudyByID, async (req, res, next) => {
	try {
		const studyId = req.params.studyId;
		const db = getDbInstance();
		const studyRepo = studyService(db);

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
	try {
		const studyId = req.params.studyId;
		const updateData = req.body;

		const db = getDbInstance();
		const studyRepo = studyService(db);

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
export const createStudyTranslationById = validateRequest(createStudyTranslation, async (req, res, next) => {
	try {
		const studyId = req.params.studyId;
		const translationData = req.body;

		const db = getDbInstance();
		const studyRepo = studyService(db);

		const studyFound = await studyRepo.getStudyById(studyId);

		if (!studyFound) {
			throw new lyricProvider.utils.errors.NotFound(`No Study with ID - ${studyId} found.`);
		}

		const results = await studyRepo.createStudyTranslation({ ...translationData, studyId });

		res.status(200).send(results);
		return;
	} catch (exception) {
		next(exception);
	}
});

export const updateStudyTranslationById = validateRequest(createStudyTranslation, async (req, res, next) => {
	try {
		const studyId = req.params.studyId;
		const translationData = req.body;

		const db = getDbInstance();
		const studyRepo = studyService(db);

		const studyFound = await studyRepo.getStudyById(studyId);

		if (!studyFound) {
			throw new lyricProvider.utils.errors.NotFound(`No Study with ID - ${studyId} found.`);
		}

		const results = await studyRepo.updateStudyTranslation({ ...translationData, studyId });

		res.status(200).send(results);
		return;
	} catch (exception) {
		next(exception);
	}
});

export const addDacIdToStudy = validateRequest(dacToStudy, async (req, res, next) => {
	try {
		const { studyId } = req.params;
		const { dacId } = req.body;
		const accessToken = extractAccessTokenFromHeader(req);

		const db = getDbInstance();
		const studyRepo = studyService(db);
		const dacRepo = dacService(db);

		if (!accessToken) {
			throw new lyricProvider.utils.errors.Forbidden('Unauthorized: No access token provided');
		}

		const studyFound = await studyRepo.getStudyById(studyId);

		if (!studyFound) {
			throw new lyricProvider.utils.errors.NotFound(`No Study with ID - ${studyId} found.`);
		}

		if (studyFound.dacId !== null) {
			throw new lyricProvider.utils.errors.StatusConflict(`Study with ID - ${studyId} already has a DAC ID.`);
		}

		const dacFound = await dacRepo.getDacById(dacId);

		if (!dacFound) {
			throw new lyricProvider.utils.errors.NotFound(`No DAC with ID - ${dacId} found.`);
		}

		const updatedStudy = await db.transaction(async (transaction) => {
			const results = await studyRepo.updateStudyDacId({ studyId, dacId }, transaction);
			await syncAuthzStudyDac(studyId, dacId, accessToken);

			return results;
		});

		res.status(200).send(updatedStudy);
		return;
	} catch (exception) {
		next(exception);
	}
});
