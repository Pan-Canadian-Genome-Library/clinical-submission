import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
	DB_HOST: z.string(),
	DB_NAME: z.string(),
	DB_PASSWORD: z.string(),
	DB_PORT: z.coerce.number().min(100),
	DB_USER: z.string(),
	ID_CUSTOM_ALPHABET: z.string().default('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
	ID_CUSTOM_SIZE: z.coerce.number().default(21),
	ID_USELOCAL: z.coerce.boolean().default(true),
	LECTERN_URL: z.string(),
	LOG_LEVEL: z.string().default('info'),
	NODE_ENV: z.union([z.literal('development'), z.literal('production')]).default('development'),
	SERVER_HOST: z.string().default('localhost'),
	SERVER_PORT: z.coerce.number().min(100).default(3000),
	SERVER_UPLOAD_LIMIT: z.string().default('10mb'),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
	console.error(envParsed.error.issues);
	throw new Error('There is an error with the server environment variables');
}

export const env = envParsed.data;
