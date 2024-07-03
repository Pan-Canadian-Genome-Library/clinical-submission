import dotenv from 'dotenv';
import { z } from 'zod';

const NodeEnvOptions = ['development', 'production'] as const;
const LogLeveOptions = ['error', 'warn', 'info', 'debug'] as const;

dotenv.config();

const envSchema = z.object({
	ALLOWED_ORIGINS: z.string().optional(),
	DB_HOST: z.string(),
	DB_NAME: z.string(),
	DB_PASSWORD: z.string(),
	DB_PORT: z.coerce.number().min(100),
	DB_USER: z.string(),
	LECTERN_URL: z.string().url(),
	LOG_LEVEL: z.enum(LogLeveOptions).default('info'),
	NODE_ENV: z.enum(NodeEnvOptions).default('development'),
	SERVER_PORT: z.coerce.number().min(100).default(3000),
	SERVER_UPLOAD_LIMIT: z.string().default('10mb'),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
	console.error(envParsed.error.issues);
	throw new Error('There is an error with the server environment variables.');
}

export const env = envParsed.data;
