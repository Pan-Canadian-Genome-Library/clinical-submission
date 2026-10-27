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
import { generatedIdentifiers, idGenerationConfig } from '@/db/schemas/idGenerationConfig.js';
import { study } from '@/db/schemas/studiesSchema.js';
import { dataRouter } from '@/routes/data.js';

import { connectTestDb, startTestServer, stubAuthZ, stubDbTables, type TestServer } from './helpers/testApp.js';

const STUDIES = [
	{ study_id: 'STUDY-A', category_id: 1 },
	{ study_id: 'STUDY-B', category_id: 2 },
];

const DICTIONARY_ENTITIES = ['participant', 'treatment', 'sociodemographic'];

// Values that only appear in restricted data
const RESTRICTED_VALUES = ['sociodemographic', 'SD-INCOME', 'SD-ETHNICITY', 'submitter_participant_id', 'SUB-'];

const recordsFor = (organization: string) => {
	const participant = {
		systemId: `${organization}-participant`,
		entityName: 'participant',
		organization,
		isValid: true,
		data: { submitter_participant_id: `SUB-${organization}`, study_id: organization, gender: 'Female' },
	};
	const treatment = {
		systemId: `${organization}-treatment`,
		entityName: 'treatment',
		organization,
		isValid: true,
		data: { submitter_treatment_id: 'TREAT-1', submitter_participant_id: `SUB-${organization}`, drug: 'DRUG-X' },
	};
	const sociodemographic = {
		systemId: `${organization}-sociodemographic`,
		entityName: 'sociodemographic',
		organization,
		isValid: true,
		data: { submitter_participant_id: `SUB-${organization}`, income: 'SD-INCOME', ethnicity: 'SD-ETHNICITY' },
	};
	return { participant, treatment, sociodemographic };
};

const ALL_RECORDS = ['STUDY-A', 'STUDY-B'].flatMap((organization) => Object.values(recordsFor(organization)));

type TestRecord = (typeof ALL_RECORDS)[number];

/**
 * What Lyric's compound view does: it pulls in the related entities of a record with queries of its
 * own, so the restricted entity comes back nested whatever entities the request asked for.
 */
const withCompoundView = (record: TestRecord, view?: string) => {
	if (view !== 'compound' || record.entityName !== 'participant') {
		return record;
	}

	const { treatment, sociodemographic } = recordsFor(record.organization);
	return {
		...record,
		data: { ...record.data, treatments: [treatment.data], sociodemographics: [sociodemographic.data] },
	};
};

/** Like Lyric, an empty list of entity names means all entities */
const selectRecords = (organization: string | undefined, entityNames: string[] | undefined, view?: string) =>
	ALL_RECORDS.filter(
		(record) =>
			(organization === undefined || record.organization === organization) &&
			(!entityNames?.length || entityNames.includes(record.entityName)),
	).map((record) => structuredClone(withCompoundView(record, view)));

const assertNoRestrictedData = (body: unknown) => {
	const text = JSON.stringify(body);
	for (const value of RESTRICTED_VALUES) {
		assert.ok(!text.includes(value), `response contains "${value}": ${text}`);
	}
};

const assertContains = (body: unknown, ...values: string[]) => {
	const text = JSON.stringify(body);
	for (const value of values) {
		assert.ok(text.includes(value), `response is missing "${value}": ${text}`);
	}
};

type EntityFilter = { entityName?: string[]; view?: string; organizations?: string[] };

describe('data endpoints', () => {
	let server: TestServer;
	let categoryId = 0;

	const lyric = {
		getDetails: mock.method(lyricProvider.services.category, 'getDetails', async (idOrAlias: string) => {
			categoryId = Number(idOrAlias);
			return { id: categoryId };
		}),
		getActiveDictionaryByCategory: mock.method(
			lyricProvider.services.dictionary,
			'getActiveDictionaryByCategory',
			async () => ({ dictionary: DICTIONARY_ENTITIES.map((name) => ({ name })) }),
		),
		getSubmittedDataByCategory: mock.method(
			lyricProvider.services.submittedData,
			'getSubmittedDataByCategory',
			async (_categoryId: number, _pagination: unknown, filter: EntityFilter) => {
				const result = selectRecords(filter.organizations?.[0], filter.entityName, filter.view);
				return { result, metadata: { totalRecords: result.length } };
			},
		),
		getSubmittedDataByOrganization: mock.method(
			lyricProvider.services.submittedData,
			'getSubmittedDataByOrganization',
			async (_categoryId: number, organization: string, _pagination: unknown, filter: EntityFilter) => {
				const result = selectRecords(organization, filter.entityName, filter.view);
				return { result, metadata: { totalRecords: result.length } };
			},
		),
		getSubmittedDataBySystemId: mock.method(
			lyricProvider.services.submittedData,
			'getSubmittedDataBySystemId',
			async (_categoryId: number, systemId: string, filter: EntityFilter) => {
				const record = ALL_RECORDS.find((candidate) => candidate.systemId === systemId);
				return {
					result: record && structuredClone(withCompoundView(record, filter.view)),
					metadata: { errorMessage: 'Record not found' },
				};
			},
		),
	};

	/** The entity names the controller passed to Lyric, one list per call */
	const entityNamesSentByCategory = () =>
		lyric.getSubmittedDataByCategory.mock.calls.map((call) => call.arguments[2].entityName);
	const entityNamesSentByOrganization = () =>
		lyric.getSubmittedDataByOrganization.mock.calls.map((call) => call.arguments[3].entityName);

	before(async () => {
		connectTestDb();
		stubAuthZ();
		stubDbTables([
			// The study of the category that was last looked up
			[study, () => STUDIES.filter((candidate) => candidate.category_id === categoryId)],
			[
				idGenerationConfig,
				() => [{ entityName: 'participant', fieldName: 'submitter_participant_id', internalId: 'pcgl_participant_id' }],
			],
			[generatedIdentifiers, () => [{ generatedId: 'PT00000001', internalId: 'pcgl_participant_id' }]],
		]);
		server = await startTestServer((app) => app.use('/data', dataRouter));
	});

	after(async () => {
		await server.close();
		mock.restoreAll();
	});

	beforeEach(() => {
		for (const stub of Object.values(lyric)) {
			stub.mock.resetCalls();
		}
	});

	describe('a user with READ access only', () => {
		describe('GET /data/category/:categoryId', () => {
			it('does not return restricted data, but keeps the rest and the PCGL system ID', async () => {
				const { status, body } = await server.request('GET', '/data/category/1', { as: 'reader' });

				assert.equal(status, 200);
				assertNoRestrictedData(body);
				assertContains(body, 'PT00000001', 'Female', 'DRUG-X');
			});

			it('does not read the restricted entity from the database', async () => {
				await server.request('GET', '/data/category/1', { as: 'reader' });

				assert.deepEqual(entityNamesSentByCategory(), [['participant', 'treatment']]);
			});

			it('keeps the entities that were asked for, minus the restricted one', async () => {
				const { body } = await server.request(
					'GET',
					'/data/category/1?entityName=participant&entityName=sociodemographic',
					{ as: 'reader' },
				);

				assert.deepEqual(entityNamesSentByCategory(), [['participant']]);
				assertNoRestrictedData(body);
				assertContains(body, 'Female');
			});

			it('returns nothing, without querying, when only the restricted entity is asked for', async () => {
				const { status, body } = await server.request('GET', '/data/category/1?entityName=sociodemographic', {
					as: 'reader',
				});

				assert.equal(status, 200);
				assert.deepEqual(body, {
					pagination: { currentPage: 1, pageSize: 20, totalPages: 0, totalRecords: 0 },
					records: [],
				});
				// Passing an empty list of entity names to Lyric would return every entity
				assert.equal(lyric.getSubmittedDataByCategory.mock.callCount(), 0);
			});

			it('does not return the restricted entity when it comes nested in the compound view', async () => {
				const { status, body } = await server.request('GET', '/data/category/1?view=compound', { as: 'reader' });

				assert.equal(status, 200);
				assertNoRestrictedData(body);
				assertContains(body, 'Female', 'DRUG-X');
			});
		});

		describe('GET /data/category/:categoryId/organization/:organization', () => {
			it('does not return restricted data', async () => {
				for (const view of ['flat', 'compound']) {
					const { status, body } = await server.request('GET', `/data/category/1/organization/STUDY-A?view=${view}`, {
						as: 'reader',
					});

					assert.equal(status, 200, view);
					assertNoRestrictedData(body);
					assertContains(body, 'PT00000001', 'Female', 'DRUG-X');
				}
			});

			it('does not read the restricted entity from the database', async () => {
				await server.request('GET', '/data/category/1/organization/STUDY-A', { as: 'reader' });

				assert.deepEqual(entityNamesSentByOrganization(), [['participant', 'treatment']]);
			});

			it('returns nothing, without querying, when only the restricted entity is asked for', async () => {
				const { body } = await server.request(
					'GET',
					'/data/category/1/organization/STUDY-A?entityName=sociodemographic',
					{
						as: 'reader',
					},
				);

				assert.deepEqual(body, {
					pagination: { currentPage: 1, pageSize: 20, totalPages: 0, totalRecords: 0 },
					records: [],
				});
				assert.equal(lyric.getSubmittedDataByOrganization.mock.callCount(), 0);
			});
		});

		describe('POST /data/category/:categoryId/organization/:organization/query', () => {
			const sqon = { op: 'in', content: { fieldName: 'gender', value: ['Female'] } };

			it('does not return restricted data', async () => {
				for (const view of ['flat', 'compound']) {
					const { status, body } = await server.request(
						'POST',
						`/data/category/1/organization/STUDY-A/query?view=${view}`,
						{ as: 'reader', body: sqon },
					);

					assert.equal(status, 200, view);
					assertNoRestrictedData(body);
					assertContains(body, 'PT00000001', 'Female', 'DRUG-X');
				}
			});

			it('does not read the restricted entity from the database', async () => {
				await server.request('POST', '/data/category/1/organization/STUDY-A/query', { as: 'reader', body: sqon });

				assert.deepEqual(entityNamesSentByOrganization(), [['participant', 'treatment']]);
			});

			it('returns nothing, without querying, when only the restricted entity is asked for', async () => {
				const { body } = await server.request(
					'POST',
					'/data/category/1/organization/STUDY-A/query?entityName=sociodemographic',
					{ as: 'reader', body: sqon },
				);

				assert.deepEqual(body, {
					pagination: { currentPage: 1, pageSize: 20, totalPages: 0, totalRecords: 0 },
					records: [],
				});
				assert.equal(lyric.getSubmittedDataByOrganization.mock.callCount(), 0);
			});
		});

		describe('GET /data/category/:categoryId/id/:systemId', () => {
			it('does not return a record of the restricted entity, and answers as if it did not exist', async () => {
				const restricted = await server.request('GET', '/data/category/1/id/STUDY-A-sociodemographic', {
					as: 'reader',
				});
				const missing = await server.request('GET', '/data/category/1/id/STUDY-A-missing', { as: 'reader' });

				assert.equal(restricted.status, 404);
				assert.equal(restricted.status, missing.status);
				assert.deepEqual(restricted.body, missing.body);
			});

			it('does not return restricted fields or nested entities of the other entities', async () => {
				for (const view of ['flat', 'compound']) {
					const { status, body } = await server.request('GET', `/data/category/1/id/STUDY-A-participant?view=${view}`, {
						as: 'reader',
					});

					assert.equal(status, 200, view);
					assertNoRestrictedData(body);
					assertContains(body, 'PT00000001', 'Female');
				}
			});
		});
	});

	describe('users that are not restricted', () => {
		for (const as of ['writer', 'admin'] as const) {
			it(`returns everything to ${as}`, async () => {
				const byCategory = await server.request('GET', '/data/category/1?view=compound', { as });
				assert.equal(byCategory.status, 200);
				assertContains(
					byCategory.body,
					'sociodemographic',
					'SD-INCOME',
					'submitter_participant_id',
					'PT00000001',
					'DRUG-X',
				);
				assert.deepEqual(entityNamesSentByCategory(), [[]]);

				const byOrganization = await server.request('GET', '/data/category/1/organization/STUDY-A', { as });
				assertContains(byOrganization.body, 'sociodemographic', 'SD-INCOME', 'submitter_participant_id');

				const sociodemographic = await server.request('GET', '/data/category/1/id/STUDY-A-sociodemographic', { as });
				assert.equal(sociodemographic.status, 200);
				assertContains(sociodemographic.body, 'SD-INCOME', 'SD-ETHNICITY');
			});
		}
	});

	describe('restrictions are per study', () => {
		it('restricts a user with WRITE access to one study only in the study they can just read', async () => {
			const writable = await server.request('GET', '/data/category/1/organization/STUDY-A', { as: 'writerAReaderB' });
			assertContains(writable.body, 'SD-INCOME', 'submitter_participant_id');

			const readOnly = await server.request('GET', '/data/category/2/organization/STUDY-B', { as: 'writerAReaderB' });
			assertNoRestrictedData(readOnly.body);
			assertContains(readOnly.body, 'Female');
		});
	});

	describe('users without READ access', () => {
		it('are denied, without querying', async () => {
			for (const as of [undefined, 'outsider'] as const) {
				const { status } = await server.request('GET', '/data/category/1', { as });
				assert.equal(status, 403, `as ${as}`);
			}
			assert.equal(lyric.getSubmittedDataByCategory.mock.callCount(), 0);
		});
	});
});
