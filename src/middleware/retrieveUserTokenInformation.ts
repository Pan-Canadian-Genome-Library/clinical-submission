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

import { UserSessionResult } from '@overture-stack/lyric';
import { Request } from 'express';

import { logger } from '@/common/logger.js';
import { Group } from '@/common/types/auth.js';
import { authConfig } from '@/config/authConfig.js';
import { fetchUserData } from '@/external/authorizationClient.js';

export const extractAccessTokenFromHeader = (req: Request): string | undefined => {
	const authHeader = req.headers['authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return;
	}

	return authHeader.split(' ')[1];
};

/**
 *
 * @param groups List of groups users belongs to
 * @returns boolean if user has admin group
 */
const isAdmin = (groups: Group[]): boolean => {
	const { AUTH_GROUP_ADMIN } = authConfig;

	return groups.some((val) => val.name === AUTH_GROUP_ADMIN);
};

/**
 * @param groups List of groups user belongs to
 * @returns array of groups (only the name)
 */
const extractUserGroups = (groups: Group[]): string[] => {
	const parsedGroups: string[] = groups.reduce((acu: string[], currentGroup) => {
		acu.push(currentGroup.name);
		return acu;
	}, []);

	return parsedGroups;
};

export const retrieveUserTokenInformation = async (req: Request): Promise<UserSessionResult> => {
	const token = extractAccessTokenFromHeader(req);

	if (!token) {
		return {
			errorCode: 401,
			errorMessage: 'Unauthorized: No Access token provided',
		};
	}

	try {
		// Determine the user information
		const result = await fetchUserData(token);

		return {
			user: {
				username: `${result.pcgl_id}`,
				isAdmin: isAdmin(result.groups),
				allowedWriteOrganizations: extractUserGroups(result.groups),
			},
		};
	} catch (err) {
		logger.error(`Error verifying token ${err}`);
		return {
			errorCode: 403,
			errorMessage: 'Forbidden: Invalid token',
		};
	}
};
