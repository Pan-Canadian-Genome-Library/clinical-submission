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

import urlJoin from 'url-join';

import { ServiceAuthHeaders } from '@/auth/serviceAuth.js';
import type { PCGLUserAuthorizationResult } from '@/auth/types.js';
import { logger } from '@/common/logger.js';
import {
	AuthZErrorResponse,
	authZUserInfo,
	Groups,
	PCGLAuthZUserInfoResponse,
	ServiceTokenResponse,
	ServiceTokenVerificationResponse,
} from '@/common/validation/authz-validation.js';
import { authConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';

/**
 * Store the service token fetched form AuthZ. This service token is used
 * to identify the service that is requesting user information. It will expire
 * periodically and require being fetched again.
 */
let serviceToken: string | undefined = undefined;

/**
 * Service token request to AuthZ currently in progress, or undefined when none is running.
 */
let pendingRefreshAuthZServiceTokenRequest: Promise<void> | undefined = undefined;

/**
 * Fetches a new AuthZ service token and stores it in `serviceToken`. Calls made while a
 * request is in progress wait for that request instead of starting another.
 * @throws InternalServerError when:
 * - AuthZ cannot be reached
 * - AuthZ responds with a status other than 200
 * - AuthZ rejects the configured service UUID for the service ID
 * - AuthZ responds without a token
 */
const refreshAuthZServiceToken = async (): Promise<void> => {
	// If request is in progress, return that one.
	if (pendingRefreshAuthZServiceTokenRequest) {
		return pendingRefreshAuthZServiceTokenRequest;
	}

	// Actual request to AuthZ for the Service Token
	const requestServiceToken = async (): Promise<void> => {
		const { AUTHZ_ENDPOINT } = authConfig;
		const errorMessage = 'System Error: Something went wrong connecting to authorization service.';

		const url = urlJoin(AUTHZ_ENDPOINT, `/service/${authConfig.service.id}/verify`);

		let response: Response;
		try {
			response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					service_uuid: authConfig.service.uuid,
				}),
			});
		} catch (error) {
			logger.error(error, `[AUTHZ]: Something went wrong fetching authz service token.`);
			throw new lyricProvider.utils.errors.InternalServerError(errorMessage);
		}

		// Any status other than 200 is a failure, including 204 which AuthZ can return without a token.
		if (response.status !== 200) {
			const responseText = await response.text().catch(() => '');
			logger.error(`[AUTHZ]: Service token request failed with status ${response.status}. ${responseText}`);
			throw new lyricProvider.utils.errors.InternalServerError(errorMessage);
		}

		const responseBody: unknown = await response.json().catch(() => undefined);

		const tokenResponse = ServiceTokenResponse.safeParse(responseBody);
		if (tokenResponse.success) {
			serviceToken = tokenResponse.data.token;
			return;
		}

		// AuthZ responds with status 200 and an error body when the service UUID does not match the UUID
		// registered for the service ID.
		const errorResponse = AuthZErrorResponse.safeParse(responseBody);
		if (errorResponse.success) {
			logger.error(
				`[AUTHZ]: AuthZ rejected the service token request: ${errorResponse.data.error}. Check that AUTHZ_SERVICE_UUID matches the UUID registered for AUTHZ_SERVICE_ID "${authConfig.service.id}".`,
			);
		} else {
			logger.error(`[AUTHZ]: Malformed service token response.`);
		}
		throw new lyricProvider.utils.errors.InternalServerError(errorMessage);
	};

	pendingRefreshAuthZServiceTokenRequest = requestServiceToken().finally(() => {
		pendingRefreshAuthZServiceTokenRequest = undefined;
	});
	return pendingRefreshAuthZServiceTokenRequest;
};

/**
 * Function to perform fetch requests to AUTHZ service
 * @param resource endpoint to query from authz
 * @param token authorization token
 * @param options optional additional request configurations for the fetch call
 *
 */
const fetchAuthZResource = async (resource: string, token: string, options?: RequestInit) => {
	/**
	 * Internal function that does the work of fetching the resource from AuthZ.
	 * We will need to retry this if this is rejected due to an expired serviceToken.
	 */
	async function _fetchFromAuthZ() {
		const { AUTHZ_ENDPOINT } = authConfig;

		const url = urlJoin(AUTHZ_ENDPOINT, resource);
		const headers = new Headers({
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'X-Service-ID': `${authConfig.service.id}`,
			'X-Service-Token': `${serviceToken}`,
		});

		try {
			return await fetch(url, { headers, ...options });
		} catch (error) {
			logger.error(`[AUTHZ]: Something went wrong fetching authz service. ${error}`);
			throw new lyricProvider.utils.errors.InternalServerError(`Bad request: Something went wrong verifying user data`);
		}
	}

	// If the serviceToken doesn't exist, then call refresh service token
	if (serviceToken === undefined) {
		await refreshAuthZServiceToken();
	}

	// store the current token so that if a failure happens we can check if a concurrent request replaces it
	const tokenUsed = serviceToken;

	// Make the actual desired request
	const firstResponse = await _fetchFromAuthZ();
	// CASE-1: Bad bearer token
	if (!firstResponse.ok && firstResponse.status === 401) {
		logger.error(`[AUTHZ]: Bearer token is invalid`);

		throw new Error('Something went wrong while verifying PCGL user account information, please try again later.');
	}
	// CASE-2: Bad serviceToken
	// Trigger refresh service token and recall with the new token
	if (!firstResponse.ok && firstResponse.status === 403) {
		// Check if the service token was replaced while the first request was in flight
		if (serviceToken === tokenUsed) {
			await refreshAuthZServiceToken();
		}
		return await _fetchFromAuthZ();
	}

	return firstResponse;
};

/**
 *	Fetches user data from authz. This user information is then return as a user object PCGLUserAuthorizationResult
 * @param token Access token from Authz
 * @returns the user mapped from the AuthZ `/user/me` response
 */
export const fetchUserData = async (token: string): Promise<PCGLUserAuthorizationResult> => {
	const response = await fetchAuthZResource(`/user/me`, token);

	if (!response.ok) {
		const errorResponse = await response.json();

		logger.error(`[AUTHZ]: Unable to verify user response from AUTHZ. ${JSON.stringify(errorResponse)}`);

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

	const responseValidation = authZUserInfo.safeParse(result);

	if (!responseValidation.success) {
		logger.error(`[AUTHZ]: Malformed response object from AUTHZ. ${responseValidation.error}`);

		throw new lyricProvider.utils.errors.ServiceUnavailable('User object response has unexpected format');
	}

	const userTokenInfo: PCGLUserAuthorizationResult = {
		user: {
			username: `${responseValidation.data.userinfo.pcgl_id}`,
			isAdmin: responseValidation.data.userinfo.data_admin,
			allowedWriteOrganizations: responseValidation.data.study_authorizations.editable_studies ?? [],
			allowedReadOrganizations: responseValidation.data.study_authorizations.readable_studies ?? [],
			groups: extractUserGroups({ groups: responseValidation.data.groups }),
		},
	};

	return userTokenInfo;
};

/**
 * Retrieves the user information from the PCGL AuthZ service using the given access token. Returns entire response.
 * @param accessToken Access token to use for retrieving user information
 * @returns User information
 */
export const getUserInformation = async (accessToken: string): Promise<PCGLAuthZUserInfoResponse> => {
	try {
		const response = await fetchAuthZResource('/user/me', accessToken);

		if (response.status === 204) {
			// A "204 No content" response is returned when the user is not registered.
			throw new Error('Unable to retrieve user information from the PCGL AuthZ service.');
		}

		const res = await response.json();

		const validatedAuthZData = authZUserInfo.safeParse(res);

		if (!validatedAuthZData.success) {
			logger.error(`[AUTHZ]: AuthZ service returned unexpected, or malformed data.` + validatedAuthZData.error);
			throw new Error('Unable to retrieve user information from the PCGL AuthZ service.');
		}

		return validatedAuthZData.data;
	} catch (error) {
		logger.error(`[AUTHZ]: Unexpected error while getting user info from the AuthZ service.` + error);
		throw new Error(`Error contacting the PCGL Authorization Service.`);
	}
};

/**
 * Asks AuthZ whether a service token was issued to the service with the given service ID,
 * using `GET /service/{service_id}/verify`.
 *
 * Returns:
 * - true when AuthZ confirms the token belongs to the service
 * - false when the token does not belong to the service, or AuthZ does not recognize the service ID
 *
 * @throws InternalServerError when:
 * - AuthZ cannot be reached
 * - AuthZ responds with a status other than 200 or 403
 * - AuthZ responds with a malformed body
 */
export const verifyServiceToken = async (serviceId: string, serviceToken: string): Promise<boolean> => {
	const { AUTHZ_ENDPOINT } = authConfig;
	const errorMessage = 'System Error: Something went wrong connecting to authorization service.';

	const url = urlJoin(AUTHZ_ENDPOINT, `/service/${encodeURIComponent(serviceId)}/verify`);

	let response: Response;
	try {
		response = await fetch(url, {
			method: 'GET',
			headers: {
				[ServiceAuthHeaders.SERVICE_TOKEN]: serviceToken,
			},
		});
	} catch (error) {
		logger.error(error, `[AUTHZ]: Something went wrong verifying service token.`);
		throw new lyricProvider.utils.errors.InternalServerError(errorMessage);
	}

	// AuthZ responds with 403 when it cannot find the service ID in its service store.
	if (response.status === 403) {
		const responseText = await response.text().catch(() => '');
		logger.warn(`[AUTHZ]: AuthZ could not verify a token for service "${serviceId}". ${responseText}`);
		return false;
	}

	if (response.status !== 200) {
		const responseText = await response.text().catch(() => '');
		logger.error(`[AUTHZ]: Service token verification failed with status ${response.status}. ${responseText}`);
		throw new lyricProvider.utils.errors.InternalServerError(errorMessage);
	}

	const responseBody: unknown = await response.json().catch(() => undefined);
	const verificationResponse = ServiceTokenVerificationResponse.safeParse(responseBody);
	if (!verificationResponse.success) {
		logger.error(`[AUTHZ]: Malformed service token verification response.`);
		throw new lyricProvider.utils.errors.InternalServerError(errorMessage);
	}

	return verificationResponse.data.result;
};

/**
 * Returns the names of the groups the user belongs to, or an empty array when AuthZ returned no groups.
 */
const extractUserGroups = ({ groups }: Groups): string[] => {
	return (groups ?? []).map((currentGroup) => currentGroup.name);
};

export const getStudyById = async (studyId: string, token: string) => {
	const { AUTHZ_ENDPOINT } = authConfig;

	const headers = new Headers({
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	});

	const url = urlJoin(AUTHZ_ENDPOINT, `/study/${studyId}`);
	const response = await fetch(url, {
		method: 'GET',
		headers,
	});

	if (response.status === 404) {
		return;
	}

	if (!response.ok) {
		throw new lyricProvider.utils.errors.InternalServerError(
			`Failed to fetch study in Authz with status ${response.status}`,
		);
	}

	return await response.json();
};

export const createStudy = async (studyId: string, token: string) => {
	const todaysDate = new Date().toISOString();

	const studyData = {
		study_id: studyId,
		data_submitters: [],
		team_members: [],
		creation_date: todaysDate,
	};

	const { AUTHZ_ENDPOINT } = authConfig;

	const headers = new Headers({
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	});

	const url = urlJoin(AUTHZ_ENDPOINT, '/study');
	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(studyData),
	});

	if (!response.ok) {
		throw new lyricProvider.utils.errors.InternalServerError(
			`Failed to create study in Authz with status ${response.status}`,
		);
	}
};
