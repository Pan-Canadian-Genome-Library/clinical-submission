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

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { type SubmittedDataResponse } from '@overture-stack/lyric';

import {
	excludeRestrictedEntityNames,
	findRestrictedFilterFields,
	getRestrictedFilterFieldNames,
	getSqonFieldNames,
	isRestrictedEntityName,
	isRestrictedFieldName,
	shouldRestrictStudyData,
	stripRestrictedData,
} from '../service/accessRestrictionService.js';

const submittedDataResponse = (partial: Pick<SubmittedDataResponse, 'entityName' | 'data'>): SubmittedDataResponse => ({
	isValid: true,
	organization: 'STUDY-1',
	systemId: 'system-id',
	...partial,
});

describe('shouldRestrictStudyData', () => {
	it('restricts a user with READ-only access (no WRITE)', () => {
		assert.equal(shouldRestrictStudyData(true, false), true);
	});

	it('does not restrict a user with WRITE access', () => {
		assert.equal(shouldRestrictStudyData(true, true), false);
	});

	it('does not restrict a user with neither READ nor WRITE access', () => {
		// In practice a caller with no READ access is rejected earlier by the ordinary access
		// check and never reaches this, but the function itself should not restrict on its own.
		assert.equal(shouldRestrictStudyData(false, false), false);
	});
});

describe('isRestrictedEntityName', () => {
	it('matches the restricted schema name case-insensitively', () => {
		assert.equal(isRestrictedEntityName('Sociodemographic'), true);
		assert.equal(isRestrictedEntityName('SOCIODEMOGRAPHIC'), true);
	});

	it('matches the pluralized form (compound-view nested keys are pluralized)', () => {
		assert.equal(isRestrictedEntityName('sociodemographics'), true);
	});

	it('does not match an unrelated entity', () => {
		assert.equal(isRestrictedEntityName('participant'), false);
	});
});

describe('isRestrictedFieldName', () => {
	it('matches the restricted field name case-insensitively', () => {
		assert.equal(isRestrictedFieldName('Submitter_Participant_ID'), true);
	});

	it('does not match an unrelated field', () => {
		assert.equal(isRestrictedFieldName('pcgl_participant_id'), false);
	});
});

describe('excludeRestrictedEntityNames', () => {
	const allEntityNames = ['participant', 'treatment', 'sociodemographic'];

	it('returns all non-restricted entities when nothing was explicitly requested', () => {
		assert.deepEqual(excludeRestrictedEntityNames(allEntityNames, []), ['participant', 'treatment']);
	});

	it('intersects an explicit request with the allowed set', () => {
		assert.deepEqual(excludeRestrictedEntityNames(allEntityNames, ['participant', 'sociodemographic']), [
			'participant',
		]);
	});

	it('returns an empty array when every requested entity is restricted', () => {
		// Regression guard: Lyric's own entityName filter treats an empty array as "no filter"
		// (drizzle's `or()` with zero arguments matches everything), so callers must check for
		// an empty result themselves and short-circuit before forwarding it as the entityName
		// filter, rather than assuming an empty filter means "no filter" here too.
		assert.deepEqual(excludeRestrictedEntityNames(allEntityNames, ['sociodemographic']), []);
	});

	it('returns an empty array when the dictionary has no non-restricted entities at all', () => {
		assert.deepEqual(excludeRestrictedEntityNames(['sociodemographic'], []), []);
	});
});

describe('stripRestrictedData', () => {
	it('removes a top-level record whose entityName is restricted', () => {
		const records = [
			submittedDataResponse({ entityName: 'participant', data: { pcgl_participant_id: 'PT001' } }),
			submittedDataResponse({
				entityName: 'sociodemographic',
				data: { income: 'redacted-should-not-appear' },
			}),
		];

		const result = stripRestrictedData(records);

		assert.equal(result.length, 1);
		assert.equal(result[0]?.entityName, 'participant');
	});

	it('removes a restricted entity re-embedded as a nested key (compound/nested view leak path)', () => {
		const records = [
			submittedDataResponse({
				entityName: 'participant',
				data: {
					pcgl_participant_id: 'PT001',
					sociodemographic: { income: 'redacted-should-not-appear' },
				},
			}),
		];

		const result = stripRestrictedData(records);

		assert.deepEqual(result[0]?.data, { pcgl_participant_id: 'PT001' });
	});

	it('removes a restricted entity nested inside an array of related records', () => {
		const records = [
			submittedDataResponse({
				entityName: 'participant',
				data: {
					treatments: [{ pcgl_treatment_id: 'TR001', sociodemographics: { income: 'redacted-should-not-appear' } }],
				},
			}),
		];

		const result = stripRestrictedData(records);

		assert.deepEqual(result[0]?.data, { treatments: [{ pcgl_treatment_id: 'TR001' }] });
	});

	it('removes the restricted field at the top level', () => {
		const records = [
			submittedDataResponse({
				entityName: 'participant',
				data: { submitter_participant_id: 'SUBMITTER-001', pcgl_participant_id: 'PT001' },
			}),
		];

		const result = stripRestrictedData(records);

		assert.deepEqual(result[0]?.data, { pcgl_participant_id: 'PT001' });
	});

	it('removes the restricted field nested at any depth', () => {
		const records = [
			submittedDataResponse({
				entityName: 'study',
				data: {
					participants: [{ submitter_participant_id: 'SUBMITTER-002', pcgl_participant_id: 'PT002' }],
				},
			}),
		];

		const result = stripRestrictedData(records);

		assert.deepEqual(result[0]?.data, { participants: [{ pcgl_participant_id: 'PT002' }] });
	});

	it('leaves unrelated entities and fields untouched', () => {
		const records = [
			submittedDataResponse({ entityName: 'participant', data: { pcgl_participant_id: 'PT001', age: 42 } }),
		];

		const result = stripRestrictedData(records);

		assert.deepEqual(result[0]?.data, { pcgl_participant_id: 'PT001', age: 42 });
	});
});

const schema = (name: string, ...fields: string[]) => ({ name, fields: fields.map((field) => ({ name: field })) });

const SCHEMAS = [
	schema('participant', 'submitter_participant_id', 'study_id', 'gender'),
	schema('sociodemographic', 'submitter_participant_id', 'study_id', 'income', 'Ethnicity'),
];

const filter = (fieldName: string) => ({ op: 'in', content: { fieldName, value: ['x'] } });

describe('getSqonFieldNames', () => {
	it('returns the field of a filter', () => {
		assert.deepEqual(getSqonFieldNames(filter('gender')), ['gender']);
		assert.deepEqual(getSqonFieldNames({ op: 'gt', content: { fieldName: 'age', value: 3 } }), ['age']);
	});

	it('returns the fields of combinations at any depth', () => {
		const sqon = {
			op: 'and',
			content: [filter('a'), { op: 'not', content: [{ op: 'or', content: [filter('b'), filter('c')] }] }],
		};

		assert.deepEqual(getSqonFieldNames(sqon), ['a', 'b', 'c']);
	});

	it('returns nothing for anything that is not a SQON', () => {
		for (const input of [
			undefined,
			null,
			'income',
			3,
			{},
			[],
			{ op: 'and', content: [] },
			{ content: { fieldName: 3 } },
		]) {
			assert.deepEqual(getSqonFieldNames(input), []);
		}
	});
});

describe('getRestrictedFilterFieldNames', () => {
	it('returns the restricted field and the fields only the restricted entity has', () => {
		assert.deepEqual(getRestrictedFilterFieldNames(SCHEMAS), ['submitter_participant_id', 'income', 'ethnicity']);
	});

	it('leaves out the fields the restricted entity shares with another one', () => {
		assert.ok(!getRestrictedFilterFieldNames(SCHEMAS).includes('study_id'));
	});

	it('treats the pluralized name of the restricted entity as the restricted entity', () => {
		assert.ok(getRestrictedFilterFieldNames([schema('sociodemographics', 'income')]).includes('income'));
	});

	it('still returns the restricted field when the dictionary has no restricted entity', () => {
		assert.deepEqual(getRestrictedFilterFieldNames([]), ['submitter_participant_id']);
		assert.deepEqual(getRestrictedFilterFieldNames([schema('participant', 'gender')]), ['submitter_participant_id']);
	});
});

describe('findRestrictedFilterFields', () => {
	it('finds restricted fields, in any letter case, as they are written in the SQON', () => {
		const sqon = { op: 'and', content: [filter('gender'), filter('INCOME'), filter('Submitter_Participant_ID')] };

		assert.deepEqual(findRestrictedFilterFields(sqon, SCHEMAS), ['INCOME', 'Submitter_Participant_ID']);
	});

	it('finds a restricted field once, however many times it is used', () => {
		const sqon = { op: 'or', content: [filter('income'), { op: 'not', content: [filter('income')] }] };

		assert.deepEqual(findRestrictedFilterFields(sqon, SCHEMAS), ['income']);
	});

	it('finds nothing in a SQON that only uses allowed fields', () => {
		const sqon = { op: 'and', content: [filter('gender'), filter('study_id')] };

		assert.deepEqual(findRestrictedFilterFields(sqon, SCHEMAS), []);
		assert.deepEqual(findRestrictedFilterFields(undefined, SCHEMAS), []);
	});
});
