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

import './setupEnv.js';

import type { Server } from 'node:http';
import { mock } from 'node:test';

import { errorHandler } from '@overture-stack/lyric';
import express, { type Express } from 'express';

import { logger } from '@/common/logger.js';
import { lyricProvider } from '@/core/provider.js';

export const AUTHZ_ENDPOINT = process.env.AUTHZ_ENDPOINT ?? '';

type TestUser = {
	token: string;
	isAdmin?: boolean;
	editableStudies?: string[];
	readableStudies?: string[];
};

/**
 * Users the fake AuthZ service knows about, keyed by the bearer token each one sends.
 */
export const TEST_USERS = {
	admin: { token: 'admin-token', isAdmin: true },
	writer: { token: 'writer-token', editableStudies: ['STUDY-A'], readableStudies: ['STUDY-A'] },
	reader: { token: 'reader-token', readableStudies: ['STUDY-A'] },
	// Can write to STUDY-A but only read STUDY-B
	writerAReaderB: {
		token: 'writer-a-reader-b-token',
		editableStudies: ['STUDY-A'],
		readableStudies: ['STUDY-A', 'STUDY-B'],
	},
	outsider: { token: 'outsider-token' },
} satisfies Record<string, TestUser>;

export type TestUserName = keyof typeof TEST_USERS;

export const isTestUserName = (name: string): name is TestUserName => name in TEST_USERS;

const authZUserResponse = (name: string, user: TestUser) => ({
	userinfo: {
		emails: [],
		pcgl_id: name,
		site_admin: false,
		data_admin: user.isAdmin ?? false,
	},
	study_authorizations: {
		editable_studies: user.editableStudies ?? [],
		readable_studies: user.readableStudies ?? [],
	},
	dac_authorizations: [],
	groups: [],
});

/**
 * Answers the AuthZ service's HTTP calls from `TEST_USERS`, and lets every other request, such as
 * the ones the tests send to the server under test, through untouched.
 */
export const stubAuthZ = () => {
	const originalFetch = globalThis.fetch;

	return mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
		const url = input instanceof Request ? input.url : String(input);

		if (!url.startsWith(AUTHZ_ENDPOINT)) {
			return originalFetch(input, init);
		}

		if (url.endsWith('/verify')) {
			return Response.json({ token: 'test-service-token' });
		}

		const bearer = new Headers(init?.headers).get('Authorization')?.replace('Bearer ', '');
		const match = Object.entries(TEST_USERS).find(([, user]) => user.token === bearer);

		return match ? Response.json(authZUserResponse(match[0], match[1])) : Response.json({}, { status: 401 });
	});
};

/**
 * Importing the Lyric provider starts a pool of worker threads that keeps the test process alive.
 * Shutting the pool down while it is still starting leaves a worker behind, because Lyric sends it
 * its configuration afterwards, so first wait for the pool to be ready. Any worker task does that,
 * this one fails fast as the submission does not exist and there is no database.
 *
 * That failure is logged by Lyric as an error. It is expected, so those two log sources are muted
 * while the pool stops.
 */
const stopLyricWorkers = async () => {
	const write = process.stdout.write.bind(process.stdout);
	const expectedLogs = /WORKER_POOL_MANAGER|ACTIVE_SUBMISSION_REPOSITORY/;
	const mutedWrite = mock.method(
		process.stdout,
		'write',
		(chunk: string | Uint8Array, encoding?: BufferEncoding, callback?: (error?: Error | null) => void) =>
			expectedLogs.test(String(chunk)) ? true : write(chunk, encoding, callback),
	);

	try {
		await lyricProvider.configs.workerPool.dataValidation({ submissionId: -1 });
		await lyricProvider.shutdown();
		// The workers' output reaches this process a moment after they are done
		await new Promise((resolve) => setTimeout(resolve, 50));
	} finally {
		mutedWrite.mock.restore();
	}
};

const parseBody = (text: string): unknown => {
	try {
		return text === '' ? undefined : JSON.parse(text);
	} catch {
		return text;
	}
};

export type TestServer = {
	baseUrl: string;
	close: () => Promise<void>;
	request: (
		method: string,
		path: string,
		options?: { as?: TestUserName; body?: unknown },
	) => Promise<{ status: number; body: unknown }>;
};

/**
 * Starts the routers on an ephemeral port, with the same error handler the real server uses.
 */
export const startTestServer = async (mountRoutes: (app: Express) => void): Promise<TestServer> => {
	// Denied requests are logged as errors by the auth middleware, keep that out of the test output
	mock.method(logger, 'error', () => undefined);

	const app = express();
	mountRoutes(app);
	app.use(errorHandler);

	const server = await new Promise<Server>((resolve) => {
		const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
	});

	const address = server.address();
	if (address === null || typeof address === 'string') {
		throw new Error('Test server did not start on a TCP port');
	}
	const baseUrl = `http://127.0.0.1:${address.port}`;

	return {
		baseUrl,
		close: async () => {
			await new Promise<void>((resolve) => {
				server.close(() => resolve());
				server.closeAllConnections();
			});
			await stopLyricWorkers();
		},
		request: async (method, path, options = {}) => {
			const headers: Record<string, string> = {};
			if (options.as) {
				headers.Authorization = `Bearer ${TEST_USERS[options.as].token}`;
			}
			if (options.body !== undefined) {
				headers['Content-Type'] = 'application/json';
			}

			const response = await fetch(`${baseUrl}${path}`, {
				method,
				headers,
				body: options.body === undefined ? undefined : JSON.stringify(options.body),
			});

			const text = await response.text();
			return { status: response.status, body: parseBody(text) };
		},
	};
};
