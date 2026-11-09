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
import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { lyricProvider } from '@/core/provider.js';
import { study } from '@/db/schemas/studiesSchema.js';
import { studyTranslations } from '@/db/schemas/studyTranslationsSchema.js';
import { validationRouter } from '@/routes/validationRouter.js';

import { connectTestDb, startTestServer, stubDbTables, type TestServer } from './helpers/testApp.js';

/**
 * The validator is public, the File Manager uses it to check that a record was submitted before it
 * accepts a file for it. It can't tell who is asking, so it never reports a record of the
 * restricted entity as found.
 */
describe('GET /validator/entity/:entityName/field/:fieldName/exists', () => {
	let server: TestServer;

	const existsRecord = mock.method(lyricProvider.services.validation, 'existsRecord', async () => true);

	connectTestDb();
	const studyLookup = stubDbTables([
		[study, () => [{ study_id: 'STUDY-A', category_id: 1 }]],
		[studyTranslations, () => []],
	]);

	before(async () => {
		server = await startTestServer((app) => app.use('/validator', validationRouter));
	});

	after(async () => {
		await server.close();
		mock.restoreAll();
	});

	beforeEach(() => {
		existsRecord.mock.resetCalls();
		studyLookup.mock.resetCalls();
	});

	it('checks records of the other entities', async () => {
		const { status } = await server.request(
			'GET',
			'/validator/entity/participant/field/submitter_participant_id/exists?study=STUDY-A&value=SUB-1',
		);

		assert.equal(status, 200);
		assert.equal(existsRecord.mock.callCount(), 1);
	});

	for (const entityName of ['sociodemographic', 'Sociodemographic', 'sociodemographics']) {
		it(`does not check records of the restricted entity (${entityName}), whatever the field`, async () => {
			for (const fieldName of ['income', 'submitter_participant_id']) {
				const { status } = await server.request(
					'GET',
					`/validator/entity/${entityName}/field/${fieldName}/exists?study=STUDY-A&value=anything`,
				);

				assert.equal(status, 404, fieldName);
			}

			assert.equal(existsRecord.mock.callCount(), 0);
			assert.equal(studyLookup.mock.callCount(), 0);
		});
	}

	it('answers for the restricted entity the same way as for a record that does not exist', async () => {
		existsRecord.mock.mockImplementationOnce(async () => false);

		const missing = await server.request(
			'GET',
			'/validator/entity/participant/field/submitter_participant_id/exists?study=STUDY-A&value=nobody',
		);
		const restricted = await server.request(
			'GET',
			'/validator/entity/sociodemographic/field/income/exists?study=STUDY-A&value=nobody',
		);

		assert.equal(restricted.status, missing.status);
		assert.deepEqual(restricted.body, missing.body);
	});
});
