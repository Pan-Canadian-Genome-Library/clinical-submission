import { LoggerOptions, pino } from 'pino';

import { env } from './envConfig.js';

const pinoConfig: LoggerOptions = {
	level: env.LOG_LEVEL,
	formatters: {
		level: (label) => {
			return { level: label.toUpperCase() };
		},
	},
	timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger = pino(pinoConfig);
