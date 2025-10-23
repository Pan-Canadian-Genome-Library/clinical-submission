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

import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { z } from 'zod';

import { logger } from '@/common/logger.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import { type RequestValidation, validateRequest } from '@/middleware/requestValidation.js';
import { studyService as getStudyService } from '@/service/studyService.js';

interface PropertyExistsPathParamSchema extends ParamsDictionary {
	entityName: string;
	fieldName: string;
}
interface PropertyExistsQuerySchema extends ParsedQs {
	study: string;
	value: string;
}
const validatePropertyRequestSchema: RequestValidation<
	undefined,
	PropertyExistsQuerySchema,
	PropertyExistsPathParamSchema
> = {
	pathParams: z.object({
		entityName: z.string(),
		fieldName: z.string(),
	}),
	query: z.object({
		study: z.string(),
		value: z.string(),
	}),
};

/**
 * Check if an entity has been submitted for a study. This is intended for file management system
 * to validate if a record has been registered before accepting the corresponding file upload.
 *
 * For PCGL, this check is open for all properties of all entities.
 */
export const validateProperty = validateRequest(validatePropertyRequestSchema, async (request, response, next) => {
	const { entityName, fieldName } = request.params;
	const { study: studyId, value: fieldValue } = request.query;

	logger.debug(`External validation check: ${{ entityName, fieldName, fieldValue, studyId }}`);

	const studyService = getStudyService(getDbInstance());
	const study = await studyService.getStudyById(studyId);

	if (!study) {
		logger.debug(`External validation requested for study "${studyId}" that does not exist.`);
		return next(new lyricProvider.utils.errors.BadRequest(`Study ${studyId} not found.`));
	}

	const categoryId = study?.categoryId;
	if (!categoryId) {
		logger.debug(`External validation failed because study "${studyId}" does not have an assigned category.`);
		return next(
			new lyricProvider.utils.errors.BadRequest(
				`The study ${studyId} is not yet mapped to a category. Data cannot be submitted for this study yet.`,
			),
		);
	}

	const exists = await lyricProvider.services.validation.existsRecord({
		categoryId,
		entityName,
		field: fieldName,
		organization: studyId,
		value: fieldValue,
	});

	if (exists) {
		return response.status(200).send({
			message: 'Record found.',
		});
	} else {
		return next(new lyricProvider.utils.errors.NotFound(`No matching record found.`));
	}
});
