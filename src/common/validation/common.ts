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
import { z } from 'zod';

export const stringNotEmpty = z.string().trim().min(1);
export const stringNotEmptyOptional = stringNotEmpty.optional();
export const orderByString = z.literal('asc').or(z.literal('desc'));

export const positiveInteger = z.string().superRefine((value, ctx) => {
	const parsed = parseInt(value);
	if (isNaN(parsed)) {
		ctx.addIssue({
			code: z.ZodIssueCode.invalid_type,
			expected: 'number',
			received: 'nan',
		});
	}

	if (parsed < 1) {
		ctx.addIssue({
			code: z.ZodIssueCode.too_small,
			minimum: 1,
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
