import { LoggerOptions, pino } from 'pino';

import { env } from './envConfig.js';

const pinoConfig = {
	level: env.LOG_LEVEL,
	transport: {
		target: 'pino-pretty',
	},
} as LoggerOptions;

export const logger = pino(pinoConfig);
