import express from 'express';

import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import { studyService } from '@/service/studyService.js';
const dictionaryRouter = express.Router();

dictionaryRouter.post('/register', async (req, res, next) => {
	try {
		const { studyId, categoryName, dictionaryName, dictionaryVersion, defaultCentricEntity } = req.body;

		const db = getDbInstance();
		const studyRepo = studyService(db);

		if (!studyId) {
			return res.status(400).json({ error: 'studyId is required' });
		}

		const foundStudy = await studyRepo.getStudyById(studyId);
		if (!foundStudy) {
			return res.status(404).json({ error: `Study with ID ${studyId} not found` });
		}

		const { dictionary, category } = await lyricProvider.services.dictionary.register({
			categoryName,
			dictionaryName,
			dictionaryVersion,
			defaultCentricEntity,
		});

		// updating Study table with category.id
		await studyRepo.updateStudy(studyId, { categoryId: category.id });

		return res.json({ dictionary, category });
	} catch (exception) {
		next(exception);
	}
});

dictionaryRouter.use('/', lyricProvider.routers.dictionary);

export { dictionaryRouter };
