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

import { UserSessionResult } from '@overture-stack/lyric';
import { Request } from 'express';
import urlJoin from 'url-join';

import { logger } from '@/common/logger.js';
import { ActionIDs, ActionIDsValues, PCGLUserSessionResult, UserDataResponseErrorType } from '@/common/types/auth.js';
import { Groups, userDataResponseSchema, UserDataResponseSchemaType } from '@/common/validation/auth-validation.js';
import { authConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';

/**
 *  Function to perform fetch requests to AUTHZ service
 *
 * @param resource endpoint to query from authz
 * @param token authorization token
 * @param options optional additional request configurations for the fetch call
 *
 */
const fetchAuthZResource = async (resource: string, token: string, options?: RequestInit) => {
	const { AUTHZ_ENDPOINT } = authConfig;

	const url = urlJoin(AUTHZ_ENDPOINT, resource);
	const headers = new Headers({
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	});

	try {
		return await fetch(url, { headers, ...options });
	} catch (error) {
		logger.error(`[AUTHZ]: Something went wrong fetching authz service. ${error}`);
		throw new lyricProvider.utils.errors.InternalServerError(`Bad request: Something went wrong verifying user data`);
	}
};

/**
 *	Fetches user data from authz. This user information is then return as a user object PCGLUserSessionResult or UserSessionResult
 * @param token Access token from Authz
 * @returns validated object of UserDataResponse
 */
export const fetchUserData = async (token: string): Promise<PCGLUserSessionResult | UserSessionResult> => {
	const response = await fetchAuthZResource(`/user/me`, token);

	if (!response.ok) {
		const errorResponse: UserDataResponseErrorType = await response.json();

		logger.error(`[AUTHZ]: Unable to verify user response from AUTHZ. ${errorResponse}`);

		const responseMessage =
			'Something went wrong while verifying PCGL user account information, please try again later.';

		switch (response.status) {
			case 401:
			case 403:
				throw new lyricProvider.utils.errors.Forbidden(responseMessage);
			case 404:
				throw new lyricProvider.utils.errors.NotFound(
					"This account is currently not associated within the PCGL project. This may be due to the fact that you haven't completed the onboarding process for new accounts, or have logged in with an account not previously used to access the service.",
				);
			default:
				throw new lyricProvider.utils.errors.InternalServerError(responseMessage);
		}
	}

	const result: UserDataResponseSchemaType = await response.json();

	const responseValidation = userDataResponseSchema.safeParse(result);

	if (!responseValidation.success) {
		logger.error(`[AUTHZ]: Malformed response object from AUTHZ. ${responseValidation.error}`);

		throw new lyricProvider.utils.errors.ServiceUnavailable('User object response has unexpected format');
	}

	const userTokenInfo: PCGLUserSessionResult = {
		user: {
			username: `${responseValidation.data.userinfo.pcgl_id}`,
			isAdmin: isAdmin({ groups: responseValidation.data.groups }),
			allowedWriteOrganizations: responseValidation.data.study_authorizations.editable_studies,
			groups: extractUserGroups({ groups: responseValidation.data.groups }),
		},
	};

	return userTokenInfo;
};

/**
 *
 * @param study Study user is trying to get access to
 * @param userStudies An array of user studies
 * @returns True or false depending if the user has access to the study
 */
export const hasAllowedAccess = (study: string, userStudies: string[], isAdmin: boolean): boolean => {
	const { enabled } = authConfig;

	// If auth is disabled or if the user is an admin, skip all auth steps
	if (!enabled || isAdmin) {
		return true;
	}

	return userStudies.some((currentStudy) => currentStudy === study);
};

/**
 *	Function that takes in request object, checks if theres an authorization header and returns its token
 *  Only works with Bearer type authorization values
 *
 * @param req Request object
 * @returns Access token or undefined depending if authorization header exists or authorization type is NOT Bearer
 */
export const extractAccessTokenFromHeader = (req: Request): string | undefined => {
	const authHeader = req.headers['authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return;
	}

	return authHeader.replace('Bearer ', '').trim();
};

/**
 * @param groups List of groups users belongs to
 * @returns boolean if user has admin group
 */
const isAdmin = ({ groups }: Groups): boolean => {
	const { groups: configGroups } = authConfig;

	return groups.some((val) => val.name === configGroups.admin);
};

/**
 * @param groups List of groups user belongs to
 * @returns array of strings with names of the groups
 */
const extractUserGroups = ({ groups }: Groups): string[] => {
	return groups.map((currentGroup) => currentGroup.name);
};

/**
 *
 * NOTE: previous solution, before user/me returned "study_authorizations"
 *		 Currently unused, will leave for now incase of spec changes
 *
 * @param study Study user is trying to get access to
 * @param action Type of CRUD operation user is trying to do
 * @param token Access token from Authz
 * @param user User information
 * @returns True or false depending if the user has access to the study
 */
export const hasAllowedAccessAuthz = async (
	study: string,
	action: ActionIDsValues,
	token: string,
	isAdmin: boolean,
): Promise<boolean> => {
	const { actions, enabled } = authConfig;

	// If auth is disabled or if the user is an admin, skip all auth steps
	if (!enabled || isAdmin) {
		return true;
	}

	const response = await fetchAuthZResource(`/allowed`, token, {
		method: 'POST',
		body: JSON.stringify({
			action: {
				endpoint: action === ActionIDs.READ ? actions.read.endpoint : actions.write.endpoint,
				method: action === ActionIDs.READ ? actions.read.method : actions.write.method,
			},
			path: action === ActionIDs.READ ? actions.read.endpoint : actions.write.endpoint,
			method: action === ActionIDs.READ ? actions.read.method : actions.write.method,
			studies: [study],
		}),
	});

	if (!response.ok) {
		const errorResponse: UserDataResponseErrorType = await response.json();

		logger.error(`[AUTHZ]: Unable to verify user access to this study/organization from AUTHZ. ${errorResponse}`);

		const responseMessage =
			'Something went wrong while verifying PCGL user account information, please try again later.';

		switch (response.status) {
			case 401:
			case 403:
				throw new lyricProvider.utils.errors.Forbidden(responseMessage);
			case 404:
				throw new lyricProvider.utils.errors.NotFound(
					"This account is currently not associated within the PCGL project. This may be due to the fact that you haven't completed the onboarding process for new accounts, or have logged in with an account not previously used to access the service.",
				);
			default:
				throw new lyricProvider.utils.errors.InternalServerError(responseMessage);
		}
	}

	const result = await response.json();

	return result[0];
};
