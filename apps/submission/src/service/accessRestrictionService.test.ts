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
	ALL_ENTITIES_RESTRICTED,
	filterAllowedEntityNames,
	isRestrictedEntityName,
	isRestrictedFieldName,
	shouldRestrictStudyData,
	stripRestrictedEntities,
	stripRestrictedFields,
} from './accessRestrictionService.js';

const RESTRICTED_SCHEMA_NAMES = ['sociodemographic'];
const RESTRICTED_FIELD_NAMES = ['submitter_id'];

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

	it('does not restrict when the flag is disabled, even for a READ-only user', () => {
		assert.equal(shouldRestrictStudyData(false, false), false);
	});
});

describe('isRestrictedEntityName', () => {
	it('matches the configured name case-insensitively', () => {
		assert.equal(isRestrictedEntityName('Sociodemographic', RESTRICTED_SCHEMA_NAMES), true);
		assert.equal(isRestrictedEntityName('SOCIODEMOGRAPHIC', RESTRICTED_SCHEMA_NAMES), true);
	});

	it('matches the pluralized form (compound-view nested keys are pluralized)', () => {
		assert.equal(isRestrictedEntityName('sociodemographics', RESTRICTED_SCHEMA_NAMES), true);
	});

	it('does not match an unrelated entity', () => {
		assert.equal(isRestrictedEntityName('participant', RESTRICTED_SCHEMA_NAMES), false);
	});
});

describe('isRestrictedFieldName', () => {
	it('matches a configured field name case-insensitively', () => {
		assert.equal(isRestrictedFieldName('Submitter_ID', RESTRICTED_FIELD_NAMES), true);
	});

	it('does not match an unrelated field', () => {
		assert.equal(isRestrictedFieldName('pcgl_participant_id', RESTRICTED_FIELD_NAMES), false);
	});
});

describe('filterAllowedEntityNames', () => {
	const allEntityNames = ['participant', 'treatment', 'sociodemographic'];

	it('returns all non-restricted entities when nothing was explicitly requested', () => {
		assert.deepEqual(filterAllowedEntityNames(allEntityNames, [], RESTRICTED_SCHEMA_NAMES), [
			'participant',
			'treatment',
		]);
	});

	it('intersects an explicit request with the allowed set', () => {
		assert.deepEqual(
			filterAllowedEntityNames(allEntityNames, ['participant', 'sociodemographic'], RESTRICTED_SCHEMA_NAMES),
			['participant'],
		);
	});

	it('returns the ALL_ENTITIES_RESTRICTED sentinel, not an empty array, when every requested entity is restricted', () => {
		// Regression guard: Lyric's own entityName filter treats an empty array as "no filter"
		// (drizzle's `or()` with zero arguments matches everything), so forwarding [] here would
		// silently return unfiltered data instead of nothing. Callers must check for the sentinel.
		const result = filterAllowedEntityNames(allEntityNames, ['sociodemographic'], RESTRICTED_SCHEMA_NAMES);
		assert.equal(result, ALL_ENTITIES_RESTRICTED);
		assert.notDeepEqual(result, []);
	});

	it('returns the ALL_ENTITIES_RESTRICTED sentinel when the dictionary has no non-restricted entities at all', () => {
		assert.equal(filterAllowedEntityNames(['sociodemographic'], [], RESTRICTED_SCHEMA_NAMES), ALL_ENTITIES_RESTRICTED);
	});
});

describe('stripRestrictedEntities', () => {
	it('removes a top-level record whose entityName is restricted', () => {
		const records = [
			submittedDataResponse({ entityName: 'participant', data: { pcgl_participant_id: 'PT001' } }),
			submittedDataResponse({
				entityName: 'sociodemographic',
				data: { income: 'redacted-should-not-appear' },
			}),
		];

		const result = stripRestrictedEntities(records, RESTRICTED_SCHEMA_NAMES);

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

		const result = stripRestrictedEntities(records, RESTRICTED_SCHEMA_NAMES);

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

		const result = stripRestrictedEntities(records, RESTRICTED_SCHEMA_NAMES);

		assert.deepEqual(result[0]?.data, { treatments: [{ pcgl_treatment_id: 'TR001' }] });
	});
});

describe('stripRestrictedFields', () => {
	it('removes a top-level restricted field', () => {
		const result = stripRestrictedFields(
			{ submitter_id: 'SUBMITTER-001', pcgl_participant_id: 'PT001' },
			RESTRICTED_FIELD_NAMES,
		);

		assert.deepEqual(result, { pcgl_participant_id: 'PT001' });
	});

	it('removes a restricted field nested at any depth', () => {
		const result = stripRestrictedFields(
			{
				pcgl_participant_id: 'PT001',
				treatments: [{ submitter_id: 'SUBMITTER-002', pcgl_treatment_id: 'TR001' }],
			},
			RESTRICTED_FIELD_NAMES,
		);

		assert.deepEqual(result, {
			pcgl_participant_id: 'PT001',
			treatments: [{ pcgl_treatment_id: 'TR001' }],
		});
	});

	it('leaves unrelated fields untouched', () => {
		const result = stripRestrictedFields({ pcgl_participant_id: 'PT001', age: 42 }, RESTRICTED_FIELD_NAMES);
		assert.deepEqual(result, { pcgl_participant_id: 'PT001', age: 42 });
	});
});
