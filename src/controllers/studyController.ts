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
	createStudy,
	getOrDeleteStudyByID,
	listAllStudies,
	updateStudy,
} from '@/common/validation/study-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import { extractAccessTokenFromHeader, hasAllowedAccess } from '@/external/pcglAuthZClient.js';
import { validateRequest } from '@/middleware/requestValidation.js';
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
	const user = req.user;
	const token = extractAccessTokenFromHeader(req);

	try {
		if (!(await hasAllowedAccess(studyId, 'READ', token, user))) {
			throw new lyricProvider.utils.errors.Forbidden(`You do not have access to study - ${studyId}'`);
		}

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
	const studyData = req.body;
	const db = getDbInstance();
	const studyRepo = studyService(db);
	const user = req.user;
	const token = extractAccessTokenFromHeader(req);

	try {
		if (!(await hasAllowedAccess(studyData.studyId, 'WRITE', token, user))) {
			throw new lyricProvider.utils.errors.Forbidden(`You do not have access to study - ${studyData.studyId}'`);
		}

		const results = await studyRepo.createStudy(studyData);
		if (!results) {
			throw new lyricProvider.utils.errors.BadRequest(`Unable to create study with provided data.`);
		}
		res.status(201).send(results);
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
	const token = extractAccessTokenFromHeader(req);

	try {
		if (!(await hasAllowedAccess(studyId, 'WRITE', token, user))) {
			throw new lyricProvider.utils.errors.Forbidden(`You do not have access to study - ${studyId}'`);
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
	const token = extractAccessTokenFromHeader(req);

	try {
		if (!(await hasAllowedAccess(studyId, 'WRITE', token, user))) {
			throw new lyricProvider.utils.errors.Forbidden(`You do not have access to study - ${studyId}'`);
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
