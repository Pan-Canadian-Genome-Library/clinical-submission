# Rehashing Generated IDs

`src/scripts/rehash-generated-ids.ts` is a one-off migration for the PCGL IDs in `pcgl.generated_identifiers`. It moves every existing ID from the old hash format to the current one, so that records keep the PCGL ID they were given.

## Why it's needed

Each generated PCGL ID is stored against a hash of the record it belongs to, in `generated_identifiers.source_hash`. Lookups compute the same hash from the record and find the ID by it.

- **Old hash:** an HMAC of the submitter value alone (`generateHash`). The same value in two entities, or in two studies, gave the same hash, so only the first record committed with that value got an ID.
- **Current hash:** an HMAC of the entity name, the study ID and the submitter value (`generateEntityHash`). Each entity and study gets its own ID for the same value.

Both are keyed with `ID_MANAGER_SECRET`. A hash can't be reversed, so the rows can't be updated from the hash alone. The script reads the submitted data back and computes both hashes for every record.

Until the script runs, IDs generated under the old hash are not found. Data read endpoints return those records without their PCGL ID, and `GET /data/entity/{entityName}/{externalId}/exists` reports them as not existing.

## When to run it

Run it once per environment, as soon as possible after deploying the release that scopes hashes by entity and study. Records read between the deploy and the run have no PCGL ID.

Environments that have no generated IDs yet, such as a new database, don't need it.

## How to run it

The script uses the same configuration as the API. It needs the API's environment variables (see the [README](../README.md#environment-variables)), and in particular:

- the same `ID_MANAGER_SECRET` that generated the existing IDs. With a different secret, no old hash matches and nothing is migrated.
- access to the PCGL and Lyric tables in the same Postgres database as the API.

```sh
cd apps/submission
pnpm rehash:ids          # development, runs the TypeScript source with tsx
pnpm rehash:ids:prod     # compiled build, from dist/
```

## What it does

1. Loads every config in `pcgl.id_generation_config`, and every study that has a category.
2. For each study and each configured entity, reads the study's submitted records of that entity through Lyric, in the order Lyric returns them.
3. For each record, computes the old and the current hash from the configured submitter field, then checks, in this order:
   - **Already migrated:** when the entity's config already has a row at the current hash, leaves it.
   - **Updated:** when the entity's config has a row at the old hash, moves that row to the current hash. The PCGL ID doesn't change.
   - **Collision:** when the row at the old hash was already moved for another record, or belongs to another entity's config, leaves the record without an ID and logs it. This is a value that the old hash shared between studies or entities. Only the first record read with it keeps the existing ID.
   - **Without ID:** when no row has either hash, leaves the record without an ID and logs it. The record was never given one, for example because it was committed before its entity was added to `ID_MANAGER_CONFIG`.
   - **Missing value:** when the record has no value in the submitter field, skips it.

Every update runs in one transaction. If any step fails, nothing is saved.

## Checking the result

### Records left without an ID

Each record left without an ID is logged at `warn` level as it is read. A log line identifies the record by its entity, its study and its Lyric system ID. Submitter values are never logged.

A record without an ID:

```
[IIM rehash]: Record has no PCGL ID: {"entityName":"specimen","studyId":"STUDY-B","systemId":"SPEC-SYS-7"}
```

A collision with a record that was already read names that record and the PCGL ID it kept:

```
[IIM rehash]: Collision, record left without a PCGL ID: {"entityName":"participant","studyId":"STUDY-B","systemId":"PART-SYS-2","idKeptBy":{"entityName":"participant","studyId":"STUDY-A","systemId":"PART-SYS-1","generatedId":"PT00000001"}}
```

A collision with a record of another entity that has not been read yet can only name that record's entity and PCGL ID:

```
[IIM rehash]: Collision, record left without a PCGL ID: {"entityName":"specimen","studyId":"STUDY-A","systemId":"SPEC-SYS-3","idKeptBy":{"entityName":"participant","generatedId":"PT00000004"}}
```

### Summary

When it finishes, the script logs the totals, then the counts of each entity in each study:

```
[IIM rehash]: Finished rehashing generated IDs. Totals: {"updated":120,"alreadyMigrated":0,"collisions":1,"withoutId":3,"missingValue":0}
[IIM rehash]: Counts for {"entityName":"participant","studyId":"STUDY-A","updated":80,"alreadyMigrated":0,"collisions":0,"withoutId":0,"missingValue":0}
[IIM rehash]: Counts for {"entityName":"participant","studyId":"STUDY-B","updated":40,"alreadyMigrated":0,"collisions":1,"withoutId":0,"missingValue":0}
[IIM rehash]: Counts for {"entityName":"specimen","studyId":"STUDY-B","updated":0,"alreadyMigrated":0,"collisions":0,"withoutId":3,"missingValue":0}
```

The summary is only logged when the run succeeds. When it fails, the record logs written before the failure describe a state that was rolled back.

### What the results mean

- It exits with `0` when it finished and saved its changes, and with `1` when it failed and saved nothing. The error is logged.
- `collisions` greater than `0` means some records lost their PCGL ID. Those records need IDs generated for them separately.
- `withoutId` counts records that never had an ID. They are not affected by the migration.
- Running it again is safe. It never changes or removes an ID that was already moved, and moved rows are counted as `alreadyMigrated`. Records are read in the order Lyric returns them, so a record that collided can be counted as `collisions` on one run and `withoutId` on the next.

## Limitations

- **Records committed between the deploy and the run:** a record committed after the deploy gets a new ID under the current hash, and is counted as `alreadyMigrated`. If its submitter value is also used by an older record of the same entity in another study, and the new record is read first, the older record is counted as a collision and loses its ID. Running the script right after the deploy avoids this.
- **Collisions are not resolved:** records that shared a hash keep no ID. Generating the missing IDs is not part of this script.
- **Not tested against a database:** there are no automated tests for the script, and it has not been run against a real database. Run it against a copy of the environment's database first, and check that records read the same PCGL IDs before and after.
