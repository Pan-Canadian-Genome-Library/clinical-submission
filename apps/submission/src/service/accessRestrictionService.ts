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

import {
	type DataRecordNested,
	isDataRecordValue,
	pluralizeSchemaName,
	type SubmittedDataResponse,
} from '@overture-stack/lyric';

/**
 * Sentinel returned by {@link filterAllowedEntityNames} when every entity the caller asked
 * for is restricted. Callers must treat this as "return nothing" and short-circuit before
 * calling into Lyric: passing an empty array through as an `entityName` filter is NOT
 * equivalent to "match nothing" in Lyric's own query layer (`or()` with no arguments builds
 * no filter at all, which would return everything, unfiltered).
 */
export const ALL_ENTITIES_RESTRICTED = 'ALL_ENTITIES_RESTRICTED' as const;

/**
 * Whether responses for a study should be filtered/restricted: true when the feature is
 * enabled and the caller does not have WRITE access to the study. Callers pass in
 * `hasAllowedAccess(study, 'WRITE', user)` for `hasWriteAccess`; that check already returns
 * `true` unconditionally when auth is disabled or the user is an admin, so this composes
 * correctly for those cases without any special-casing here.
 */
export const shouldRestrictStudyData = (restrictionEnabled: boolean, hasWriteAccess: boolean): boolean =>
	restrictionEnabled && !hasWriteAccess;

const restrictedSchemaNameVariants = (restrictedSchemaNames: string[]): Set<string> => {
	const names = new Set<string>();
	for (const rawName of restrictedSchemaNames) {
		const name = rawName.trim().toLowerCase();
		names.add(name);
		names.add(pluralizeSchemaName(name).toLowerCase());
	}
	return names;
};

/**
 * True if `entityName` matches a configured restricted schema (`RESTRICTED_SCHEMA_NAMES`),
 * case-insensitively, checking both singular and pluralized forms since Lyric's compound
 * view keys nested entities by their pluralized name when `PLURALIZE_SCHEMAS_ENABLED` is set.
 */
export const isRestrictedEntityName = (entityName: string, restrictedSchemaNames: string[]): boolean =>
	restrictedSchemaNameVariants(restrictedSchemaNames).has(entityName.trim().toLowerCase());

/**
 * True if `fieldName` matches a configured restricted field (`RESTRICTED_FIELD_NAMES`),
 * case-insensitively.
 */
export const isRestrictedFieldName = (fieldName: string, restrictedFieldNames: string[]): boolean =>
	restrictedFieldNames.some((name) => name.trim().toLowerCase() === fieldName.trim().toLowerCase());

/**
 * Given the full list of entity names in a category's dictionary and the entity names the
 * caller explicitly requested (empty means "all"), returns the concrete `entityName` filter
 * to send to Lyric with restricted entities removed, or {@link ALL_ENTITIES_RESTRICTED} when
 * the result would otherwise be an empty array.
 */
export const filterAllowedEntityNames = (
	allEntityNames: string[],
	requested: string[],
	restrictedSchemaNames: string[],
): string[] | typeof ALL_ENTITIES_RESTRICTED => {
	const base = requested.length > 0 ? requested : allEntityNames;
	const allowed = base.filter((name) => !isRestrictedEntityName(name, restrictedSchemaNames));

	return allowed.length === 0 ? ALL_ENTITIES_RESTRICTED : allowed;
};

/**
 * Recursively removes any key matching a restricted schema name from `dataRecord`, at any
 * depth. This is the authoritative filter for sociodemographic-style exclusion: Lyric's
 * `view=compound` re-embeds parent/child schemas by walking the dictionary hierarchy in
 * separate queries, independent of whatever `entityName` filter was applied to the root
 * query, so a query-level filter alone cannot be relied on to catch every case.
 */
const stripRestrictedKeys = (dataRecord: DataRecordNested, restrictedSchemaNames: string[]): DataRecordNested => {
	const result: DataRecordNested = {};

	for (const [key, value] of Object.entries(dataRecord)) {
		if (isRestrictedEntityName(key, restrictedSchemaNames)) {
			continue;
		}

		if (isDataRecordValue(value)) {
			result[key] = value;
			continue;
		}

		if (Array.isArray(value)) {
			result[key] = value.map((item) => stripRestrictedKeys(item, restrictedSchemaNames));
			continue;
		}

		result[key] = stripRestrictedKeys(value, restrictedSchemaNames);
	}

	return result;
};

/**
 * Removes restricted-entity records and any restricted-entity data nested inside the
 * remaining records (see {@link stripRestrictedKeys}).
 */
export const stripRestrictedEntities = (
	records: SubmittedDataResponse[],
	restrictedSchemaNames: string[],
): SubmittedDataResponse[] =>
	records
		.filter((record) => !isRestrictedEntityName(record.entityName, restrictedSchemaNames))
		.map((record) => ({ ...record, data: stripRestrictedKeys(record.data, restrictedSchemaNames) }));

/**
 * Recursively removes any key matching a restricted field name (`RESTRICTED_FIELD_NAMES`,
 * e.g. a submitter-supplied identifier) from `dataRecord`, at any depth. Independent of
 * `ID_MANAGER_CONFIG`: that config drives which fields get a PCGL system ID added alongside
 * them (unconditional, unrelated to this restriction), not which fields count as a
 * "Submitter ID" for removal purposes.
 */
export const stripRestrictedFields = (
	dataRecord: DataRecordNested,
	restrictedFieldNames: string[],
): DataRecordNested => {
	const result: DataRecordNested = {};

	for (const [key, value] of Object.entries(dataRecord)) {
		if (isRestrictedFieldName(key, restrictedFieldNames)) {
			continue;
		}

		if (isDataRecordValue(value)) {
			result[key] = value;
			continue;
		}

		if (Array.isArray(value)) {
			result[key] = value.map((item) => stripRestrictedFields(item, restrictedFieldNames));
			continue;
		}

		result[key] = stripRestrictedFields(value, restrictedFieldNames);
	}

	return result;
};

/**
 * Applies {@link stripRestrictedFields} to every record's `data`.
 */
export const stripRestrictedFieldsFromRecords = (
	records: SubmittedDataResponse[],
	restrictedFieldNames: string[],
): SubmittedDataResponse[] =>
	records.map((record) => ({ ...record, data: stripRestrictedFields(record.data, restrictedFieldNames) }));
