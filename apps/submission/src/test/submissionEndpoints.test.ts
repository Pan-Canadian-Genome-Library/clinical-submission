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

import './helpers/setupEnv.js';

import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { lyricProvider } from '@/core/provider.js';
import { submissionRouter } from '@/routes/submission.js';

import { startTestServer, stubAuthZ, type TestServer } from './helpers/testApp.js';

const submissionIn = (id: number, organization: string, createdBy: string) => ({
	id,
	organization,
	createdBy,
	status: 'OPEN',
	data: { inserts: { participant: { batchName: 'participant.tsv', creator: createdBy, recordsCount: 1 } } },
	dictionaryCategory: { id: 1 },
});

const SUBMISSIONS = [
	submissionIn(1, 'STUDY-A', 'writer'),
	submissionIn(2, 'STUDY-B', 'writerAReaderB'),
	// Created by someone who has since been left with READ access only
	submissionIn(3, 'STUDY-A', 'reader'),
];

/**
 * Every submission endpoint works with in-progress data that has not been filtered the way
 * committed data is, so each of them needs WRITE access to the submission's study.
 */
describe('submission endpoints', () => {
	let server: TestServer;
	let services: ReturnType<typeof stubSubmissionServices>;

	const stubSubmissionServices = () => ({
		getDetails: mock.method(lyricProvider.services.category, 'getDetails', async () => ({ id: 1 })),
		getSubmissionById: mock.method(lyricProvider.services.submission, 'getSubmissionById', async (id: number) =>
			SUBMISSIONS.find((submission) => submission.id === id),
		),
		getSubmissionDetailsById: mock.method(lyricProvider.services.submission, 'getSubmissionDetailsById', async () => ({
			pagination: { currentPage: 1, pageSize: 20, totalPages: 1, totalRecords: 1 },
			records: [{ entityName: 'participant', data: { name: 'details-should-be-write-only' } }],
		})),
		getSubmissionsByCategory: mock.method(lyricProvider.services.submission, 'getSubmissionsByCategory', async () => ({
			metadata: { totalRecords: 1 },
			result: [SUBMISSIONS[0]],
		})),
		deleteActiveSubmissionById: mock.method(
			lyricProvider.services.submission,
			'deleteActiveSubmissionById',
			async () => ({ status: 'CLOSED' }),
		),
		deleteActiveSubmissionEntity: mock.method(
			lyricProvider.services.submission,
			'deleteActiveSubmissionEntity',
			async () => ({ status: 'OPEN' }),
		),
		commitSubmission: mock.method(lyricProvider.services.submission, 'commitSubmission', async () => ({
			status: 'PROCESSING',
		})),
	});

	before(async () => {
		stubAuthZ();
		server = await startTestServer((app) => app.use('/submission', submissionRouter));
	});

	after(async () => {
		await server.close();
		mock.restoreAll();
	});

	beforeEach(() => {
		services = stubSubmissionServices();
	});

	afterEach(() => {
		for (const stub of Object.values(services)) {
			stub.mock.restore();
		}
	});

	describe('GET /submission/:submissionId', () => {
		it('denies users without WRITE access to the study', async () => {
			for (const as of [undefined, 'reader', 'outsider'] as const) {
				const { status } = await server.request('GET', '/submission/1', { as });
				assert.equal(status, 403, `as ${as}`);
			}
		});

		it('allows users with WRITE access to the study, admins included', async () => {
			for (const as of ['writer', 'admin'] as const) {
				const { status } = await server.request('GET', '/submission/1', { as });
				assert.equal(status, 200, `as ${as}`);
			}
		});

		it('checks access to the study of the submission, not just any study', async () => {
			// This user can write to STUDY-A, but only has READ access to STUDY-B
			assert.equal((await server.request('GET', '/submission/1', { as: 'writerAReaderB' })).status, 200);
			assert.equal((await server.request('GET', '/submission/2', { as: 'writerAReaderB' })).status, 403);
		});
	});

	describe('GET /submission/:submissionId/details', () => {
		it('denies users without WRITE access to the study, without reading the details', async () => {
			for (const as of [undefined, 'reader', 'outsider'] as const) {
				const { status } = await server.request('GET', '/submission/1/details', { as });
				assert.equal(status, 403, `as ${as}`);
			}
			assert.equal(services.getSubmissionDetailsById.mock.callCount(), 0);
		});

		it('allows users with WRITE access to the study, admins included', async () => {
			for (const as of ['writer', 'admin'] as const) {
				const { status } = await server.request('GET', '/submission/1/details', { as });
				assert.equal(status, 200, `as ${as}`);
			}
		});
	});

	describe('GET /submission/category/:categoryId', () => {
		it('denies users without WRITE access to the organization, without querying submissions', async () => {
			for (const as of [undefined, 'reader', 'outsider'] as const) {
				const { status } = await server.request('GET', '/submission/category/1?organization=STUDY-A', { as });
				assert.equal(status, 403, `as ${as}`);
			}
			assert.equal(services.getSubmissionsByCategory.mock.callCount(), 0);
		});

		it('answers the same whether or not the organization has submissions', async () => {
			services.getSubmissionsByCategory.mock.mockImplementation(async () => ({
				metadata: { totalRecords: 0 },
				result: [],
			}));

			const { status } = await server.request('GET', '/submission/category/1?organization=STUDY-A', { as: 'reader' });
			assert.equal(status, 403);
		});

		it('denies a page that includes an organization the user can not write to', async () => {
			services.getSubmissionsByCategory.mock.mockImplementation(async () => ({
				metadata: { totalRecords: 2 },
				result: [SUBMISSIONS[0], SUBMISSIONS[1]],
			}));

			const { status } = await server.request('GET', '/submission/category/1', { as: 'writer' });
			assert.equal(status, 403);
		});

		it('allows users with WRITE access to the organization, admins included', async () => {
			for (const as of ['writer', 'admin'] as const) {
				const withOrganization = await server.request('GET', '/submission/category/1?organization=STUDY-A', { as });
				assert.equal(withOrganization.status, 200, `as ${as}`);

				const withoutOrganization = await server.request('GET', '/submission/category/1', { as });
				assert.equal(withoutOrganization.status, 200, `as ${as}`);
			}
		});
	});

	describe('DELETE /submission/:submissionId', () => {
		it('denies a user who lost WRITE access, even to a submission they created', async () => {
			const { status } = await server.request('DELETE', '/submission/3', { as: 'reader' });
			assert.equal(status, 403);
			assert.equal(services.deleteActiveSubmissionById.mock.callCount(), 0);
		});

		it('denies users without WRITE access to the study', async () => {
			for (const as of [undefined, 'outsider'] as const) {
				const { status } = await server.request('DELETE', '/submission/1', { as });
				assert.equal(status, 403, `as ${as}`);
			}
			assert.equal(services.deleteActiveSubmissionById.mock.callCount(), 0);
		});

		it('still only lets the creator, or an admin, delete', async () => {
			assert.equal((await server.request('DELETE', '/submission/1', { as: 'writer' })).status, 200);
			assert.equal((await server.request('DELETE', '/submission/1', { as: 'admin' })).status, 200);
			assert.equal((await server.request('DELETE', '/submission/3', { as: 'writer' })).status, 403);
		});
	});

	describe('DELETE /submission/:submissionId/:actionType', () => {
		const path = '/submission/3/inserts?entityName=participant';

		it('denies a user who lost WRITE access, even to a submission they created', async () => {
			const { status } = await server.request('DELETE', path, { as: 'reader' });
			assert.equal(status, 403);
			assert.equal(services.deleteActiveSubmissionEntity.mock.callCount(), 0);
		});

		it('allows an admin', async () => {
			const { status } = await server.request('DELETE', path, { as: 'admin' });
			assert.equal(status, 200);
		});
	});

	describe('POST /submission/category/:categoryId/commit/:submissionId', () => {
		it('denies users without WRITE access to the study', async () => {
			for (const as of [undefined, 'reader', 'outsider'] as const) {
				const { status } = await server.request('POST', '/submission/category/1/commit/1', { as });
				assert.equal(status, 403, `as ${as}`);
			}
			assert.equal(services.commitSubmission.mock.callCount(), 0);
		});
	});
});
