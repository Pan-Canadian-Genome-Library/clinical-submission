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
import urlJoin from 'url-join';

import { env } from '@/common/envConfig.js';
import { OIDCCodeResponse } from '@/common/validation/auth-validation.js';
import { authConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { exchangeCodeForTokens, getOidcAuthorizeUrl, getUserInfo } from '@/external/oidcAuthenticationClient.js';
import { validateRequest } from '@/middleware/requestValidation.js';

const login = async (request: Request, response: Response) => {
	if (!authConfig.enabled) {
		response.status(400).json({ error: 'AUTH_DISABLED', message: 'Authentication is disabled.' });
		return;
	}

	const onSuccessRedirect = `${env.API_HOST}/auth/token`;
	const redirectUrl = getOidcAuthorizeUrl(authConfig, onSuccessRedirect);
	response.redirect(redirectUrl);
};

const logout = async (request: Request, response: Response) => {
	if (!authConfig.enabled) {
		response.status(400).json({ error: 'AUTH_DISABLED', message: 'Authentication is disabled.' });
		return;
	}

	const logoutSuccessRedirectUrl = urlJoin(env.API_HOST, authConfig.logoutRedirectPath);
	const redirectUrl = getOidcAuthorizeUrl(authConfig, logoutSuccessRedirectUrl);
	response.redirect(redirectUrl);
};

const token = validateRequest(OIDCCodeResponse, async (request, response, next) => {
	if (!authConfig.enabled) {
		response.status(400).json({ error: 'AUTH_DISABLED', message: 'Authentication is disabled.' });
		return;
	}

	const { code } = request.query;

	if (typeof code !== 'string') {
		throw new Error('Invalid Request. Must contain query parameter `code` with a single string value.');
	}

	try {
		const tokenResponse = await exchangeCodeForTokens(authConfig, {
			code,
			redirectUrl: `${env.API_HOST}/auth/token`,
		});
		if (!tokenResponse) {
			throw new lyricProvider.utils.errors.InternalServerError('Unable to fetch tokens. Cannot complete login flow.');
		}

		const userDataResponse = await getUserInfo(authConfig, tokenResponse.access_token);
		if (!userDataResponse) {
			throw new lyricProvider.utils.errors.InternalServerError(
				'Unable to get user information. Cannot complete login flow.',
			);
		}

		response.json(userDataResponse);
	} catch (exception) {
		next(exception);
	}
});

export { login, logout, token };
