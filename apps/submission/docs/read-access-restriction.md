# Read Access Restriction

Ahead of DACO launch, researchers are granted **READ**-only access to a study, distinct from the **WRITE** access submitters have. A user with READ but not WRITE access to a study gets a restricted view of that study's submitted data: certain data is never retrievable or queryable by them, regardless of which endpoint or query shape they use.

This is a fixed part of the access model, not an optional feature: it applies automatically whenever a user has READ access to a study without also having WRITE access to that same study. There is no environment variable to disable it. A user with WRITE access (which includes admins, and any user when authentication is disabled) is never restricted.

## What is restricted

Two things, defined as constants in [`src/service/accessRestrictionService.ts`](../src/service/accessRestrictionService.ts):

- **The `sociodemographic` entity** is excluded entirely. No record of this schema is retrievable, whether requested directly, through pagination, through a SQON query, or re-embedded as a nested block by Lyric's `view=compound`/`view=nested` (which pulls in related schemas by walking the dictionary hierarchy, independently of any entity filter applied to the main query).
- **The `submitter_participant_id` field** is removed from every entity's response, wherever it appears, at any nesting depth. This is independent of `ID_MANAGER_CONFIG` (the internal ID-manager config): that config controls which fields get a PCGL system ID added alongside them, unconditionally, for every user; this restriction controls which fields get their original submitter-supplied value removed, only for READ-only users.

## Where it applies

The restriction is enforced in the data-read endpoints (`src/controllers/dataController.ts`):

- `GET /data/category/:categoryId`
- `GET /data/category/:categoryId/id/:systemId`
- `GET /data/category/:categoryId/organization/:organization`
- `POST /data/category/:categoryId/organization/:organization/query`

`GET /data/category/:categoryId/stream` is unaffected: it is admin-only at the route level, and admins are never restricted.

## How it's enforced

Two layers, not one:

1. **Query-level exclusion.** Before querying Lyric for submitted data, the restricted entity is excluded from the `entityName` filter sent to the query. When the category's dictionary is fetched, the `sociodemographic` entity is dropped from the list of entities being requested (`filterAllowedEntityNames`), so its rows are never read from the database in the first place. If a caller's request would otherwise match only the restricted entity, that function returns an empty array, and the controller checks for that and returns an empty result immediately without querying at all — this specifically avoids ever passing an *empty* entity-name array through to Lyric's query layer, which would be interpreted as "no filter" and return everything, unfiltered.
2. **Response-level stripping.** After the query runs (and after the internal-ID sanitization step that reads the original `submitter_participant_id` value to look up its PCGL system ID), the response is walked recursively and any key matching the restricted entity or field name is removed, at any depth (`stripRestrictedData`). This is the layer that actually guarantees correctness: Lyric's compound/nested view re-embeds related schemas via separate queries that aren't covered by the query-level exclusion, so the restricted entity could otherwise resurface as a nested block regardless of what was excluded from the top-level query.

The single-record-by-system-ID endpoint (`GET /data/category/:categoryId/id/:systemId`) has no entity filter to apply before the read, since it fetches one row directly by its system ID. For that endpoint only, the restricted entity is instead checked after the (unavoidable) read, and denied the same way as a missing record (`404`), so restricted records aren't distinguishable from ones that don't exist.
