ALTER TABLE "pcgl"."study" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "pcgl"."study" ADD CONSTRAINT "study_category_id_unique" UNIQUE("category_id");