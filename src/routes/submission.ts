import express, { Router } from 'express';
import multer from 'multer';

import { env } from '@/config/envConfig.js';
import { editData } from '@/controllers/submission/editData.js';
import getSubmissionController from '@/controllers/submission/getSubmission.js';
import { submit } from '@/controllers/submission/submit.js';
import { lyricProvider } from '@/core/provider.js';
import { authMiddleware } from '@/middleware/auth.js';
import { getSizeInBytes } from '@/submission/format.js';
const fileSizeLimit = getSizeInBytes(env.SERVER_UPLOAD_LIMIT);
const upload = multer({ dest: '/tmp', limits: { fileSize: fileSizeLimit } });

export const submissionRouter: Router = (() => {
	const router = express.Router();

	router.get('/:submissionId', authMiddleware(), getSubmissionController.getSubmissionById);
	router.get('/category/:categoryId', authMiddleware(), getSubmissionController.getSubmissionsByCategory);
	router.post('/category/:categoryId/data', authMiddleware(), upload.array('files'), submit);
	router.put('/category/:categoryId/data', authMiddleware(), upload.array('files'), editData);

	router.use('', lyricProvider.routers.submission);

	return router;
})();
