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

import axios from 'axios';
import urlJoin from 'url-join';

import { logger } from '@/common/logger.js';
import { oidcTokenResponseSchema, oidcUserInfoResponseSchema } from '@/common/validation/auth-validation.js';
import { type AuthConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';

/**
 * OIDC Authorization Flow Step 1
 * This is a redirection to the OIDC provider /authorize endpoint
 */
export const getOidcAuthorizeUrl = (authConfig: AuthConfig, onSuccessRedirectUrl: string) => {
	const params = new URLSearchParams({
		client_id: authConfig.AUTH_CLIENT_ID,
		response_type: `code`,
		scope: `openid profile email org.cilogon.userinfo`,
		redirect_uri: onSuccessRedirectUrl,
	});
	return urlJoin(authConfig.AUTH_PROVIDER_HOST, `/authorize?${params.toString()}`);
};

/**
 * OIDC Authorization Flow Step 2
 * Exchange the authorization code for user tokens.
 */
export const exchangeCodeForTokens = async (
	authConfig: AuthConfig,
	{ code, redirectUrl }: { code: string; redirectUrl: string },
) => {
	const oauth2TokenUrl = urlJoin(authConfig.AUTH_PROVIDER_HOST, `/oauth2/token`);
	const params = {
		code,
		client_id: authConfig.AUTH_CLIENT_ID,
		client_secret: authConfig.AUTH_CLIENT_SECRET,
		grant_type: 'authorization_code',
		redirect_uri: redirectUrl,
	};

	try {
		const tokenResponse = await axios.get(oauth2TokenUrl, { params });
		const parsedTokenResponse = oidcTokenResponseSchema.safeParse(tokenResponse.data);

		if (!parsedTokenResponse.success) {
			logger.error(`OIDC Provider returned tokens with unexpected format`, parsedTokenResponse.error.message);
			throw new lyricProvider.utils.errors.InternalServerError(`Token response has unexpected format.`);
		}
		return parsedTokenResponse.data;
	} catch (error: unknown) {
		/**
		 * Check if we got back a valid error response. We use this because for certain errors we can recover.
		 */
		if (axios.isAxiosError(error) && error.status === 400 && error.response) {
			const parsedTokenResponse = oidcTokenResponseSchema.safeParse(error.response.data);
			if (parsedTokenResponse.success) {
				return parsedTokenResponse.data;
			}
		}

		logger.error(`Unexpected error exchanging auth code for tokens.`, error);
		throw new lyricProvider.utils.errors.InternalServerError(`Unable to retrieve user tokens from OIDC provider.`);
	}
};

export const getUserInfo = async (authConfig: AuthConfig, accessToken: string) => {
	try {
		const userResponse = await axios.get(urlJoin(authConfig.AUTH_PROVIDER_HOST, `/oauth2/userinfo`), {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		const parsedUserinfoResponse = oidcUserInfoResponseSchema.safeParse(userResponse.data);
		if (!parsedUserinfoResponse.success) {
			logger.debug(`Userinfo response has unexpected format.`, parsedUserinfoResponse.error);
			throw new lyricProvider.utils.errors.InternalServerError(`Unable to retrieve user info from OIDC Provider.`);
		}
		return parsedUserinfoResponse.data;
	} catch (error) {
		// This could be an error for invalid access token, but there is no different error handling
		// we'll just log the result and return a system error
		logger.error(`Unexpected error occurred fetching OIDC User Info.`, error);
		throw new lyricProvider.utils.errors.InternalServerError(`Unable to retrieve user info from OIDC Provider.`);
	}
};
