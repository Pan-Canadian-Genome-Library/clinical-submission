import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { z } from 'zod';

import { type RequestValidation } from '@/middleware/requestValidation.js';

interface SubmitRequestPathParams extends ParamsDictionary {
	categoryId: string;
}

export const submitRequestSchema: RequestValidation<
	{
		studyId: any;
		organization: string;
	},
	ParsedQs,
	SubmitRequestPathParams
> = {
	body: z.object({
		organization: z.string(),
		studyId: z.string(),
	}),
	pathParams: z.object({
		categoryId: z.string(),
	}),
};

interface EditRequestPathParams extends ParamsDictionary {
	categoryId: string;
}

export const editDataRequestSchema: RequestValidation<
	{
		studyId: any;
		organization: string;
	},
	ParsedQs,
	EditRequestPathParams
> = {
	body: z.object({
		organization: z.string(),
		studyId: z.string(),
	}),
	pathParams: z.object({
		categoryId: z.string(),
	}),
};
