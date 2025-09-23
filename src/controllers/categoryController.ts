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

import { eq, inArray } from 'drizzle-orm';
import { logger } from '@/common/logger.js';
import { getOrDeleteCategoryByID } from '@/common/validation/category-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import { validateRequest } from '@/middleware/requestValidation.js';
import { studyService } from '@/service/studyService.js';
import { study } from '../db/schemas/studiesSchema.js';

const deleteCategoryById = validateRequest(getOrDeleteCategoryByID, async (req, res, next) => {
	const categoryId = Number(req.params.categoryId);
	const database = getDbInstance();

	const studySvc = await studyService(database);
	const user = req.user;

	try {
		if (!user?.isAdmin) {
			throw new lyricProvider.utils.errors.Forbidden('You must be an admin user to use this endpoint.');
		}

		if (isNaN(categoryId)) {
			throw new lyricProvider.utils.errors.BadRequest(`Invalid categoryId: ${categoryId}`);
		}

		const foundCategory = await lyricProvider.services.category.getDetails(categoryId);
		if (!foundCategory) {
			throw new lyricProvider.utils.errors.NotFound(`No Category with ID - ${categoryId} found.`);
		}

		const submittedDataCountPromise = lyricProvider.repositories.submittedData.getTotalRecordsByCategoryId(categoryId);

		const submittedDataCount = await submittedDataCountPromise;
		if (submittedDataCount > 0) {
			throw new lyricProvider.utils.errors.BadRequest(
				`Cannot delete category ${categoryId} because it is linked to ${submittedDataCount} records in submittedData`,
			);
		}

		const linkedStudies = await studySvc.getStudiesByCategoryId(categoryId);
		if (linkedStudies.length > 0) {
			await studySvc.unlinkStudiesFromCategory(categoryId);
		}

		res.status(204).send();
		return;
	} catch (exception) {
		logger.error('Error in deleteCategoryById', exception);
		next(exception);
	}
});

const getCategoryById = validateRequest(getOrDeleteCategoryByID, async (req, res, next) => {
	const categoryId = req.params.categoryId;
	const db = getDbInstance();
	const categorySrvice = lyricProvider.services.category;

	try {
		const foundCategory = await categorySrvice.getDetails(Number(categoryId));
		if (!foundCategory) {
			throw new lyricProvider.utils.errors.NotFound(`No Category with ID - ${categoryId} found.`);
		}

		const categoryIdNum = Number(categoryId);

		if (isNaN(categoryIdNum)) {
			throw new lyricProvider.utils.errors.BadRequest(`Invalid categoryId: ${categoryId}`);
		}

		const linkedStudies = await db.select().from(study).where(eq(study.category_id, categoryIdNum));

		if (linkedStudies.length == 0) {
			logger.info('category is misconfigured, no associated Study');
			throw new lyricProvider.utils.errors.NotFound(
				`category is misconfigured, no associated Study ID - ${categoryId}.`,
			);
		}

		const response = {
			...foundCategory,
			studyId: linkedStudies[0]?.category_id,
		};

		res.status(200).json(response);
		return;
	} catch (exception) {
		logger.error('Error in deleteCategoryById', exception);
		next(exception);
	}
});

const listAllCategories = validateRequest({}, async (req, res, next) => {
	const db = getDbInstance();
	const categoryService = lyricProvider.services.category;

	try {
		const categories = await categoryService.listAll();
		if (!categories || categories.length === 0) {
			return res.status(200).json([]);
		}

		const categoryIds = categories.map((c) => c.id);

		const linkedStudies = await db
			.select({
				studyId: study.study_id,
				categoryId: study.category_id,
			})
			.from(study)
			.where(inArray(study.category_id, categoryIds));

		const studiesByCategory: Record<number, string> = {};
		for (const s of linkedStudies) {
			if (!s.categoryId) {
				continue;
			}
			studiesByCategory[s.categoryId] = s.studyId;
		}

		const response = categories.map((cat) => ({
			...cat,
			studyId: studiesByCategory[cat.id],
		}));

		res.status(200).json(response);
		return;
	} catch (exception) {
		logger.error('Error in listAllCategories', exception);
		next(exception);
	}
});

export default { deleteCategoryById, getCategoryById, listAllCategories };
