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

import { z as zod } from 'zod';

export const authZUserInfo = zod.object({
	userinfo: zod.object({
		emails: zod.array(
			zod.object({
				address: zod.string().email(),
				type: zod
					.literal('official')
					.or(zod.literal('delivery').or(zod.literal('forwarding').or(zod.literal('personal'))))
					.optional(),
			}),
		),
		pcgl_id: zod.string(),
		site_admin: zod.boolean().default(false),
		data_admin: zod.boolean().default(false),
	}),
	study_authorizations: zod.object({
		editable_studies: zod.array(zod.string()).optional(),
		readable_studies: zod.array(zod.string()).optional(),
	}),
	dac_authorizations: zod.array(
		zod
			.object({
				study_id: zod.string(),
				start_date: zod.string(),
				end_date: zod.string(),
			})
			.optional(),
	),
	groups: zod
		.array(
			zod.object({
				description: zod.string(),
				id: zod.number().int(),
				name: zod.string(),
			}),
		)
		.optional(),
});
export type PCGLAuthZUserInfoResponse = zod.infer<typeof authZUserInfo>;

export const authZStudyAuthorizationResponse = zod.object({
	dac_id: zod.object({}).or(zod.string()),
	data_submitters: zod.array(zod.string()),
	date_created: zod.string(),
	study_id: zod.string(),
	team_members: zod.array(zod.string()),
});
export type PCGLAuthZStudyAuthorizationResponse = zod.infer<typeof authZStudyAuthorizationResponse>;

export const authzStudyAuthorizationRequest = authZStudyAuthorizationResponse.extend({
	date_created: authZStudyAuthorizationResponse.shape.date_created.optional(),
});
export type PCGLAuthZStudyAuthorizationRequest = zod.infer<typeof authzStudyAuthorizationRequest>;
