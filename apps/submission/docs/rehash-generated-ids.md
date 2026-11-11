# Rehashing Generated IDs

`src/scripts/rehash-generated-ids.ts` is a one-off migration for the PCGL IDs in `pcgl.generated_identifiers`. It moves every existing ID from the old hash format to the current one, so that records keep the PCGL ID they were given. With `--generate-missing`, it also generates PCGL IDs for the records that have none.

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
- access to the PCGL and Lyric tables in the same Postgres database as the API. Besides reading submitted data through Lyric, the script reads `created_at` from Lyric's `submitted_data` table directly.

```sh
cd apps/submission
pnpm rehash:ids [options]          # development, runs the TypeScript source with tsx
pnpm rehash:ids:prod [options]     # compiled build, from dist/
```

The logs are JSON lines. Pipe them through `pnpm exec pino-pretty` to read them more easily.

| Option               | Effect                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--generate-missing` | Generates a PCGL ID for every collision and every record without an ID. Without it, those records are only logged.                                                |
| `--dry-run`          | Runs every step and logs the result, then rolls back. Nothing is saved, and no sequence values are taken, so the logs can't show the IDs that would be generated. |

Run it with `--dry-run` first, with the same other options, and check the logs before running it for real.

## What it does

1. Loads every config in `pcgl.id_generation_config`, and every study that has a category.
2. For each study and each configured entity, reads the study's submitted records of that entity through Lyric, and computes each record's old and current hash from its configured submitter field. Records without a value in that field are counted as `missingValue` and skipped.
3. Groups the records by their old hash. Every record in a group has the same submitter value, so under the old hash they all shared one PCGL ID. For each group:
   - **Already migrated:** records whose entity already has a row at their current hash are left as they are.
   - **Updated:** when the old hash has a row, the earliest committed record of that row's entity keeps the PCGL ID, and the row is moved to that record's current hash. The PCGL ID doesn't change.
   - **Collision:** every other record of the group, of any entity. It does not keep the existing ID.
   - **Without ID:** when no record of the group has or keeps an ID, each record of the group was never given one. For example, it was committed before its entity was added to `ID_MANAGER_CONFIG`.
4. With `--generate-missing`, generates a new PCGL ID for each collision and each record without an ID, the same way IDs are generated on commit: the entity's prefix followed by the next value of its sequence.

Every change runs in one transaction. If any step fails, nothing is saved.

### Which record keeps an existing ID

The earliest committed record keeps it, since that is the record the ID was generated for. Records are ordered by `created_at` in Lyric's `submitted_data` table.

When several records have exactly the same `created_at`, the one with the lowest Lyric system ID keeps the ID. System IDs are random, so this choice is arbitrary but repeatable. Each tie is logged at `warn` level with the records involved and the one chosen:

```
[IIM rehash]: Records committed at the same time, the lowest system ID keeps the PCGL ID: {"entityName":"participant","createdAt":"2025-10-02 14:03:11.52012","tiedRecords":[{"studyId":"STUDY-A","systemId":"KQWTRZ"},{"studyId":"STUDY-B","systemId":"BHXJNE"}],"chosenSystemId":"BHXJNE"}
```

## Checking the result

### Collisions and records without an ID

Each collision and each record without an ID is logged at `warn` level. A log line identifies the record by its entity, its study and its Lyric system ID, and says what was done for it. Submitter values are never logged.

The `action` field is one of:

- `generated`, followed by the new `generatedId`.
- `would generate (dry run)`.
- `not generated (run with --generate-missing)`.

A record without an ID:

```
[IIM rehash]: Record has no PCGL ID: {"entityName":"specimen","studyId":"STUDY-B","systemId":"SPEC-SYS-7","action":"generated","generatedId":"SP00000213"}
```

A collision names the record that kept the existing ID, and that ID:

```
[IIM rehash]: Collision, record does not keep the existing PCGL ID: {"entityName":"participant","studyId":"STUDY-B","systemId":"PART-SYS-2","idKeptBy":{"entityName":"participant","studyId":"STUDY-A","systemId":"PART-SYS-1","generatedId":"PT00000001"},"action":"generated","generatedId":"PT00000412"}
```

When the existing ID belongs to a record that was not read, such as a record of a study without a category, only that record's entity and PCGL ID are known:

```
[IIM rehash]: Collision, record does not keep the existing PCGL ID: {"entityName":"specimen","studyId":"STUDY-A","systemId":"SPEC-SYS-3","idKeptBy":{"entityName":"participant","generatedId":"PT00000004"},"action":"not generated (run with --generate-missing)"}
```

### Summary

When it finishes, the script logs the totals, then the counts of each entity in each study:

```
[IIM rehash]: Finished rehashing generated IDs. Totals: {"updated":120,"alreadyMigrated":0,"collisions":1,"withoutId":3,"missingValue":0,"generated":4}
[IIM rehash]: Counts for {"entityName":"participant","studyId":"STUDY-A","updated":80,"alreadyMigrated":0,"collisions":0,"withoutId":0,"missingValue":0,"generated":0}
[IIM rehash]: Counts for {"entityName":"participant","studyId":"STUDY-B","updated":40,"alreadyMigrated":0,"collisions":1,"withoutId":0,"missingValue":0,"generated":1}
[IIM rehash]: Counts for {"entityName":"specimen","studyId":"STUDY-B","updated":0,"alreadyMigrated":0,"collisions":0,"withoutId":3,"missingValue":0,"generated":3}
```

A dry run starts the totals line with `Dry run finished, no changes were saved`, and `generated` counts the IDs that would be generated.

The summary is only logged when the run succeeds. When it fails, the record logs written before the failure describe a state that was rolled back.

### What the results mean

- It exits with `0` when it finished (a dry run included), and with `1` when it failed and saved nothing. The error is logged.
- `collisions` and `withoutId` count the records that had no PCGL ID of their own after the move. `generated` counts the ones that were given one. Without `--generate-missing`, it is `0`.
- Running it again is safe. It never changes or removes an ID that already belongs to a record. After a run with `--generate-missing`, every record with a submitter value has its own ID, so a second run counts everything as `alreadyMigrated` and changes nothing. After a run without it, a second run logs the same collisions and records without an ID again.

## Risks

- **Collisions change the PCGL ID a record shows.** Under the old hash, every record that shared a submitter value showed the same PCGL ID: the one now kept by the earliest committed record. A collision gets a new ID, so any copy of its old PCGL ID made before the migration, in an export, another system or a note, now refers to a different record. The collision log lines list each of these records, with the ID it used to show (`idKeptBy.generatedId`) and its new ID.
- **Sequence values are used up on failure.** Postgres doesn't roll back sequence values, so a run that fails after generating IDs leaves gaps in the IDs. IDs stay unique.
- **Not tested against a database:** there are no automated tests for the script, and it has not been run against a real database. Run it with `--dry-run` against a copy of the environment's database first, and check that records read the same PCGL IDs before and after.
