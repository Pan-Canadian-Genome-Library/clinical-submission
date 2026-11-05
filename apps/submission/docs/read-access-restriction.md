# Read Access Restriction

Ahead of DACO launch, researchers are granted **READ**-only access to a study, distinct from the **WRITE** access submitters have. A user with READ but not WRITE access to a study gets a restricted view of that study's submitted data: certain data is never retrievable or queryable by them, regardless of which endpoint or query shape they use.

This is a fixed part of the access model, not an optional feature: it applies automatically whenever a user has READ access to a study without also having WRITE access to that same study. There is no environment variable to disable it. A user with WRITE access (which includes admins, and any user when authentication is disabled) is never restricted.

## What is restricted

Two things, defined in [`src/service/accessRestrictionService.ts`](../src/service/accessRestrictionService.ts):

- **The `sociodemographic` entity** is excluded entirely. No record of this schema is retrievable, whether requested directly, through pagination, through a SQON query, or re-embedded as a nested block by Lyric's `view=compound`/`view=nested` (which pulls in related schemas by walking the dictionary hierarchy, independently of any entity filter applied to the main query).
- **The submitter ID fields** are removed from every entity's response, wherever they appear, at any nesting depth. These are every `fieldName` in the ID manager config (`ID_MANAGER_CONFIG`, stored in the `id_generation_config` table), such as `submitter_specimen_id` or `submitter_treatment_id`, plus `submitter_participant_id`, which is always restricted, even when the config does not list it (`getRestrictedFieldNames`). Field names are compared case-insensitively.

The same config adds a PCGL system ID (its `internalId` key, such as `pcgl_treatment_id`) next to each submitter ID, for every user. READ-only users get the PCGL system ID in place of the submitter ID; users with WRITE access get both.

## Where it applies

The restriction is enforced in the data-read endpoints (`src/controllers/dataController.ts`):

- `GET /data/category/:categoryId`
- `GET /data/category/:categoryId/id/:systemId`
- `GET /data/category/:categoryId/organization/:organization`
- `POST /data/category/:categoryId/organization/:organization/query`

`GET /data/category/:categoryId/stream` is unaffected: it is admin-only at the route level, and admins are never restricted.

## Filtering by restricted fields

The response of `POST /data/category/:categoryId/organization/:organization/query` leaves out the restricted data, but a filter on it would still reveal it: a user could narrow down a restricted value by what the query matches. So a user with READ access only to the study is rejected with a `400`, before anything is queried, if the filter, at any depth of its `and`, `or` and `not` combinations, uses:

- a submitter ID field: any `fieldName` in the ID manager config, or `submitter_participant_id`
- a field that only exists in the `sociodemographic` schema of the category's dictionary

Field names are compared case-insensitively. Fields that the `sociodemographic` schema shares with other schemas, such as the study ID, are allowed, unless they are submitter ID fields: the filter only matches the rows of the entities that are queried, and for these users that never includes `sociodemographic`. Users with WRITE access to the study can filter by any field.

## Endpoints that are closed to READ-only users

Other endpoints return restricted data in forms that can't be filtered as simply, so they are closed instead:

- **`/audit` and `/migration` are admin-only** (`src/routes/audit.ts`, `src/routes/migration.ts`). Audit records hold the previous and new data of every updated or deleted record, and migration records hold submitted data, restricted entity included. Lyric's own routers only authenticate the caller, they never check access to the study, so any signed-in user could read any study's history. They also skip authentication for methods that are missing from `AUTH_PROTECT_METHODS`, which commonly leaves out GET. The admin check is therefore done in front of them, with the same middleware as the other admin endpoints, which does not depend on that setting.
- **`/submission` endpoints require WRITE access to the study of the submission.** Active submissions hold the data as it was submitted, nothing in them is filtered. This covers reading a submission, its details and the list of submissions, and deleting a submission or one of its entities. The list is checked for every organization it contains, not only the first one.
- **`GET /validator/entity/:entityName/field/:fieldName/exists` never finds records of the restricted entity.** The endpoint is public, the File Manager calls it without a user, so it can't tell who is asking. For the restricted entity it answers `404`, the same as for a record that doesn't exist, and makes no query. Only the entity is filtered: the endpoint exists to check that submitter IDs were registered, so the restricted field can still be checked.

## How it's enforced

Two layers, not one:

1. **Query-level exclusion.** Before querying Lyric for submitted data, the restricted entity is excluded from the `entityName` filter sent to the query. When the category's dictionary is fetched, the `sociodemographic` entity is dropped from the list of entities being requested (`filterAllowedEntityNames`), so its rows are never read from the database in the first place. If a caller's request would otherwise match only the restricted entity, that function returns an empty array, and the controller checks for that and returns an empty result immediately without querying at all — this specifically avoids ever passing an _empty_ entity-name array through to Lyric's query layer, which would be interpreted as "no filter" and return everything, unfiltered.
2. **Response-level stripping.** After the query runs (and after the internal-ID sanitization step that reads the original submitter ID values to look up their PCGL system IDs), the response is walked recursively and any key matching the restricted entity or a submitter ID field name is removed, at any depth (`stripRestrictedData`). The submitter ID field names are read from the ID manager config on every request. This is the layer that actually guarantees correctness: Lyric's compound/nested view re-embeds related schemas via separate queries that aren't covered by the query-level exclusion, so the restricted entity could otherwise resurface as a nested block regardless of what was excluded from the top-level query.

The single-record-by-system-ID endpoint (`GET /data/category/:categoryId/id/:systemId`) has no entity filter to apply before the read, since it fetches one row directly by its system ID. For that endpoint only, the restricted entity is instead checked after the (unavoidable) read, and denied the same way as a missing record (`404`), so restricted records aren't distinguishable from ones that don't exist.

## Tests

Run the tests with `pnpm test`, which uses Node's built-in test runner. The logic of the restriction is unit tested in `src/test/accessRestrictionService.test.ts`.

The tests in `src/test/` send HTTP requests to the real routers, middleware and controllers, as users with different access (admin, WRITE, READ-only, no access) and check what comes back, for the endpoints above. A denied request has to be denied, and the data of a restricted request has to be missing from the response. Only the things outside of the server are replaced:

- the AuthZ service, answered from a list of test users
- the database, with the rows each test needs, a query it did not expect fails the test
- the Lyric services that read data, which also record what they were called with, so that a test can tell that the restricted entity was never requested

Nothing connects to a real service. To add an endpoint, import its router in a test file and mount it with `startTestServer`, see `src/test/helpers/testApp.ts`.
