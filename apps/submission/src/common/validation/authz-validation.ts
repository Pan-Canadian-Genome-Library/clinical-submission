/*
 * Copyright (c) 2026 The Ontario Institute for Cancer Research. All rights reserved
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

import { z } from 'zod';

/**
 * AuthZ `GET /user/{pcgl_id}` response, as returned for `/user/me`: the user's details,
 * the studies they can read and edit, their DAC authorizations, and their COManage groups.
 */
export const authZUserInfo = z.object({
	userinfo: z.object({
		emails: z.array(
			z.object({
				address: z.string(),
				/**
				 * COManage email type, e.g. `official` or `personal`.
				 */
				type: z.string().optional(),
			}),
		),
		pcgl_id: z.string(),
		site_admin: z.boolean().default(false),
		data_admin: z.boolean().default(false),
	}),
	study_authorizations: z.object({
		editable_studies: z.array(z.string()).optional(),
		readable_studies: z.array(z.string()).optional(),
	}),
	dac_authorizations: z.array(
		z
			.object({
				study_id: z.string(),
				start_date: z.string(),
				end_date: z.string(),
			})
			.optional(),
	),
	groups: z
		.array(
			z.object({
				description: z.string(),
				// COManage group IDs are integers, but numeric strings are accepted too.
				id: z.coerce.number().int(),
				name: z.string(),
			}),
		)
		.optional(),
});
export type PCGLAuthZUserInfoResponse = z.infer<typeof authZUserInfo>;
export type Groups = Pick<PCGLAuthZUserInfoResponse, 'groups'>;

/**
 * AuthZ `POST /service/{service_id}/verify` response containing a new service token.
 */
export const ServiceTokenResponse = z.object({
	token: z.string(),
});
export type ServiceTokenResponse = z.infer<typeof ServiceTokenResponse>;

/**
 * AuthZ response to verifying a service token. `result` is true when the token belongs to the service.
 */
export const ServiceTokenVerificationResponse = z.object({
	result: z.boolean(),
});
export type ServiceTokenVerificationResponse = z.infer<typeof ServiceTokenVerificationResponse>;

/**
 * Error body returned by AuthZ, e.g. `{ "error": "Service UUID does not match service name" }`.
 */
export const AuthZErrorResponse = z.object({
	error: z.string(),
});
export type AuthZErrorResponse = z.infer<typeof AuthZErrorResponse>;
