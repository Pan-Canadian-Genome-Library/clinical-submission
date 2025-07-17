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

import urlJoin from 'url-join';
import { z } from 'zod';

import { env } from '@/config/envConfig.js';

import EnvironmentConfigError from './EnvironmentConfigError.js';

const enabled = env.AUTH_ENABLED === true;

// Enforce enabling auth when running in production
if (env.NODE_ENV === 'production' && !enabled) {
	throw new EnvironmentConfigError(
		`The application "NODE_ENV" is set to "production" while "AUTH_ENABLED" is not "true". Auth must be enabled to run in production.`,
	);
}

const authConfigSchema = z.object({
	AUTHZ_ENDPOINT: z.string().url(),
	AUTH_PROVIDER_HOST: z.string().url(),
	AUTH_CLIENT_ID: z.string(),
	AUTH_CLIENT_SECRET: z.string(),
	AUTH_ACTION_WRITE_ENDPOINT: z.string(),
	AUTH_ACTION_WRITE_METHOD: z.string(),
	AUTH_ACTION_READ_ENDPOINT: z.string(),
	AUTH_ACTION_READ_METHOD: z.string(),
	AUTH_GROUP_ADMIN: z.string(),
});

const parseResult = authConfigSchema.safeParse(process.env);

if (!parseResult.success) {
	throw new EnvironmentConfigError(`auth`, parseResult.error);
}

export const authConfig = {
	...parseResult.data,
	actions: {
		write: {
			method: parseResult.data.AUTH_ACTION_READ_METHOD,
			endpoint: parseResult.data.AUTH_ACTION_WRITE_ENDPOINT,
		},
		read: {
			method: parseResult.data.AUTH_ACTION_READ_METHOD,
			endpoint: parseResult.data.AUTH_ACTION_WRITE_ENDPOINT,
		},
	},
	groups: {
		admin: parseResult.data.AUTH_GROUP_ADMIN,
	},
	enabled,
	loginRedirectPath: urlJoin(env.API_HOST, '/auth/token'),
	logoutRedirectPath: urlJoin(env.API_HOST, '/api-docs/'),
};

export type AuthConfig = typeof authConfig;
