import { eq } from 'drizzle-orm';

import { logger } from '@/common/logger.js';
import { getOrDeleteCategoryByID } from '@/common/validation/category-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import { study } from '@/db/schemas/studiesSchema.js';
import { validateRequest } from '@/middleware/requestValidation.js';

const deleteCategoryById = validateRequest(getOrDeleteCategoryByID, async (req, res, next) => {
	const categoryId = req.params.categoryId;
	const db = getDbInstance();
	const categoryRepo = lyricProvider.repositories.category;
	const user = req.user;

	try {
		if (!user?.isAdmin) {
			throw new lyricProvider.utils.errors.Forbidden('You must be an admin user to use this endpoint.');
		}

		const foundCategory = await categoryRepo.getCategoryById(Number(categoryId));
		if (!foundCategory) {
			throw new lyricProvider.utils.errors.NotFound(`No Category with ID - ${categoryId} found.`);
		}

		const categoryIdNum = Number(categoryId);

		if (isNaN(categoryIdNum)) {
			throw new lyricProvider.utils.errors.BadRequest(`Invalid categoryId: ${categoryId}`);
		}

		const linkedStudies = await db.select().from(study).where(eq(study.category_id, categoryIdNum));
		if (linkedStudies.length > 0) {
			throw new lyricProvider.utils.errors.BadRequest(
				`Cannot delete category ${categoryId} because it is linked to ${linkedStudies.length} study(ies).`,
			);
		}

		await db.update(study).set({ category_id: null }).where(eq(study.category_id, categoryIdNum));

		res.status(204).send();
		return;
	} catch (exception) {
		logger.error('Error in deleteCategoryById', exception);
		next(exception);
	}
});

export default { deleteCategoryById };
