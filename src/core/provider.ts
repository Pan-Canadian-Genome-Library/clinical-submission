import { AppConfig, provider } from '@overture-stack/lyric';

import { env } from '@/common/envConfig.js';

const appConfig: AppConfig = {
	db: {
		host: env.DB_HOST,
		port: env.DB_PORT,
		database: env.DB_NAME,
		user: env.DB_USER,
		password: env.DB_PASSWORD,
	},
	idService: {
		// Hardcoded values to keep consistency on PCGL
		customAlphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		customSize: 21,
		useLocal: true,
	},
	limits: {
		fileSize: env.SERVER_UPLOAD_LIMIT,
	},
	logger: {
		level: env.LOG_LEVEL,
	},
	schemaService: {
		url: env.LECTERN_URL,
	},
};

export const lyricProvider = provider(appConfig);
