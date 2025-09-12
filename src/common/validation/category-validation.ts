import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { z } from 'zod';

import { RequestValidation } from '@/middleware/requestValidation.js';

import { stringNotEmpty } from './common.js';

interface CategoryIDParams extends ParamsDictionary {
	categoryId: string;
}

export const getOrDeleteCategoryByID: RequestValidation<object, ParsedQs, CategoryIDParams> = {
	pathParams: z.object({
		categoryId: stringNotEmpty,
	}),
};
