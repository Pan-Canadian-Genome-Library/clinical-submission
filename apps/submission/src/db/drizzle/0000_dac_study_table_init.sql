CREATE SCHEMA "pcgl";
--> statement-breakpoint
CREATE TYPE "pcgl"."study_context" AS ENUM('CLINICAL', 'RESEARCH');--> statement-breakpoint
CREATE TYPE "pcgl"."study_status" AS ENUM('ONGOING', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "pcgl"."dac" (
	"dac_id" text PRIMARY KEY NOT NULL,
	"dac_name" varchar(255) NOT NULL,
	"dac_description" text NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pcgl"."study" (
	"study_id" text PRIMARY KEY NOT NULL,
	"dac_id" text NOT NULL,
	"study_name" varchar(255) NOT NULL,
	"study_description" text NOT NULL,
	"program_name" varchar(255),
	"keywords" text[],
	"status" "pcgl"."study_status" NOT NULL,
	"context" "pcgl"."study_context" NOT NULL,
	"domain" text[] NOT NULL,
	"participant_criteria" text,
	"principal_investigators" text[] NOT NULL,
	"lead_organizations" text[] NOT NULL,
	"collaborator" text[],
	"funding_sources" text[] NOT NULL,
	"publication_links" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
