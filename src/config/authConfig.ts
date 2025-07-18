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

function getAuthConfig() {
	const enabled = env.AUTH_ENABLED === true;
	// Enforce enabling auth when running in production
	if (env.NODE_ENV === 'production' && !enabled) {
		throw new EnvironmentConfigError(
			`The application "NODE_ENV" is set to "production" while "AUTH_ENABLED" is not "true". Auth must be enabled to run in production.`,
		);
	}

	if (!enabled) {
		// Running with auth disabled may be useful for developers.
		return { enabled };
	}

	const authConfigSchema = z.object({
		AUTH_PROVIDER_HOST: z.string().url(),
		AUTH_CLIENT_ID: z.string(),
		AUTH_CLIENT_SECRET: z.string(),
	});

	const parseResult = authConfigSchema.safeParse(process.env);

	if (!parseResult.success) {
		throw new EnvironmentConfigError(`auth`, parseResult.error);
	}

	return {
		...parseResult.data,
		enabled,
		loginRedirectPath: urlJoin(env.API_HOST, '/auth/token'),
		logoutRedirectPath: urlJoin(env.API_HOST, '/api-docs/'),
	};
}

export const authConfig = getAuthConfig();
export type AuthConfig = typeof authConfig & { enabled: true };
