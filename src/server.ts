import { errorHandler } from '@overture-stack/lyric';
import express, { Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';

import { lyricProvider } from '@/core/provider.js';
import { requestLogger } from '@/middleware/requestLogger.js';
import { healthCheckRouter } from '@/routes/healthCheck.js';
import { openAPIRouter } from '@/routes/openApi.js';

const logger = pino({ name: 'server start' });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

// Middlewares
app.use(helmet());

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
