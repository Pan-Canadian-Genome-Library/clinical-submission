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

import { RequestValidation } from '@/middleware/requestValidation.js';

import { stringNotEmpty } from './common.js';

export const userDataResponseSchema = z.object({
	userinfo: z.object({
		emails: z.array(
			z
				.object({
					type: z.string(),
					address: z.string(),
				})
				.optional(),
		),
		pcgl_id: z.string(),
		site_admin: z.boolean(),
		site_curator: z.boolean(),
	}),
	study_authorizations: z.object({
		editable_studies: z.array(z.string()),
		readable_studies: z.array(z.string()),
	}),
	dac_authorizations: z.array(
		z.object({
			end_date: z.string(),
			start_date: z.string(),
			study_id: z.string(),
		}),
	),
	groups: z.array(
		z.object({
			id: z.coerce.string(),
			name: z.string(),
			description: z.string(),
		}),
	),
});

export const oidcUserInfoResponseSchema = z.object({
	sub: z.string(),
	given_name: z.string().optional(),
	family_name: z.string().optional(),
	email: z.string().optional(),
});
export type OIDCUserInfoResponse = z.infer<typeof oidcUserInfoResponseSchema>;

export const oidcTokenResponseSchema = z
	.object({
		access_token: z.string(),
		refresh_token: z.string().optional(),
		refresh_token_iat: z.number().optional(),
		id_token: z.string(),
	})
	.or(
		z.object({
			error: z.string(),
			error_description: z.string(),
		}),
	);
export type OIDCTokenResponse = z.infer<typeof oidcTokenResponseSchema>;

export interface OIDCCodeParams extends ParsedQs {
	code: string;
}

export const OIDCCodeResponse: RequestValidation<object, OIDCCodeParams, string> = {
	query: z.object({
		code: stringNotEmpty,
	}),
};
