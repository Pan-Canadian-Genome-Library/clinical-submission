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

import { NextFunction, Request, Response } from 'express';

import {
	extractAccessTokenFromHeader,
	extractServiceCredentialsFromHeader,
	type PCGLRequestAuth,
	type PCGLRequestWithUser,
	type PCGLUserAuthorizationResult,
} from '@/auth/index.js';
import { logger } from '@/common/logger.js';
import { authConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { fetchUserData, verifyServiceToken } from '@/external/pcglAuthZClient.js';

declare module 'express-serve-static-core' {
	interface Request {
		/**
		 * Outcome of `authMiddleware` for this request. Undefined when `authMiddleware` did not run on the route,
		 * or auth is disabled.
		 */
		auth?: PCGLRequestAuth;
	}
}

/**
 * Middleware to handle authentication, storing the result in `req.auth` and the user in `req.user`.
 *
 * - Service requests: when `allowServices` is `true` and the request has the service ID and service token headers,
 *   the token is verified with AuthZ and the result is added to `req.auth.service`. Verified services skip the
 *   user checks, including `requireAdmin`. A service token that fails verification is rejected; the request is not
 *   checked as a user request.
 * - User requests: the access token is required, and the user information returned from AuthZ is added to
 *   `req.user` and `req.auth.user`. When `requireAdmin` is `true`, only admin users are allowed.
 *
 * Any additional checks for user or service permissions must be done on the controller level from `req.auth`
 * or `req.user`. When auth is disabled, the middleware does nothing.
 */
export const authMiddleware = ({
	requireAdmin = false,
	allowServices = false,
}: { requireAdmin?: boolean; allowServices?: boolean } = {}) => {
	const { enabled } = authConfig;
	return async (req: PCGLRequestWithUser, _: Response, next: NextFunction) => {
		try {
			// If auth is disabled, then skip fetching user information
			if (!enabled) {
				return next();
			}

			if (allowServices) {
				const serviceCredentials = extractServiceCredentialsFromHeader(req);
				if (serviceCredentials) {
					const { serviceId, serviceToken } = serviceCredentials;
					const verified = await verifyServiceToken(serviceId, serviceToken);
					req.auth = { service: { serviceId, verified } };

					if (!verified) {
						throw new lyricProvider.utils.errors.Forbidden(
							'Unauthorized: Service token is not valid for the requesting service',
						);
					}

					return next();
				}
			}

			const token = extractAccessTokenFromHeader(req);

			if (!token) {
				throw new lyricProvider.utils.errors.Forbidden('Unauthorized: No access token provided');
			}

			const result = await fetchUserData(token);
			req.user = result.user;
			req.auth = { user: result.user };

			if (requireAdmin && !result.user?.isAdmin) {
				throw new lyricProvider.utils.errors.Forbidden('You must be an admin user to use this endpoint.');
			}

			return next();
		} catch (error) {
			logger.error(error);
			next(error);
			return;
		}
	};
};

/**
 * Auth Middleware that checks specifically for lyric endpoints
 * Used for lyric endpoints, and is provided as a custom configuration in the appConfig of lyricProvider
 *
 * @param req request object
 * @returns
 */
export const lyricAuthMiddleware = async (req: Request): Promise<PCGLUserAuthorizationResult> => {
	const { enabled } = authConfig;

	try {
		// If auth is disabled, then skip fetching user information
		if (!enabled) {
			return {
				user: undefined,
			};
		}

		const token = extractAccessTokenFromHeader(req);

		if (!token) {
			return {
				errorCode: 401,
				errorMessage: 'Unauthorized: No token provided',
			};
		}

		const result = await fetchUserData(token);

		return result;
	} catch (error) {
		logger.error(error);
		return {
			errorCode: 403,
			errorMessage: 'Forbidden: Invalid token',
		};
	}
};
