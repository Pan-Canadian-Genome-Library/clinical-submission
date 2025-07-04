import { AppConfig, provider } from '@overture-stack/lyric';

import { env } from '@/config/envConfig.js';

const appConfig: AppConfig = {
	db: {
		host: env.DB_HOST,
		port: env.DB_PORT,
		database: env.DB_NAME,
		user: env.DB_USER,
		password: env.DB_PASSWORD,
	},
	auth: {
		enabled: env.AUTH_ENABLED,
		protectedMethods: env.AUTH_PROTECT_METHODS,
	},
	idService: {
		customAlphabet: env.ID_CUSTOM_ALPHABET,
		customSize: env.ID_CUSTOM_SIZE,
		useLocal: env.ID_USELOCAL,
	},
	features: {
		audit: {
			enabled: env.AUDIT_ENABLED,
		},
		recordHierarchy: {
			pluralizeSchemasName: env.PLURALIZE_SCHEMAS_ENABLED,
		},
	},
	logger: {
		level: env.LOG_LEVEL,
	},
	schemaService: {
		url: env.LECTERN_URL,
	},
};

export const lyricProvider = provider(appConfig);
