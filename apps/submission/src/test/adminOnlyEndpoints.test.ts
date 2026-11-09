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
import { after, before, describe, it, mock } from 'node:test';

import { auditRouter } from '@/routes/audit.js';
import { migrationRouter } from '@/routes/migration.js';

import { isTestUserName, startTestServer, stubAuthZ, TEST_USERS, type TestServer } from './helpers/testApp.js';

const nonAdmins = Object.keys(TEST_USERS)
	.filter(isTestUserName)
	.filter((name) => name !== 'admin');

/**
 * Lyric's audit and migration records include the data of updated and deleted records, restricted
 * entities included, so both are admin-only.
 */
describe('audit and migration endpoints', () => {
	let server: TestServer;

	before(async () => {
		stubAuthZ();
		server = await startTestServer((app) => {
			app.use('/audit', auditRouter);
			app.use('/migration', migrationRouter);
		});
	});

	after(async () => {
		await server.close();
		mock.restoreAll();
	});

	const endpoints = [
		{ name: 'audit by category and organization', path: '/audit/category/1/organization/STUDY-A' },
		{ name: 'migration by id', path: '/migration/1' },
		{ name: 'migrations by category', path: '/migration/category/1' },
		{ name: 'migration records', path: '/migration/1/records' },
	];

	for (const endpoint of endpoints) {
		describe(endpoint.name, () => {
			it('denies a request without a token', async () => {
				const { status } = await server.request('GET', endpoint.path);
				assert.equal(status, 403);
			});

			for (const user of nonAdmins) {
				it(`denies ${user}`, async () => {
					const { status } = await server.request('GET', endpoint.path, { as: user });
					assert.equal(status, 403);
				});
			}
		});
	}

	// Invalid input is rejected by Lyric's own request validation before it reads anything, which is
	// enough to tell that the request got past the admin check without needing a database.
	it('lets an admin through to the Lyric endpoints', async () => {
		const migration = await server.request('GET', '/migration/not-a-number', { as: 'admin' });
		assert.equal(migration.status, 400);

		const audit = await server.request('GET', '/audit/category/1/organization/STUDY-A?eventType=not-an-event', {
			as: 'admin',
		});
		assert.equal(audit.status, 400);
	});
});
