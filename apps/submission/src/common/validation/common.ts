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

import { ParsedQs } from 'qs';
import { z as zod } from 'zod';

export const stringNotEmpty = zod.string().trim().min(1);
export const stringNotEmptyOptional = stringNotEmpty.or(zod.literal('')).optional();
export const orderByString = zod.literal('asc').or(zod.literal('desc'));

/**
 * Zod's `zod.coerce` does not work in an "expected" way for booleans and will always return `true`
 * for a boolean if the string it's parsing is not empty. This function will make the type
 * check work in an "expected" way if used in conjunction with the zod `zod.preprocess` function.
 *
 * @see https://github.com/colinhacks/zod/discussions/3329
 *
 * @param potentialBoolean `unknown` - untyped and unconverted boolean value
 * @returns `boolean` `true` if processed to true, or `false` if false.
 */
export const processCoercedBoolean = (potentialBoolean: unknown) => {
	return String(potentialBoolean).toLowerCase().trim() === 'true' ? true : false;
};

export const positiveInteger = zod.string().superRefine((value, ctx) => {
	const parsed = parseInt(value);
	if (isNaN(parsed)) {
		ctx.addIssue({
			code: zod.ZodIssueCode.invalid_type,
			expected: 'number',
			received: 'nan',
		});
	}

	if (parsed < 1) {
		ctx.addIssue({
			code: zod.ZodIssueCode.too_small,
			minimum: 1,
			inclusive: true,
			type: 'number',
		});
	}
});

export const nonNegativeInteger = zod.string().superRefine((value, ctx) => {
	const parsed = parseInt(value);
	if (isNaN(parsed)) {
		ctx.addIssue({
			code: zod.ZodIssueCode.invalid_type,
			expected: 'number',
			received: 'nan',
		});
	}

	if (parsed < 0) {
		ctx.addIssue({
			code: zod.ZodIssueCode.too_small,
			minimum: 0,
			inclusive: true,
			type: 'number',
		});
	}
});

export interface PaginationParams extends ParsedQs {
	orderBy?: string;
	page?: string;
	pageSize?: string;
}

/**
 * Function that returns true if input is a valid number greater than zero.
 * Otherwise it returns false
 */
export const isValidIdNumber = (value: unknown): boolean => {
	return typeof value === 'number' && !isNaN(value) && value > 0 && value < Number.MAX_VALUE;
};
/**
 * Schema for validating category ID or alias.
 */
export const categoryIdSchema = zod
	.string()
	.trim()
	.min(1)
	.refine(
		(value) => (/^\d+$/.test(value) && isValidIdNumber(Number(value))) || isValidCategoryAlias(value),
		'Invalid category ID. Must be a positive integer or a valid alias.',
	);

/**
 * Checks if a string is safe as a category alias: a non-empty URL-safe slug (letters, numbers,
 * hyphens, underscores, periods). A value that is *only* digits (e.g. `"5"`) is rejected, since
 * category ids are whole numbers and an alias must never be able to collide with one, now or once
 * the id sequence catches up to it. A value containing any other character, including a decimal
 * point (e.g. `"2.5"`, `"v5"`, `"5-donor"`), can never be mistaken for an id and is allowed,
 * including a data version label.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidCategoryAlias(value: string): boolean {
	if (/^\d+$/.test(value)) {
		return false;
	}
	return /^[A-Za-z0-9_.-]+$/.test(value);
}

export const categoryAliasSchema = zod
	.string()
	.trim()
	.refine((value) => isValidCategoryAlias(value), 'alias must contain only letters, numbers, hyphens, and underscores');
