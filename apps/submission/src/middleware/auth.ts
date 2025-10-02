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

import { logger } from '@/common/logger.js';
import type { PCGLRequestWithUser, PCGLUserSessionResult } from '@/common/types/auth.js';
import { authConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { extractAccessTokenFromHeader, fetchUserData } from '@/external/pcglAuthZClient.js';

/**
 * Middleware to handle authentication that returns PCGLUserSessionResult to req.user.
 * Only validation is checking if token exists or not, then returned user object/information from authz is added to req.user.
 * To check if a user has permissions to any specific endpoints must be done on the controller level from the passed req.user object
 */
export const authMiddleware = () => {
	const { enabled } = authConfig;
	return async (req: PCGLRequestWithUser, _: Response, next: NextFunction) => {
		try {
			// If auth is disabled, then skip fetching user information
			if (!enabled) {
				return next();
			}
			const token = extractAccessTokenFromHeader(req);

			if (!token) {
				throw new lyricProvider.utils.errors.Forbidden('Unauthorized: No access token provided');
			}

			const result = await fetchUserData(token);

			req.user = result.user;
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
export const lyricAuthMiddleware = async (req: Request): Promise<PCGLUserSessionResult> => {
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
