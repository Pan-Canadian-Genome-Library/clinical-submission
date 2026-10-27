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
	filterAllowedEntityNames,
	isRestrictedEntityName,
	isRestrictedFieldName,
	shouldRestrictStudyData,
	stripRestrictedData,
} from './accessRestrictionService.js';

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

describe('filterAllowedEntityNames', () => {
	const allEntityNames = ['participant', 'treatment', 'sociodemographic'];

	it('returns all non-restricted entities when nothing was explicitly requested', () => {
		assert.deepEqual(filterAllowedEntityNames(allEntityNames, []), ['participant', 'treatment']);
	});

	it('intersects an explicit request with the allowed set', () => {
		assert.deepEqual(filterAllowedEntityNames(allEntityNames, ['participant', 'sociodemographic']), ['participant']);
	});

	it('returns an empty array when every requested entity is restricted', () => {
		// Regression guard: Lyric's own entityName filter treats an empty array as "no filter"
		// (drizzle's `or()` with zero arguments matches everything), so callers must check for
		// an empty result themselves and short-circuit before forwarding it as the entityName
		// filter, rather than assuming an empty filter means "no filter" here too.
		assert.deepEqual(filterAllowedEntityNames(allEntityNames, ['sociodemographic']), []);
	});

	it('returns an empty array when the dictionary has no non-restricted entities at all', () => {
		assert.deepEqual(filterAllowedEntityNames(['sociodemographic'], []), []);
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
