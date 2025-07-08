/*
 * Copyright (c) 2025 The Ontario Institute for Cancer Research. All rights reserved
 *
 * This program and the accompanying materials are made available under the terms of
 * the GNU Affero General Public License v3.0. You should have received a copy of the
 * GNU Affero General Public License along with this program.
 *  If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

import { processCoercedBoolean } from '@/common/validation/common.js';

const NodeEnvOptions = ['development', 'production'] as const;
const LogLevelOptions = ['error', 'warn', 'info', 'debug'] as const;

export const HttpMethods = ['GET', 'POST', 'PUT', 'DELETE'] as const;
export type HttpMethod = (typeof HttpMethods)[number];

const parseHttpMethods = (value: string) => {
	return value
		.split(',')
		.filter((v) => v.trim() !== '')
		.map((v) => v.trim().toUpperCase());
};

const IDManagerConfigSchema = z.object({
	entityName: z.string(),
	fieldName: z.string(),
	prefix: z.string(),
	paddingLength: z.coerce.number().default(8),
	parentEntityName: z.string().optional(),
	parentFieldName: z.string().optional(),
});

dotenv.config();

const envSchema = z.object({
	API_HOST: z.string().url(),
	ALLOWED_ORIGINS: z.string().optional(),
	AUDIT_ENABLED: z.preprocess((val) => processCoercedBoolean(val), z.boolean()).default(true),
	AUTH_ENABLED: z.preprocess((val) => processCoercedBoolean(val), z.boolean()).default(false),
	AUTH_PROTECT_METHODS: z
		.string()
		.default(HttpMethods.join(','))
		.transform(parseHttpMethods)
		.pipe(z.array(z.enum(HttpMethods))),
	DB_HOST: z.string(),
	DB_NAME: z.string(),
	DB_PASSWORD: z.string(),
	DB_PORT: z.coerce.number().min(100),
	DB_USER: z.string(),
	ID_USELOCAL: z.preprocess((val) => processCoercedBoolean(val), z.boolean()).default(true),
	ID_CUSTOM_ALPHABET: z.string().default('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
	ID_CUSTOM_SIZE: z.coerce.number().default(21),
	LECTERN_URL: z.string().url(),
	LOG_LEVEL: z.enum(LogLevelOptions).default('info'),
	NODE_ENV: z.enum(NodeEnvOptions).default('development'),
	PLURALIZE_SCHEMAS_ENABLED: z.preprocess((val) => processCoercedBoolean(val), z.boolean()).default(true),
	SERVER_PORT: z.coerce.number().min(100).default(3030),
	SERVER_UPLOAD_LIMIT: z.string().default('10mb'),
	ID_MANAGER_CONFIG: z.string().transform((val, ctx) => {
		try {
			const parsed = JSON.parse(val);
			const validation = z.array(IDManagerConfigSchema).safeParse(parsed);
			if (!validation.success) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid ID_MANAGER_CONFIG: ${validation.error.message}`,
				});
				return z.NEVER;
			}
			return validation.data;
		} catch {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ID_MANAGER_CONFIG must be valid JSON' });
			return z.NEVER;
		}
	}),
	ID_MANAGER_SECRET: z.string().min(1, 'ID_MANAGER_SECRET is required'),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
	console.error(envParsed.error.issues);
	throw new Error('There is an error with the server environment variables.');
}

export const env = envParsed.data;
