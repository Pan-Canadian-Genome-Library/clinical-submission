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

import { UserSession, UserSessionResult } from '@overture-stack/lyric';
import { Request } from 'express';

import { logger } from '@/common/logger.js';
import { ActionIDsValues, Group, UserDataResponseErrorType } from '@/common/types/auth.js';
import { userDataResponseSchema } from '@/common/validation/auth-validation.js';
import { authConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';

/**
 * @param token Access token from Authz
 * @returns validated object of UserDataResponse
 */
export const fetchUserData = async (token: string): Promise<UserSessionResult> => {
	const { AUTHZ_ENDPOINT } = authConfig;
	const url = `${AUTHZ_ENDPOINT}/user/me`;

	const headers = new Headers({
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	});

	const response = await fetch(url, { headers });

	if (!response.ok) {
		const errorResponse: UserDataResponseErrorType = await response.json();

		logger.error(`Error retrieving user data.`, errorResponse.error);
		switch (response.status) {
			case 403:
				throw new lyricProvider.utils.errors.Forbidden(errorResponse.error);
			default:
				throw new lyricProvider.utils.errors.InternalServerError(errorResponse.error);
		}
	}

	const result = await response.json();

	const responseValidation = userDataResponseSchema.safeParse(result);

	if (!responseValidation.success) {
		logger.error(`Error retrieving user data.`, responseValidation.error);

		throw new lyricProvider.utils.errors.ServiceUnavailable(
			'The required fields groups and pcgl_id were not returned in the response object',
		);
	}

	const userTokenInfo: UserSessionResult = {
		user: {
			username: `${responseValidation.data.pcgl_id}`,
			isAdmin: isAdmin(responseValidation.data.groups),
			allowedWriteOrganizations: extractUserGroups(responseValidation.data.groups),
		},
	};

	return userTokenInfo;
};

/**
 * @param study Study user is trying to get access to
 * @param action Type of CRUD operation user is trying to do
 * @param token Access token from Authz
 * @param user User information
 * @returns True or false depending if the user has access to the study
 */
export const hasAllowedAccess = async (
	study: string,
	action: ActionIDsValues,
	token?: string,
	user?: UserSession,
): Promise<boolean> => {
	const { AUTHZ_ENDPOINT, actions, enabled } = authConfig;
	const url = `${AUTHZ_ENDPOINT}/allowed`;

	const headers = new Headers({
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	});

	// If auth is disabled or if the user is an admin, skip all auth steps
	if (!enabled || user?.isAdmin) {
		return true;
	}

	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			action: {
				endpoint: action === 'READ' ? actions.read.endpoint : actions.write.endpoint,
				method: action === 'READ' ? actions.read.method : actions.write.method,
			},
			path: action === 'READ' ? actions.read.endpoint : actions.write.endpoint,
			method: action === 'READ' ? actions.read.method : actions.write.method,
			studies: [study],
		}),
	});

	if (!response.ok) {
		const errorResponse: UserDataResponseErrorType = await response.json();

		logger.error(`Error verifying user token.`, errorResponse.error);

		switch (response.status) {
			case 403:
				throw new lyricProvider.utils.errors.Forbidden(errorResponse.error);
			default:
				throw new lyricProvider.utils.errors.InternalServerError(errorResponse.error);
		}
	}

	const result = await response.json();

	return result[0];
};

/**
 * Simple helper function to extract access token from header
 */
export const extractAccessTokenFromHeader = (req: Request): string | undefined => {
	const authHeader = req.headers['authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return;
	}

	return authHeader.split(' ')[1];
};

/**
 * @param groups List of groups users belongs to
 * @returns boolean if user has admin group
 */
const isAdmin = (groups: Group[]): boolean => {
	const { AUTH_GROUP_ADMIN } = authConfig;

	return groups.some((val) => val.name === AUTH_GROUP_ADMIN);
};

/**
 * @param groups List of groups user belongs to
 * @returns array of strings with names of the groups
 */
const extractUserGroups = (groups: Group[]): string[] => {
	const parsedGroups: string[] = groups.reduce((acu: string[], currentGroup) => {
		acu.push(currentGroup.name);
		return acu;
	}, []);

	return parsedGroups;
};
