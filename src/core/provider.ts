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
		customAlphabet: env.ID_CUSTOM_ALPHABET,
		customSize: env.ID_CUSTOM_SIZE,
		useLocal: env.ID_USELOCAL,
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
