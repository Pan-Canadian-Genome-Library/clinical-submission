-- Copy records from the custom study_translations_custom table into the main study_translations table
-- and update the default_translation field in the study table

-- Alter the language_id column to use the pcgl.languages enum
ALTER TABLE "pcgl"."study_translations_custom"
    ALTER COLUMN "language_id" TYPE "pcgl"."languages" USING "language_id"::text::"pcgl"."languages";


-- Insert data from the custom table into the main study_translations table
INSERT INTO pcgl.study_translations (
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
    study_id,
    language_id,
    study_description,
    program_name,
    keywords,
    participant_criteria,
    funding_sources,
    created_at,
    updated_at
FROM pcgl.study_translations_custom;


-- Update the default_translation to point to the newly created translations
UPDATE "pcgl"."study" studyTable
SET default_translation = studyTranslationTable.study_translation_id
FROM "pcgl"."study_translations" studyTranslationTable
WHERE studyTable.study_id = studyTranslationTable.study_id AND studyTranslationTable.language_id = 'en_ca';


-- Drop the custom table
DROP TABLE pcgl.study_translations_custom;
