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

import { errorHandler } from '@overture-stack/lyric';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import nunjucks from 'nunjucks';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { env } from '@/config/envConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { requestLogger } from '@/middleware/requestLogger.js';
import { healthCheckRouter } from '@/routes/healthCheck.js';
import { openAPIRouter } from '@/routes/openApi.js';
import { submissionRouter } from '@/routes/submission.js';

import { authRouter } from './routes/auth.js';
import { dacRouter } from './routes/dac.js';
import { studyRouter } from './routes/study.js';
import { dictionaryRouter } from './routes/dictionary.js';
import { adminCategoryRouter, categoryRouter } from './routes/categoryRouter.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares
app.use(helmet());
app.use(
	cors({
		origin: function (origin, callback) {
			// allow requests in development mode
			if (env.NODE_ENV === 'development') {
				return callback(null, true);
			} else if (!origin) {
				// allow requests with no origin
				return callback(null, true);
			} else if (env.ALLOWED_ORIGINS && env.ALLOWED_ORIGINS.split(',').indexOf(origin) !== -1) {
				// Allow if origin is in the whitelist
				return callback(null, true);
			}
			const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
			return callback(new Error(msg), false);
		},
	}),
);

/**
 * Nunjucks is the templating middleware we use for our temporary
 * login page. We're setting the cache to be disabled since we
 * want a re-render every hit since tokens could change.
 *
 * @see https://mozilla.github.io/nunjucks/api.html#express
 */
nunjucks.configure(path.join(__dirname, 'views'), {
	noCache: true,
	express: app,
});
app.use('/static', express.static(path.join(__dirname, 'views', 'static')));

// Request logging
app.use(requestLogger);

//PCGL Specific Routes
app.use('/dac', dacRouter);
app.use('/health', healthCheckRouter);
app.use('/study', studyRouter);
app.use('/auth', authRouter);

// Lyric routes
app.use('/audit', lyricProvider.routers.audit);
app.use('/category', categoryRouter);
app.use('/data', lyricProvider.routers.submittedData);
app.use('/dictionary', dictionaryRouter);
app.use('/submission', submissionRouter);
app.use('/validator', lyricProvider.routers.validator);
app.use('/admin/category', adminCategoryRouter);

// Swagger route
app.use('/api-docs', openAPIRouter);

// Error handler
app.use(errorHandler);

export { app };
