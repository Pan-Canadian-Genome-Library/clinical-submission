import { errorHandler } from '@overture-stack/lyric';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pino } from 'pino';

import { env } from '@/common/envConfig.js';
import { lyricProvider } from '@/core/provider.js';
import { requestLogger } from '@/middleware/requestLogger.js';
import { healthCheckRouter } from '@/routes/healthCheck.js';
import { openAPIRouter } from '@/routes/openApi.js';

const logger = pino({ name: 'server start' });
const app = express();

// Middlewares
app.use(helmet());
app.use(
	cors({
		origin: function (origin, callback) {
			// allow requests with no origin
			// (like mobile apps or curl requests)
			if (!origin) {
				return callback(null, true);
			} else if (env.ALLOWED_ORIGINS && env.ALLOWED_ORIGINS.split(',').indexOf(origin) !== -1) {
				return callback(null, true);
			}
			const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
			return callback(new Error(msg), false);
		},
	}),
);

// Request logging
app.use(requestLogger);

// Routes
app.use('/health', healthCheckRouter);

// Lyric routes
app.use('/dictionary', lyricProvider.routers.dictionary);
app.use('/submission', lyricProvider.routers.submission);
app.use('/data', lyricProvider.routers.submittedData);

// Swagger route
app.use('/api-docs', openAPIRouter);

// Error handler
app.use(errorHandler);

export { app, logger };
