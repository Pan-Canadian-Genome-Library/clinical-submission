-- Custom SQL migration file --
CREATE TYPE "pcgl"."languages" AS ENUM('eng_ca', 'fr_ca');
CREATE TABLE "pcgl"."study_translations" (
	"study_translation_id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"language_id" "pcgl"."languages" NOT NULL,
	"study_description" text NOT NULL,
	"program_name" varchar(255),
	"keywords" text[],
	"participant_criteria" text,
	"funding_sources" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	UNIQUE("study_id", "language_id"),
	FOREIGN KEY ("study_id") REFERENCES "pcgl"."study"("study_id") ON DELETE CASCADE
);

-- Insert existing study data into study_translations with default language (eng_ca)
INSERT INTO "pcgl"."study_translations" (
	study_translation_id,
	study_id,
	language_id,
	study_description,
	program_name,
	keywords,
	participant_criteria,
	funding_sources,
	created_at,
	updated_at
)
SELECT
    study.study_id || '_eng_ca',
	study.study_id,
	'eng_ca',
	study.study_description,
	study.program_name,
	study.keywords,
	study.participant_criteria,
	study.funding_sources,
	COALESCE(study.created_at, now()),
	study.updated_at
FROM "pcgl"."study" study;




-- Apply default_translation to study table
ALTER TABLE "pcgl"."study" ADD COLUMN "default_translation" text;
ALTER TABLE "pcgl"."study" ADD CONSTRAINT "default_translation_fk" FOREIGN KEY ("default_translation") REFERENCES "pcgl"."study_translations"("study_translation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Update the default_translation to point to the newly created translations
UPDATE "pcgl"."study" s
SET default_translation =  s.study_id || '_eng_ca';
-- Apply not null constraint to default_translation
ALTER TABLE "pcgl"."study" ALTER COLUMN "default_translation" SET NOT NULL;

-- Drop study_description, program_name, keywords, participant_criteria, funding_sources columns from study table
ALTER TABLE "pcgl"."study" DROP COLUMN "study_description";
ALTER TABLE "pcgl"."study" DROP COLUMN "program_name";
ALTER TABLE "pcgl"."study" DROP COLUMN "keywords";
ALTER TABLE "pcgl"."study" DROP COLUMN "participant_criteria";
ALTER TABLE "pcgl"."study" DROP COLUMN "funding_sources";
