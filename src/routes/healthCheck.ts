import express, { Request, Response, Router } from 'express';

export const healthCheckRouter: Router = (() => {
	const router = express.Router();

	router.get('/', (_req: Request, res: Response) => {
		return res.status(200).send('Service is healthy');
	});

	return router;
})();
