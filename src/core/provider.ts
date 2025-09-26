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

import { AppConfig, type AuthConfig, provider } from '@overture-stack/lyric';

import type { PCGLUserSessionResult } from '@/common/types/auth.js';
import { env } from '@/config/envConfig.js';
import { lyricAuthMiddleware } from '@/middleware/auth.js';
import { onFinishCommitCallback } from '@/middleware/idManager.js';

export const authConfig: AuthConfig<PCGLUserSessionResult> = {
	enabled: env.AUTH_ENABLED,
	protectedMethods: env.AUTH_PROTECT_METHODS,
	customAuthHandler: lyricAuthMiddleware,
};

const appConfig: AppConfig = {
	db: {
		host: env.DB_HOST,
		port: env.DB_PORT,
		database: env.DB_NAME,
		user: env.DB_USER,
		password: env.DB_PASSWORD,
	},
	onFinishCommit: onFinishCommitCallback,
	auth: authConfig,
	idService: {
		customAlphabet: env.ID_CUSTOM_ALPHABET,
		customSize: env.ID_CUSTOM_SIZE,
		useLocal: env.ID_USELOCAL,
	},
	features: {
		audit: {
			enabled: env.AUDIT_ENABLED,
		},
		recordHierarchy: {
			pluralizeSchemasName: env.PLURALIZE_SCHEMAS_ENABLED,
		},
	},
	logger: {
		level: env.LOG_LEVEL,
	},
	schemaService: {
		url: env.LECTERN_URL,
	},
	validator: env.VALIDATOR_CONFIG,
};

export const lyricProvider = provider(appConfig);
