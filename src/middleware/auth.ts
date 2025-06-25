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

import { UserData, UserGroups } from '@/common/types/auth.js';
import { lyricProvider } from '@/core/provider.js';
import { fetchUserData } from '@/external/authorizationClient.js';

/**
 * Middleware to handle authentication
 * @returns
 */
export const authMiddleware = () => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Parse token from request
			const authHeader = req.headers['authorization'];
			const token = authHeader && authHeader.split(' ')[1];

			if (!token) {
				throw new lyricProvider.utils.errors.Forbidden('Unauthorized request, no token was found');
			}

			// Grab the users data
			// TODO: VALIDATE THE RESPONSE OBJECT
			const resultMe: UserData = await fetchUserData(token);

			// Check permissions, if admin let them pass
			const hasAdmin = resultMe.groups.some((value) => value.name === UserGroups.ADMIN);
			if (hasAdmin) {
				next();
			}

			return next();
		} catch (error) {
			next(error);
			return;
		}
	};
};
