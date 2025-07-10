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
import { authConfig } from '@/config/authConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { extractAccessTokenFromHeader, fetchUserData } from '@/external/pcglAuthZClient.js';

/**
 * Middleware to handle authentication.
 *
 * Middleware that returns PCGLUserSessionResult to req.user. Does not check if belongs to study here since study endpoints can have their id's
 * passed to the backend using params or as fields in body. To check if a user has access to a study is done with hasAllowedAccess applied in the study endpoints
 */
export const authMiddleware = () => {
	const { enabled } = authConfig;
	return async (req: Request, _: Response, next: NextFunction) => {
		try {
			// If auth is disabled, then skip fetching user information
			if (!enabled) {
				return next();
			}
			const token = extractAccessTokenFromHeader(req);

			if (!token) {
				throw new lyricProvider.utils.errors.Forbidden('Unauthorized: No Access token provided');
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

export const lyricAdminMiddleware = async (req: Request) => {
	try {
		const token = extractAccessTokenFromHeader(req);

		if (!token) {
			return {
				errorCode: 401,
				errorMessage: 'Unauthorized: No token provided',
			};
		}

		const result = await fetchUserData(token);

		if (!result.user?.isAdmin) {
			return {
				errorCode: 403,
				errorMessage: 'Forbidden: Must be an admin to access this resource',
			};
		}

		return result;
	} catch (error) {
		logger.error(error);
		return {
			errorCode: 403,
			errorMessage: 'Forbidden: Invalid token',
		};
	}
};
