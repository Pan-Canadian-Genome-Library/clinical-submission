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

import type { SubmittedDataResponse } from '@overture-stack/lyric';

import { env } from '@/config/envConfig.js';
import { generatedIdentifiers, idGenerationConfig } from '@/db/schemas/idGenerationConfig.js';
import type { GeneratedIdentifiersTable } from '@/db/types.js';
import { onFinishCommitCallback } from '@/internal/id-manager/commitHook.js';
import { generateEntityHash, generateHash, generateIdForRecord } from '@/internal/id-manager/utils.js';
import iimService from '@/service/idManagerService.js';

import { connectTestDb, stopLyricWorkers, stubDbTables } from './helpers/testApp.js';

const SECRET = 'test-secret';

describe('generateEntityHash', () => {
	const source = { entityName: 'participant', studyId: 'STUDY-A', value: 'SUB-1' };

	it('gives the same hash for the same entity, study and value', () => {
		assert.equal(generateEntityHash(source, SECRET), generateEntityHash({ ...source }, SECRET));
	});

	it('gives a different hash for another entity or another study', () => {
		const hash = generateEntityHash(source, SECRET);

		assert.notEqual(hash, generateEntityHash({ ...source, entityName: 'specimen' }, SECRET));
		assert.notEqual(hash, generateEntityHash({ ...source, studyId: 'STUDY-B' }, SECRET));
	});

	it('is not the hash of the value alone', () => {
		assert.notEqual(generateEntityHash(source, SECRET), generateHash('SUB-1', SECRET));
	});

	it('ignores the letter case and surrounding spaces of the entity name', () => {
		assert.equal(
			generateEntityHash({ ...source, entityName: ' Participant ' }, SECRET),
			generateEntityHash(source, SECRET),
		);
	});
});

describe('ID generation on commit', () => {
	const ID_CONFIGS = [
		{ id: 1, entityName: 'participant', fieldName: 'submitter_participant_id', prefix: 'PT', paddingLength: 8 },
		{ id: 2, entityName: 'specimen', fieldName: 'submitter_specimen_id', prefix: 'SP', paddingLength: 8 },
	];

	let createdRows: GeneratedIdentifiersTable[] = [];
	let nextSequenceValue = 1;

	const insertedRecord = (entityName: string, organization: string, data: Record<string, string>) =>
		({
			systemId: `${organization}-${entityName}-${data[`submitter_${entityName}_id`]}`,
			entityName,
			organization,
			isValid: true,
			data,
		}) satisfies SubmittedDataResponse;

	const commit = (inserts: SubmittedDataResponse[]): Promise<void> =>
		onFinishCommitCallback({
			categoryId: 1,
			organization: 'STUDY-A',
			submissionId: 1,
			data: { inserts, updates: [], deletes: [] },
		});

	const scopedHash = (entityName: string, studyId: string, value: string): string =>
		generateEntityHash({ entityName, studyId, value }, env.ID_MANAGER_SECRET);

	before(() => {
		const db = connectTestDb();
		stubDbTables([
			[idGenerationConfig, () => ID_CONFIGS],
			[generatedIdentifiers, (whereParams) => createdRows.filter((row) => whereParams.includes(row.sourceHash))],
		]);
		mock.method(db, 'execute', async () => ({ rows: [{ nextval: nextSequenceValue++ }] }));
		// An insert at a hash that is already stored inserts nothing, as with the unique source hash
		mock.method(db, 'insert', () => ({
			values: (row: GeneratedIdentifiersTable) => ({
				onConflictDoNothing: () => ({
					returning: async () => {
						if (createdRows.some((createdRow) => createdRow.sourceHash === row.sourceHash)) {
							return [];
						}
						createdRows.push(row);
						return [row];
					},
				}),
			}),
		}));
	});

	after(async () => {
		mock.restoreAll();
		await stopLyricWorkers();
	});

	beforeEach(() => {
		createdRows = [];
		nextSequenceValue = 1;
	});

	it('generates an ID for each entity that has the same submitter value', async () => {
		await commit([
			insertedRecord('participant', 'STUDY-A', { submitter_participant_id: 'SAME-1' }),
			insertedRecord('specimen', 'STUDY-A', { submitter_specimen_id: 'SAME-1' }),
		]);

		assert.deepEqual(
			createdRows.map((row) => ({ sourceHash: row.sourceHash, configId: row.configId })),
			[
				{ sourceHash: scopedHash('participant', 'STUDY-A', 'SAME-1'), configId: 1 },
				{ sourceHash: scopedHash('specimen', 'STUDY-A', 'SAME-1'), configId: 2 },
			],
		);
		assert.deepEqual(
			createdRows.map((row) => row.generatedId),
			['PT00000001', 'SP00000002'],
		);
	});

	it('generates an ID in each study that has the same submitter value', async () => {
		await commit([
			insertedRecord('participant', 'STUDY-A', { submitter_participant_id: 'SAME-1' }),
			insertedRecord('participant', 'STUDY-B', { submitter_participant_id: 'SAME-1' }),
		]);

		assert.deepEqual(
			createdRows.map((row) => row.sourceHash),
			[scopedHash('participant', 'STUDY-A', 'SAME-1'), scopedHash('participant', 'STUDY-B', 'SAME-1')],
		);
	});

	it('does not generate a second ID for the same entity, study and value', async () => {
		const record = insertedRecord('participant', 'STUDY-A', { submitter_participant_id: 'SAME-1' });

		await commit([record]);
		await commit([record]);

		assert.equal(createdRows.length, 1);
	});
});

describe('generateIdForRecord', () => {
	const ID_CONFIG = {
		id: 1,
		entityName: 'participant',
		fieldName: 'submitter_participant_id',
		prefix: 'PT',
		paddingLength: 8,
		internalId: 'pcgl_participant_id',
		sequenceName: 'participant_submitter_participant_id_seq',
		sequenceStart: 1,
		createdAt: null,
	};

	after(() => {
		mock.restoreAll();
	});

	it('returns the stored ID, without failing, when another process stores one after the existence check', async () => {
		const iimRepo = iimService(connectTestDb());
		const storedRow = { id: 7, sourceHash: 'hash', generatedId: 'PT00000007', configId: 1, createdAt: null };

		// The first read happens before the other process stores its ID, the second one after
		let hashReads = 0;
		mock.method(iimRepo, 'getIDByHash', async () => (hashReads++ === 0 ? [] : [{ ...storedRow, internalId: null }]));
		mock.method(iimRepo, 'getNextSequenceValue', async () => 8);
		mock.method(iimRepo, 'createIDRecord', async () => []);

		const result = await generateIdForRecord(iimRepo, { idConfig: ID_CONFIG, studyId: 'STUDY-A', value: 'SUB-1' });

		assert.deepEqual(result, { outcome: 'alreadyExists', generatedId: 'PT00000007' });
	});
});
