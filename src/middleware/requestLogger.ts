import { Request, Response } from 'express';
import { pinoHttp } from 'pino-http';

export const requestLogger = pinoHttp({
	autoLogging: {
		ignore(req) {
			// disable Swagger UI logs
			return req.url?.startsWith('/api-docs') ?? false;
		},
	},
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
