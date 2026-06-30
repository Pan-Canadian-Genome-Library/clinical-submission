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

import { SessionUser } from '@pcgl-submission/validation';
import urlJoin from 'url-join';

import { logger } from '@/common/logger.js';
import { authConfig } from '@/config/authConfig.js';
import { env } from '@/config/envConfig.js';
import { lyricProvider } from '@/core/provider.js';
import {
	exchangeCodeForTokens,
	getOidcAuthorizeUrl,
	getUserInfo,
	revokeToken,
} from '@/external/oidcAuthenticationClient.js';
import { getUserInformation } from '@/external/pcglAuthZClient.js';
import { validateRequest } from '@/middleware/requestValidation.js';
import { resetSession } from '@/session/index.js';

const getOauthRedirectUri = (host: string) => urlJoin(host, `/api/auth-session/token`);

/**
 * Initiate login process.
 *
 * This will redirect the user-agent to the OIDC Provider authorization URL.
 */
const loginSession = validateRequest({}, async (request, response, next) => {
	if (!authConfig.enabled) {
		response.status(400).json({ error: 'AUTH_DISABLED', message: 'Authentication is disabled.' });
		return;
	}
	try {
		request.session.save();

		const onSuccessRedirect = getOauthRedirectUri(env.UI_HOST);

		const redirectUrl = getOidcAuthorizeUrl(authConfig, onSuccessRedirect);

		response.redirect(redirectUrl);
	} catch (error) {
		logger.error(`Failed to initiate login session: ${error}`);

		next(error);
	}
});

/**
 * User logout.
 */
const logoutSession = validateRequest({}, async (request, response, next) => {
	if (!authConfig.enabled) {
		response.status(400).json({ error: 'AUTH_DISABLED', message: 'Authentication is disabled.' });
		return;
	}

	const logoutSuccessRedirectUrl = urlJoin(env.UI_HOST, authConfig.authSessionConfigs.logoutRedirectPath);

	const { account } = request.session;
	if (!account) {
		logger.warn(`User with no valid session attempted to logout.`);

		response.redirect(logoutSuccessRedirectUrl);
		return;
	}
	try {
		await revokeToken(authConfig, account.accessToken);
		// On logout success we can clear the session data.
		resetSession(request.session);
		response.redirect(logoutSuccessRedirectUrl);
		return;
	} catch (error) {
		next(error);
	}
});

/**
 * GET /token
 */
const authToken = validateRequest({}, async (request, response) => {
	if (!authConfig.enabled) {
		response.status(400).json({ error: 'AUTH_DISABLED', message: 'Authentication is disabled.' });
		return;
	}

	try {
		const { code } = request.query;

		if (typeof code !== 'string') {
			throw new Error('Invalid Request. Must contain query parameter `code` with a single string value.');
		}
		const tokenResponse = await exchangeCodeForTokens(authConfig, {
			code,
			redirectUrl: getOauthRedirectUri(env.UI_HOST),
		});

		if ('error' in tokenResponse) {
			throw new Error(tokenResponse.error);
		}

		const pcglAuthzResponse = await getUserInformation(tokenResponse.access_token);
		const oidcDataResponse = await getUserInfo(authConfig, tokenResponse.access_token);

		const userAccountAliasing = {
			idToken: tokenResponse.id_token,
			accessToken: tokenResponse.access_token,
			refreshToken: tokenResponse.refresh_token,
			refreshTokenIat: tokenResponse.refresh_token_iat,
		};

		const sessionUserAliasing: SessionUser = {
			userId: pcglAuthzResponse.userinfo.pcgl_id,
			sub: oidcDataResponse.sub,
			emails: pcglAuthzResponse.userinfo.emails,
			givenName: oidcDataResponse.given_name,
			familyName: oidcDataResponse.family_name,
			siteAdmin: pcglAuthzResponse.userinfo.site_admin,
			dataAdmin: pcglAuthzResponse.userinfo.data_admin,
			studyAuthorizations: {
				editableStudies: pcglAuthzResponse.study_authorizations.editable_studies,
				readableStudies: pcglAuthzResponse.study_authorizations.readable_studies,
			},
			dacAuthorizations: pcglAuthzResponse.dac_authorizations.map((dacAuth) => {
				if (!dacAuth) {
					return undefined;
				}
				return {
					studyId: dacAuth.study_id,
					startDate: dacAuth.start_date,
					endDate: dacAuth.end_date,
				};
			}),
			groups: pcglAuthzResponse.groups,
		};

		request.session.account = userAccountAliasing;
		request.session.user = sessionUserAliasing;
		request.session.save();
		response.redirect(urlJoin(env.UI_HOST, authConfig.authSessionConfigs.loginRedirectPath));
		return;
	} catch (error) {
		logger.error(`Error thrown while going through authentication and authorization flow: ` + error);

		const redirectURL = urlJoin(env.UI_HOST, authConfig.authSessionConfigs.loginErrorPath);
		const errorCode = error instanceof lyricProvider.utils.errors.ServiceUnavailable ? error.name : 'SYSTEM_ERROR';

		const errorParams = new URLSearchParams({
			code: errorCode,
		});

		response.redirect(`${redirectURL}/?${errorParams.toString()}`);
		return;
	}
});

// /**
//  * Retrieve user information stored in session. This can be used by the UI to determine
//  * if a user is logged in and what type of user they are (which role they have). This will
//  * let the UI determine which routes to allow to the user.
//  */
const getUser = validateRequest({}, async (request, response) => {
	if (!authConfig.enabled) {
		response.status(400).json({ error: 'AUTH_DISABLED', message: 'Authentication is disabled.' });
		return;
	}

	const userSession = request.session?.user;

	const output = {
		user: userSession
			? {
					userId: userSession.userId,
					givenName: userSession.givenName,
					familyName: userSession.familyName,
					emails: userSession.emails,
					dacAuthorizations: userSession.dacAuthorizations,
				}
			: undefined,
	};

	response.json(output);
	return;
});

export default { loginSession, getUser, authToken, logoutSession };
