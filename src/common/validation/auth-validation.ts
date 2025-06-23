import { ParsedQs } from 'qs';
import { z as zod } from 'zod';

import { RequestValidation } from '@/middleware/requestValidation.js';

import { stringNotEmpty } from './common.js';

export const oidcUserInfoResponseSchema = zod.object({
	sub: zod.string(),
	given_name: zod.string().optional(),
	family_name: zod.string().optional(),
	email: zod.string().optional(),
});
export type OIDCUserInfoResponse = zod.infer<typeof oidcUserInfoResponseSchema>;

export const oidcTokenResponseSchema = zod.object({
	access_token: zod.string(),
	refresh_token: zod.string().optional(),
	refresh_token_iat: zod.number().optional(),
	id_token: zod.string(),
});
export type OIDCTokenResponse = zod.infer<typeof oidcTokenResponseSchema>;

export const OIDCCodeResponse: RequestValidation<object, ParsedQs, string> = {
	query: zod.object({
		code: stringNotEmpty,
	}),
};
