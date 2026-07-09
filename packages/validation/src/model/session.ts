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

export const sessionAccount = z.object({
	idToken: z.string(),
	accessToken: z.string(),
	refreshToken: z.string(),
	refreshTokenIat: z.number().int(),
});
export type SessionAccount = z.infer<typeof sessionAccount>;

// Session values retrieved from Authz and Auth services
const authGeneratedSessionValues = z.object({
	userId: z.string(),
	sub: z.string(),
	givenName: z.string().optional(),
	familyName: z.string().optional(),
	emails: z.array(
		z.object({
			address: z.string().email(),
			type: z
				.literal('official')
				.or(z.literal('delivery').or(z.literal('forwarding').or(z.literal('personal'))))
				.optional(),
		}),
	),
	siteAdmin: z.boolean().default(false),
	dataAdmin: z.boolean().default(false),
	studyAuthorizations: z.object({
		editableStudies: z.array(z.string()).optional(),
		readableStudies: z.array(z.string()).optional(),
	}),
	dacAuthorizations: z.array(
		z
			.object({
				studyId: z.string(),
				startDate: z.string(),
				endDate: z.string(),
			})
			.optional(),
	),
	groups: z
		.array(
			z.object({
				description: z.string(),
				id: z.number().int(),
				name: z.string(),
			}),
		)
		.optional(),
});

export type SessionUser = z.infer<typeof authGeneratedSessionValues>;
