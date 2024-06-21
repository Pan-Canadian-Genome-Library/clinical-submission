import { Request, Response } from 'express';
import { pinoHttp } from 'pino-http';

import { logger } from '@/common/logger.js';

export const requestLogger = pinoHttp({
	logger,
	serializers: {
		req: (req: Request) => ({
			id: req.id,
			method: req.method,
			url: req.url,
			query: req.query,
		}),
		res: (res: Response) => ({
			statusCode: res.statusCode,
		}),
	},
});
