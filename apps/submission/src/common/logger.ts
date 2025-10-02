import { LoggerOptions, pino, stdTimeFunctions } from 'pino';

import { env } from '@/config/envConfig.js';

const pinoConfig: LoggerOptions = {
	level: env.LOG_LEVEL,
	formatters: {
		level: (label) => {
			return { level: label.toUpperCase() };
		},
	},
	timestamp: stdTimeFunctions.isoTime,
};

export const logger = pino(pinoConfig);
