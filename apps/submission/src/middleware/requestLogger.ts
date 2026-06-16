import { RequestWithUser } from '@overture-stack/lyric';
import { Response } from 'express';
import { pinoHttp } from 'pino-http';

const ignoreUrls = ['/api-docs', '/health', '/auth/token'];

export const requestLogger = pinoHttp({
	autoLogging: {
		ignore(req) {
			// disable Swagger UI logs and health endpoints
			return ignoreUrls.some((url) => req.url?.startsWith(url)) ?? false;
		},
	},
	serializers: {
		req: (_: RequestWithUser) => {},
		res: (_) => {},
	},
	customReceivedObject: (_: RequestWithUser, __: Response) => {}, // Needed to type the customProps, customProps inherits the types from customReceivedObject
	customProps: (req, res) => {
		const requestContext = res.locals.requestContext;

		return {
			user: req.user?.username,
			params: requestContext?.params || {},
			query: requestContext?.query || {},
			body: requestContext?.body || {},
			status: res.statusCode,
			method: req.method,
			url: req.originalUrl,
		};
	},
	quietReqLogger: true,
	quietResLogger: true,
});
