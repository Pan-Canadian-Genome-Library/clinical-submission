ALTER TABLE "pcgl"."study" ALTER COLUMN "context" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "pcgl"."study_context";--> statement-breakpoint
CREATE TYPE "pcgl"."study_context" AS ENUM('Clinical', 'Research');--> statement-breakpoint
ALTER TABLE "pcgl"."study" ALTER COLUMN "context" SET DATA TYPE "pcgl"."study_context" USING "context"::"pcgl"."study_context";--> statement-breakpoint
ALTER TABLE "pcgl"."study" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "pcgl"."study_status";--> statement-breakpoint
CREATE TYPE "pcgl"."study_status" AS ENUM('Ongoing', 'Completed');--> statement-breakpoint
ALTER TABLE "pcgl"."study" ALTER COLUMN "status" SET DATA TYPE "pcgl"."study_status" USING "status"::"pcgl"."study_status";