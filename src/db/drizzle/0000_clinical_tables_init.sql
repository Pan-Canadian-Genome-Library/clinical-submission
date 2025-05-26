CREATE SCHEMA "pcgl";
--> statement-breakpoint
CREATE TYPE "public"."genome_build" AS ENUM('open', 'controlled');--> statement-breakpoint
CREATE TYPE "public"."comorbidity_status" AS ENUM('Active', 'In Remission', 'Resolved', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."comorbidity_treatment_status" AS ENUM('Untreated', 'Under treatment', 'Treated and resolved', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."cause_of_death" AS ENUM('Died of cancer', 'Died of other reasons', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."vital" AS ENUM('Alive', 'Deceased', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."experiment_type" AS ENUM('NCIT:C84343 (Genomics)', 'NCIT:C153189 (Transcriptomics)', 'NCIT:C20085 (Proteomics)', 'NCIT:C153191 (Metagenomics)', 'NCIT:C153190 (Epigenomics)');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('NCIT:C84343 (Genomics)', 'CAPILLARY', 'DNBSEQ', 'ELEMENT', 'HELICOS', 'ILLUMINA', 'IONTORRENT', 'LS454', 'ONT', 'PACBIO', 'SINGULAR', 'SOLID', 'ULTIMA');--> statement-breakpoint
CREATE TYPE "public"."exposure_status" AS ENUM('Current', 'Former', 'Never', 'Exposed - Current Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."file_types" AS ENUM('SIGNED_APPLICATION', 'ETHICS_LETTER');--> statement-breakpoint
CREATE TYPE "public"."duo" AS ENUM('DUO:0000042', 'DUO:0000006', 'DUO:0000007', 'DUO:0000011', 'DUO:0000004');--> statement-breakpoint
CREATE TYPE "public"."phenotype_severity" AS ENUM('Borderline', 'Mild', 'Moderate', 'Profound', 'Severe');--> statement-breakpoint
CREATE TYPE "public"."library_layout" AS ENUM('OBI:0000722 (paired-end library)', 'OBI:0000736 (single fragment library)', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."sample_status" AS ENUM('Case', 'Control', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."education_collect" AS ENUM('Self-identified', 'Derived', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."eduction" AS ENUM('No formal education', 'Elementary school or equivalent', 'High school diploma or equivalency certificate', 'Certificate of Apprenticeship', 'Certificate of Qualification', 'College, CEGEP, or other non-university certificate or diploma', 'Bachelor''s degree', 'Degree in medicine, dentistry, veterinary medicine or optometry', 'Master''s degree', 'Doctoral degree', 'Post-doctoral fellowship or training', 'Prefer not to answer', 'Not applicable', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."ethnicity_collect" AS ENUM('Socially assigned', 'Self-identified', 'Derived', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."ethnicity" AS ENUM('Free text input', 'Another Ethnic or Cultural Origin', 'Do not know', 'Prefer not to answer', 'Not applicable', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."gender_collect" AS ENUM('Self-identified', 'Other', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('Man', 'Woman', 'Another Gender', 'Prefer not to answer', 'Not applicable', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."geographic_collect" AS ENUM('Self-identified', 'Derived', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."income_collect" AS ENUM('Self-identified', 'Derived', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."income" AS ENUM('Less than $15,000', '$ 15,000 - $ 19,999', '$ 20,000 - $ 29,000', '$ 30,000 - $ 49,999', '$ 50,000 - $ 69,999', '$ 70,000 - $ 84,999', '$ 85,000 - $ 99,999', '$ 100,000 - $ 124,999', '$ 125,000 - $ 149,999', '$ 150,000 or more', 'Prefer not to answer', 'Not applicable', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."race_collect" AS ENUM('Socially assigned', 'Self-identified', 'Derived', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."race" AS ENUM('Black', 'East Asian', 'Indigenous (First Nations, Inuk/Inuit, Métis)', 'Latin American', 'Middle Eastern or North African', 'South Asian', 'Southeast Asian', 'White', 'Another Racial Category', 'Do not know', 'Prefer not to answer', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."sex_collect" AS ENUM('Self-identified', 'Clinician-recorded', 'Derived', 'Other', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('Male', 'Female', 'Intersex', 'Another Sex', 'Missing - Unknown', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access');--> statement-breakpoint
CREATE TYPE "public"."sociodem" AS ENUM('PCGL reference question', 'Another question', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown');--> statement-breakpoint
CREATE TYPE "public"."specimen_laterality" AS ENUM('Left', 'Not applicable', 'Right', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown');--> statement-breakpoint
CREATE TYPE "public"."specimen_processing" AS ENUM('Cryopreservation in liquid nitrogen (dead tissue)', 'Cryopreservation in dry ice (dead tissue)', 'Cryopreservation of live cells in liquid nitrogen', 'Cryopreservation - other', 'Formalin fixed & paraffin embedded', 'Formalin fixed - buffered', 'Formalin fixed - unbuffered', 'Fresh', 'Other', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown');--> statement-breakpoint
CREATE TYPE "public"."specimen_storage" AS ENUM('Cut slide', 'Frozen in -70 freezer', 'Frozen in liquid nitrogen', 'Frozen in vapour phase', 'Not Applicable', 'Other', 'Paraffin block', 'RNA later frozen', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."study_context" AS ENUM('CLINICAL', 'RESEARCH');--> statement-breakpoint
CREATE TYPE "public"."study_status" AS ENUM('ONGOING', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."treatment_intent" AS ENUM('Curative', 'Diagnostic', 'Forensic', 'Guidance', 'Palliative', 'Preventative', 'Screening', 'Supportive', 'Other', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."treatment_response" AS ENUM('Clinical remission', 'Disease Progression', 'Improvement of symptoms', 'No improvement of symptoms', 'No sign of disease', 'Partial Response', 'Stable Disease', 'Treatment cessation due to toxicity', 'Worsening of symptoms', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."treatment_status" AS ENUM('Other', 'Patient choice (stopped or interrupted treatment)', 'Physician decision (stopped or interrupted treatment)', 'Treatment completed as prescribed', 'Treatment incomplete due to technical problems', 'Treatment incomplete because patient died', 'Treatment ongoing', 'Treatment stopped due to lack of efficacy', 'Treatment stopped due to acute toxicity', 'Missing - Not collected', 'Missing - Not provided', 'Missing - Restricted access', 'Missing - Unknown', 'Not applicable');--> statement-breakpoint
CREATE TYPE "public"."treatment_type" AS ENUM('Medication', 'Procedure', 'Radiation therapy', 'Other');--> statement-breakpoint
CREATE TABLE "pcgl"."analysis" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."analysis_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_analysis_id" varchar(255) NOT NULL,
	"analysisType" varchar(255) NOT NULL,
	"submitter_participant_id" varchar(255),
	"submitter_specimen_id" varchar(255),
	"submitter_sample_id" varchar(255),
	"submitter_experiment_id" varchar(255),
	"data_category" varchar(255) NOT NULL,
	"variant_class" varchar(255),
	"variant_calling_strategy" varchar(255),
	"genome_build" "genome_build",
	"genome_annotation" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."comorbidity" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."comorbidity_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_participant_id" varchar(255) NOT NULL,
	"age_at_comorbidity_diagnosis" integer,
	"comorbidity_code" varchar(255) NOT NULL,
	"comorbidity_term" varchar(255),
	"comorbidity_treatment_status" "comorbidity_treatment_status",
	"comorbidity_status" "comorbidity_status",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."dac" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."dac_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"dac_name" varchar(255) NOT NULL,
	"dac_description" text NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."demographic" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."demographic_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_participant_id" varchar(255) NOT NULL,
	"age_at_enrollment" integer,
	"vital_status" "vital",
	"cause_of_death" "cause_of_death",
	"age_at_death" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."diagnosis" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."diagnosis_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_participant_id" varchar(255) NOT NULL,
	"submitter_diagnosis_id" varchar(255) NOT NULL,
	"age_at_diagnosis" integer,
	"disease_code" varchar(255) NOT NULL,
	"disease_term" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."experiment" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."experiment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_experiment_id" varchar(255) NOT NULL,
	"submitter_sample_id" varchar(255) NOT NULL,
	"experiment_type" "experiment_type" NOT NULL,
	"experiment_design" varchar(255),
	"assay_type_code" varchar(255) NOT NULL,
	"assay_type_term" varchar(255),
	"platform" "platform" NOT NULL,
	"instrument" varchar(255) NOT NULL,
	"instrument_metadata" text,
	"sequencing_protocol" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."exposure" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."exposure_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_participant_id" varchar(255) NOT NULL,
	"exposure_code" varchar(255) NOT NULL,
	"exposure_term" varchar(255),
	"exposure_status" "exposure_status" NOT NULL,
	"age_at_exposure" integer,
	"exposure_duration" integer,
	"exposure_amount" integer,
	"exposure_unit" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."file" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."file_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_analysis_id" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" bigint NOT NULL,
	"file_Md5sum" varchar(255) NOT NULL,
	"file_type" "file_types" NOT NULL,
	"file_access" "genome_build" NOT NULL,
	"data_type" "bytea" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."measurement" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."measurement_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_participant_id" varchar(255) NOT NULL,
	"age_at_measurement" integer,
	"measurement_code" varchar(255) NOT NULL,
	"measurement_term" varchar(255),
	"measurement_result_numeric" integer,
	"measurement_unit" varchar(255),
	"measurement_result_categorical" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."medication" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."medication_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_treatment_id" varchar(255) NOT NULL,
	"drug_code" varchar(255) NOT NULL,
	"drug_term" varchar(255) NOT NULL,
	"drug_dose_units" varchar(255) NOT NULL,
	"prescribed_cumulative_drug_dose" integer,
	"actual_cumulative_drug_dose" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."participant" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."participant_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_participant_id" varchar(255) NOT NULL,
	"duo_permission" "duo" NOT NULL,
	"duo_modifier" text[] NOT NULL,
	"disease_specific_modifier" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."phenotype" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."phenotype_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_participant_id" varchar(255) NOT NULL,
	"age_at_phenotype" integer,
	"phenotype_code" varchar(255) NOT NULL,
	"phenotype_term" varchar(255),
	"phenotype_observed" varchar(255) NOT NULL,
	"phenotype_duration" integer,
	"phenotype_severity" "phenotype_severity" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."procedure" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."procedure_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_treatment_id" varchar(255) NOT NULL,
	"procedure_code" varchar(255) NOT NULL,
	"procedure_term" varchar(255),
	"procedure_body_site_code" varchar(255) NOT NULL,
	"procedure_body_site_term" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."radiation" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."radiation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_treatment_id" varchar(255) NOT NULL,
	"radiation_modality_code" varchar(255) NOT NULL,
	"radiation_modality_term" varchar(255),
	"radiation_fractions" integer,
	"radiation_dosage" integer,
	"anatomical_site_irradiated_code" varchar(255) NOT NULL,
	"anatomical_site_irradiated_term" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."read_group" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."read_group_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_read_group_id" varchar(255) NOT NULL,
	"submitter_experiment_id" varchar(255) NOT NULL,
	"file_r1" varchar(255) NOT NULL,
	"file_r2" varchar(255),
	"library_name" varchar(255) NOT NULL,
	"library_layout" "library_layout" NOT NULL,
	"platform_unit" varchar(255) NOT NULL,
	"library_description" text,
	"read_group_id_in_bam" varchar(255),
	"read_length_r1" integer,
	"read_length_r2" integer,
	"insert_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."sample" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."sample_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_sample_id" varchar(255) NOT NULL,
	"submitter_specimen_id" varchar(255) NOT NULL,
	"molecule_type_code" varchar(255) NOT NULL,
	"molecule_type_term" varchar(255),
	"sample_status" "sample_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."sociodemographic" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."sociodemographic_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_sociodem_id" varchar(255) NOT NULL,
	"submitter_participant_id" varchar(255) NOT NULL,
	"age_at_sociodem_collection" bigint NOT NULL,
	"sociodem_date_collection" timestamp DEFAULT now() NOT NULL,
	"race" "race" NOT NULL,
	"race_another_racial_category" varchar(255) NOT NULL,
	"race_collect_method" "race_collect",
	"gender" "gender" NOT NULL,
	"gender_another_gender" varchar(255),
	"gender_collect_method" "gender_collect" NOT NULL,
	"ethnicity" "ethnicity" NOT NULL,
	"ethnicity_another_category" varchar(255),
	"ethnicity_collect_method" "ethnicity_collect" NOT NULL,
	"sex_at_birth" "sex" NOT NULL,
	"sex_another_category" varchar(255),
	"sex_collect_method" "sex_collect" NOT NULL,
	"education" "eduction" NOT NULL,
	"education_collect_method" "education_collect" NOT NULL,
	"personal_income" "income" NOT NULL,
	"personal_income_collect_method" "income_collect" NOT NULL,
	"geographic_location" varchar(255) NOT NULL,
	"geographic_location_additional" varchar(255),
	"geographic_location_collect_method" "geographic_collect" NOT NULL,
	"sociodem_question" "sociodem" NOT NULL,
	"sociodem_question_detail" varchar(255),
	"sociodem_notes" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."specimen" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."specimen_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_participant_id" varchar(255) NOT NULL,
	"submitter_specimen_id" varchar(255) NOT NULL,
	"specimen_tissue_source_code" varchar(255) NOT NULL,
	"specimen_tissue_source_term" varchar(255),
	"specimen_storage" "specimen_storage",
	"specimen_processing" "specimen_processing",
	"age_at_specimen_collection" integer,
	"specimen_anatomic_location_code" varchar(255),
	"specimen_anatomic_location_term" varchar(255),
	"specimen_laterality" "specimen_laterality",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."study" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."study_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"study_name" varchar(255) NOT NULL,
	"study_description" text NOT NULL,
	"program_name" varchar(255),
	"keywords" varchar(255),
	"status" "study_status" NOT NULL,
	"context" "study_context" NOT NULL,
	"domain" text[] NOT NULL,
	"participant_criteria" varchar(255),
	"principal_investigators" text[] NOT NULL,
	"lead_organizations" text[] NOT NULL,
	"collaborator" text[],
	"funding_sources" text[] NOT NULL,
	"publication_links" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."treatment" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."treatment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_participant_id" varchar(255) NOT NULL,
	"submitter_treatment_id" varchar(255) NOT NULL,
	"treatment_type" "treatment_type" NOT NULL,
	"submitter_diagnosis_id" varchar(255),
	"age_at_treatment" integer,
	"treatment_duration" integer,
	"treatment_intent" "treatment_intent",
	"treatment_response" "treatment_response",
	"treatment_status" "treatment_status",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."workflow" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."workflow_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submitter_workflow_id" varchar(255) NOT NULL,
	"submitter_analysis_id" varchar(255) NOT NULL,
	"workflow_name" varchar(255) NOT NULL,
	"workflow_version" varchar(255),
	"workflow_url" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
