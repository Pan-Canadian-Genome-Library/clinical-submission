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

import type { Request, Response } from 'express';
import { jwtDecode } from 'jwt-decode';

import type { CILogonToken } from '@/common/types/auth.js';
import { OIDCCodeResponse } from '@/common/validation/auth-validation.js';
import { authConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { exchangeCodeForTokens, getOidcAuthorizeUrl, refreshUserSession } from '@/external/oidcAuthenticationClient.js';
import { validateRequest } from '@/middleware/requestValidation.js';

const login = async (request: Request, response: Response) => {
	response.render('login.njk', {
		app_title: 'Clinical Submission',
		app_subheading: 'Login',
		redirect_url: getOidcAuthorizeUrl(authConfig, authConfig.loginRedirectPath),
		currentYear: new Date().getFullYear(),
	});
};

const logout = async (request: Request, response: Response) => {
	if (!authConfig.enabled) {
		response.status(400).json({ error: 'AUTH_DISABLED', message: 'Authentication is disabled.' });
		return;
	}

	const redirectUrl = getOidcAuthorizeUrl(authConfig, authConfig.logoutRedirectPath);
	response.redirect(redirectUrl);
};

const token = validateRequest(OIDCCodeResponse, async (request, response, next) => {
	if (!authConfig.enabled) {
		response.status(400).json({ error: 'AUTH_DISABLED', message: 'Authentication is disabled.' });
		return;
	}

	const { code } = request.query;

	try {
		const initialTokenResponse = await exchangeCodeForTokens(authConfig, {
			code,
			redirectUrl: authConfig.loginRedirectPath,
		});

		if (!initialTokenResponse) {
			throw new lyricProvider.utils.errors.InternalServerError('Unable to fetch tokens. Cannot complete login flow.');
		}

		/**
		 * Usually for invalid token errors, we can just restart the auth flow and correct the issue
		 * this helps when a user hits refresh on the auth helper tool page, we can just redirect them
		 * instead of showing a 500 error.
		 */
		if ('error' in initialTokenResponse) {
			switch (initialTokenResponse.error_description) {
				case 'invalid token':
					response.redirect(getOidcAuthorizeUrl(authConfig, authConfig.loginRedirectPath));
					break;
				default:
					throw new lyricProvider.utils.errors.InternalServerError(
						'Unable to retrieve user tokens from OIDC provider.',
					);
			}
			return;
		}

		// IMPORTANT: The refresh token we get from the initial token exchange will not return userInfo from CILogon, but the
		// refresh token returned from the refreshUserSession request will return user info. This is a CILogon behaviour that
		// is not explained or documented, but it allows the refreshToken returned from the refresh session request to be used
		// as a long lived access token by AuthZ. Thus, we immediately fetch `refreshUserSession` once, and return tokens from
		// that request.
		const refreshTokenResponse = await refreshUserSession(authConfig, {
			refreshToken: initialTokenResponse.refresh_token,
		});

		if ('error' in refreshTokenResponse) {
			throw new lyricProvider.utils.errors.InternalServerError('Unable to retrieve user tokens from OIDC provider.');
		}

		const tokenData: CILogonToken = jwtDecode(refreshTokenResponse.id_token);

		/**
		 * The JWT returns this time as _seconds_ from the Unix Epoch,
		 * whereas JS expects it as milliseconds, so we have to multiply by 1000
		 * to make it compatible for any arithmetic.
		 */
		const tokenTimeToLive = Date.now() + (refreshTokenResponse.refresh_token_iat || 0);
		const tokenIssueTime = tokenData.iat * 1000;

		response.render('token.njk', {
			app_title: 'Clinical Submission',
			app_subheading: 'Authentication Helper Tool',
			app_api_docs: '/api-docs/',
			sub: tokenData.sub,

			accessToken: refreshTokenResponse.refresh_token,
			expires: new Date(tokenTimeToLive).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'medium' }),
			valid_till: tokenTimeToLive,
			idp_name: tokenData.idp_name,
			iat: new Date(tokenIssueTime).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'medium' }),
			name: tokenData.name,
			given_name: tokenData.given_name ?? 'N/A',
			family_name: tokenData.family_name ?? 'N/A',
			email: tokenData.email ?? 'N/A',
			affiliation: tokenData.affiliation ?? 'N/A',
			currentYear: new Date().getFullYear(),
		});
	} catch (exception) {
		next(exception);
	}
});

export default { login, logout, token };
