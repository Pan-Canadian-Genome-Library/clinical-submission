-- REVERT PREVIOUS MIGRATION

-- Change name of existing tables and types to revert the migration
ALTER TABLE "pcgl"."study_translations" RENAME TO "study_translations_custom";
ALTER TYPE "pcgl"."languages" RENAME TO "languages_custom";
DROP SEQUENCE IF EXISTS "pcgl"."study_translations_study_translation_id_seq" CASCADE;

-- DROP new columns in study
ALTER TABLE "pcgl"."study" DROP COLUMN "default_translation";

-- Re-add the columns that were dropped from the study table as nullable
ALTER TABLE "pcgl"."study" ADD COLUMN "study_description" text;
ALTER TABLE "pcgl"."study" ADD COLUMN "program_name" varchar(255);
ALTER TABLE "pcgl"."study" ADD COLUMN "keywords" text[];
ALTER TABLE "pcgl"."study" ADD COLUMN "participant_criteria" text;
ALTER TABLE "pcgl"."study" ADD COLUMN "funding_sources" text[];
