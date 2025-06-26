import dotenv from 'dotenv';
import { RefinementCtx, z, ZodIssue } from 'zod';

const NodeEnvOptions = ['development', 'production'] as const;
const LogLeveOptions = ['error', 'warn', 'info', 'debug'] as const;

dotenv.config();

const envSchema = z.object({
	ALLOWED_ORIGINS: z.string().optional(),
	AUDIT_ENABLED: z.coerce.boolean().default(true),
	AUTH_ENABLED: z.coerce.boolean(),
	DB_HOST: z.string(),
	DB_NAME: z.string(),
	DB_PASSWORD: z.string(),
	DB_PORT: z.coerce.number().min(100),
	DB_USER: z.string(),
	ID_USELOCAL: z.coerce.boolean().default(true),
	ID_CUSTOMALPHABET: z.string().default('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
	ID_CUSTOMSIZE: z.coerce.number().default(21),
	ID_MANAGER_SECRET: z.string(),
	ID_MANAGER_CONFIG: z.string().transform((str: string, ctx: RefinementCtx) => {
		const configSchema = z.object({
			entityName: z.string(),
			fieldName: z.string(),
			prefix: z.string(),
			paddingLength: z.number().int().nonnegative(),
		});

		try {
			const parsed = JSON.parse(str);
			if (!Array.isArray(parsed)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'ID_MANAGER_CONFIG must be a JSON array.',
				});
				return z.NEVER;
			}

			const result = z.array(configSchema).safeParse(parsed);
			if (!result.success) {
				result.error.issues.forEach((issue: ZodIssue) => ctx.addIssue(issue));
				return z.NEVER;
			}

			return result.data;
		} catch {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'ID_MANAGER_CONFIG must be a valid JSON stringified array',
			});
			return z.NEVER;
		}
	}),

	LECTERN_URL: z.string().url(),
	LOG_LEVEL: z.enum(LogLeveOptions).default('info'),
	NODE_ENV: z.enum(NodeEnvOptions).default('development'),
	PLURALIZE_SCHEMAS_ENABLED: z.coerce.boolean().default(true),
	SERVER_PORT: z.coerce.number().min(100).default(3030),
	SERVER_UPLOAD_LIMIT: z.string().default('10mb'),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
	console.error(envParsed.error.issues);
	throw new Error('There is an error with the server environment variables.');
}

export const env = envParsed.data;
