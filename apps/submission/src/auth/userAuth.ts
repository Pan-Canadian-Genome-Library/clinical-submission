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

import { Request } from 'express';

import { ActionIDs, type ActionIDsValues, type PCGLUserAuthorization } from '@/auth/types.js';
import { authConfig } from '@/config/authConfig.js';

/**
 * Checks if the user has allowed access to the given study based on their PCGL user session.
 * @param study Study user is trying to get access to
 * @param userStudies An array of user studies
 * @returns True or false depending if the user has access to the study
 */
export const hasAllowedAccess = (study: string, action: ActionIDsValues, user?: PCGLUserAuthorization): boolean => {
	const { enabled } = authConfig;

	// If auth is disabled or if the user is an admin, skip all auth steps
	if (!enabled || user?.isAdmin) {
		return true;
	}

	if (user === undefined) {
		return false;
	}

	switch (action) {
		case ActionIDs.READ:
			return user.allowedReadOrganizations.some((currentStudy) => currentStudy === study);
		case ActionIDs.WRITE:
			return user.allowedWriteOrganizations.some((currentStudy) => currentStudy === study);
		default:
			return user.allowedWriteOrganizations.some((currentStudy) => currentStudy === study);
	}
};

/**
 *	Function that takes in request object, checks if theres an authorization header and returns its token
 *  Only works with Bearer type authorization values
 *
 * @param req Request object
 * @returns Access token or undefined depending if authorization header exists or authorization type is NOT Bearer
 */
export const extractAccessTokenFromHeader = (req: Request): string | undefined => {
	const authHeader = req.headers['authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return;
	}

	return authHeader.replace('Bearer ', '').trim();
};
