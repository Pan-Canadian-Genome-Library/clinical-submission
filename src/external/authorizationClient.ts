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

import { ActionIDs, ActionIDsValues, UserDataResponse, UserDataResponseErrorType } from '@/common/types/auth.js';
import { userDataResponseSchema } from '@/common/validation/auth-validation.js';
import { authEnvConfig } from '@/config/authEnvConfig.js';
import { lyricProvider } from '@/core/provider.js';

export const fetchUserData = async (token: string): Promise<UserDataResponse> => {
	const { AUTHZ_URL } = authEnvConfig;
	const url = `${AUTHZ_URL}/authz/user/me`;

	const headers = new Headers({
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	});

	const response = await fetch(url, { headers });

	if (!response.ok) {
		const errorResponse: UserDataResponseErrorType = await response.json();

		switch (response.status) {
			case 403:
				throw new lyricProvider.utils.errors.Forbidden(errorResponse.error);
			default:
				throw new lyricProvider.utils.errors.InternalServerError(errorResponse.error);
		}
	}

	const result = await response.json();

	if (userDataResponseSchema.safeParse(result)) {
		throw new lyricProvider.utils.errors.ServiceUnavailable(
			'The required fields groups and pcgl_id were not returned in the response object',
		);
	}

	return result;
};

export const verifyAllowedAccess = async (
	token: string,
	study: string,
	action: ActionIDsValues,
): Promise<UserDataResponse> => {
	const { AUTHZ_URL } = authEnvConfig;
	const url = `${AUTHZ_URL}/authz/allowed`;

	const headers = new Headers({
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	});

	// determine method value
	const methodResult = determineActionMethod(action);

	if (!methodResult) {
		throw new lyricProvider.utils.errors.BadRequest('Invalid action value');
	}

	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			action: {
				endpoint: action,
				method: methodResult,
			},
			path: action,
			method: methodResult,
			studies: [study],
		}),
	});

	if (!response.ok) {
		const errorResponse: UserDataResponseErrorType = await response.json();

		switch (response.status) {
			case 403:
				throw new lyricProvider.utils.errors.Forbidden(errorResponse.error);
			default:
				throw new lyricProvider.utils.errors.InternalServerError(errorResponse.error);
		}
	}

	const result = await response.json();

	if (userDataResponseSchema.safeParse(result)) {
		throw new lyricProvider.utils.errors.ServiceUnavailable(
			'The required fields groups and pcgl_id were not returned in the response object.',
		);
	}

	return result;
};

const determineActionMethod = (action: ActionIDsValues) => {
	switch (action) {
		case ActionIDs.READ:
			return 'GET';
		case ActionIDs.WRITE:
			return 'POST';
		case ActionIDs.UPDATE: // NOTE: not an action returned from `/services`. Added just incase
			return 'PUT';
		case ActionIDs.DELETE: // NOTE: not an action returned from `/services`. Added just incase
			return 'DELETE';
		default:
			return;
	}
};
