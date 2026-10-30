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
 * Schema/entity name that is always excluded from a READ-only user's view of submitted data.
 * Static and not configurable: this restriction is a fixed part of the access model, not an
 * optional feature.
 */
export const RESTRICTED_ENTITY_NAME = 'sociodemographic';

/**
 * Field name that is always removed, wherever it appears across any entity, from a READ-only
 * user's view of submitted data.
 */
export const RESTRICTED_FIELD_NAME = 'submitter_participant_id';

/**
 * Whether responses for a study should be filtered/restricted for the current caller: true
 * only when they have READ access but not WRITE access to that specific study. A caller with
 * neither is rejected earlier by the ordinary access check and never reaches this; a caller
 * with WRITE access (which includes admins and the auth-disabled case, since those bypass the
 * underlying access check entirely) is never restricted.
 */
export const shouldRestrictStudyData = (hasReadAccess: boolean, hasWriteAccess: boolean): boolean =>
	hasReadAccess && !hasWriteAccess;

const restrictedEntityNameVariants = new Set(
	[RESTRICTED_ENTITY_NAME, pluralizeSchemaName(RESTRICTED_ENTITY_NAME)].map((name) => name.toLowerCase()),
);

/**
 * True if `entityName` is the restricted schema, case-insensitively, checking both singular
 * and pluralized forms since Lyric's compound view keys nested entities by their pluralized
 * name when `PLURALIZE_SCHEMAS_ENABLED` is set.
 */
export const isRestrictedEntityName = (entityName: string): boolean =>
	restrictedEntityNameVariants.has(entityName.trim().toLowerCase());

/**
 * True if `fieldName` is the restricted field, case-insensitively.
 */
export const isRestrictedFieldName = (fieldName: string): boolean =>
	fieldName.trim().toLowerCase() === RESTRICTED_FIELD_NAME;

/**
 * Removes the {@link RESTRICTED_ENTITY_NAME} schema (`sociodemographic`) from a list of entity names.
 * Names are matched case-insensitively, in both their singular and pluralized forms.
 *
 * @param allEntityNames The names of every schema in a Data Dictionary. They are used when `requested` is empty.
 * @param requested The entity names to filter. An empty array selects every name in `allEntityNames`.
 * @returns The names from `requested`, or from `allEntityNames` when `requested` is empty, without the
 * restricted entity. Names in `requested` are not checked against `allEntityNames`. The array is empty when
 * every selected name is restricted.
 */
export const excludeRestrictedEntityNames = (allEntityNames: string[], requested: string[]): string[] => {
	const base = requested.length > 0 ? requested : allEntityNames;
	return base.filter((name) => !isRestrictedEntityName(name));
};

/**
 * Recursively removes any key matching the restricted entity name or the restricted field
 * name from `dataRecord`, at any depth. This is the authoritative filter: Lyric's
 * `view=compound` re-embeds parent/child schemas by walking the dictionary hierarchy in
 * separate queries, independent of whatever `entityName` filter was applied to the root
 * query, so a query-level filter alone cannot be relied on to catch every case.
 */
const stripRestrictedKeys = (dataRecord: DataRecordNested): DataRecordNested => {
	const result: DataRecordNested = {};

	for (const [key, value] of Object.entries(dataRecord)) {
		if (isRestrictedEntityName(key) || isRestrictedFieldName(key)) {
			continue;
		}

		if (isDataRecordValue(value)) {
			result[key] = value;
			continue;
		}

		if (Array.isArray(value)) {
			result[key] = value.map((item) => stripRestrictedKeys(item));
			continue;
		}

		result[key] = stripRestrictedKeys(value);
	}

	return result;
};

/**
 * Removes records whose top-level `entityName` is restricted, and any restricted entity/field
 * data nested inside the remaining records (see {@link stripRestrictedKeys}). Run this after
 * `SanitizeLyricIdsWithInternal`: that step needs to read the original value of a restricted
 * field (e.g. `submitter_participant_id`) to look up its generated PCGL system ID before this
 * removes the field.
 */
export const stripRestrictedData = (records: SubmittedDataResponse[]): SubmittedDataResponse[] =>
	records
		.filter((record) => !isRestrictedEntityName(record.entityName))
		.map((record) => ({ ...record, data: stripRestrictedKeys(record.data) }));

/**
 * The part of a dictionary schema that matters here, so that this module does not depend on the
 * dictionary types.
 */
export type SchemaFields = { name: string; fields: ReadonlyArray<{ name: string }> };

/**
 * Names of the fields a SQON filters on, at any depth of its `and`, `or` and `not`
 * combinations. A filter is an object with a `fieldName`, a combination has a list as `content`.
 */
export const getSqonFieldNames = (sqon: unknown): string[] => {
	if (typeof sqon !== 'object' || sqon === null) {
		return [];
	}

	const content = 'content' in sqon ? sqon.content : undefined;

	if (Array.isArray(content)) {
		return content.flatMap(getSqonFieldNames);
	}

	if (typeof content === 'object' && content !== null && 'fieldName' in content) {
		return typeof content.fieldName === 'string' ? [content.fieldName] : [];
	}

	return [];
};

/**
 * Collects the names of the fields that identify the restricted data: the restricted field, and the
 * fields that exist in the restricted entity but in no other schema. Fields the restricted entity
 * shares with another schema are not included.
 *
 * @param schemas The schemas of a Data Dictionary.
 * @returns An array of the restricted field name and the field names only found in
 * the restricted entity. Field names are in lowercase.
 */
export const getRestrictedFilterFieldNames = (schemas: ReadonlyArray<SchemaFields>): string[] => {
	const fieldNamesOf = (matching: ReadonlyArray<SchemaFields>) =>
		new Set(matching.flatMap((schema) => schema.fields.map((field) => field.name.toLowerCase())));

	const restrictedEntityFields = fieldNamesOf(schemas.filter((schema) => isRestrictedEntityName(schema.name)));
	const otherFields = fieldNamesOf(schemas.filter((schema) => !isRestrictedEntityName(schema.name)));

	return [RESTRICTED_FIELD_NAME.toLowerCase(), ...[...restrictedEntityFields].filter((name) => !otherFields.has(name))];
};

/**
 * Finds the field names in the SQON filter that cannot be used as filters by users with only READ access.
 * This selects any field named {@link RESTRICTED_FIELD_NAME} (`submitter_participant_id`), and any field of the
 * {@link RESTRICTED_ENTITY_NAME} schema (`sociodemographic`) that no other schema in `schemas` contains.
 * Field names are matched case-insensitively and returned as they are spelled in the SQON, without duplicates.
 *
 * @param sqon The SQON from the request body. A value that is not a SQON object has no field names.
 * @param schemas The schemas of the category's Data Dictionary.
 * @returns The restricted field names found in the SQON, or an empty array when it uses none.
 */
export const findRestrictedFilterFields = (sqon: unknown, schemas: ReadonlyArray<SchemaFields>): string[] => {
	const restricted = new Set(getRestrictedFilterFieldNames(schemas));

	return [...new Set(getSqonFieldNames(sqon))].filter((fieldName) => restricted.has(fieldName.trim().toLowerCase()));
};
