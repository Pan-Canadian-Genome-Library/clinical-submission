import { Request, Response } from 'express';
import { pinoHttp } from 'pino-http';

const ignoreUrls = ['/api-docs', '/health'];

export const requestLogger = pinoHttp({
	autoLogging: {
		ignore(req) {
			// disable Swagger UI logs and health endpoints
			return ignoreUrls.some((url) => req.url?.startsWith(url)) ?? false;
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
