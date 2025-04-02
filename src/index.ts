import { env } from '@/common/envConfig.js';
import { logger } from '@/common/logger.js';
import { app } from '@/server.js';

const { NODE_ENV, SERVER_PORT } = env;

const server = app.listen(SERVER_PORT, () => {
	logger.info(`Server started. Running in "${NODE_ENV}" mode. Listening to port ${SERVER_PORT}`);

	if (NODE_ENV === 'development') {
		logger.info(`Swagger API Docs are available at http://localhost:${SERVER_PORT}/api-docs`);
	}
});

const onCloseSignal = () => {
	logger.info('sigint received, shutting down');
	server.close(() => {
		logger.info('server closed');
		process.exit();
	});
	setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on('SIGINT', onCloseSignal);
process.on('SIGTERM', onCloseSignal);
