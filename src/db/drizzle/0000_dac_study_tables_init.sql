CREATE SCHEMA "pcgl";
--> statement-breakpoint
CREATE TYPE "public"."study_context" AS ENUM('CLINICAL', 'RESEARCH');--> statement-breakpoint
CREATE TYPE "public"."study_status" AS ENUM('ONGOING', 'COMPLETED');--> statement-breakpoint
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
CREATE TABLE "pcgl"."study" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pcgl"."study_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"dac_id" bigint NOT NULL,
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
