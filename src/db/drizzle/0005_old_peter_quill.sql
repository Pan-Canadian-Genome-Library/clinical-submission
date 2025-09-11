ALTER TABLE "pcgl"."study" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "pcgl"."id_generation_config" ADD CONSTRAINT "id_generation_config_replacement_id_unique" UNIQUE("replacement_id");--> statement-breakpoint
ALTER TABLE "pcgl"."study" ADD CONSTRAINT "study_category_id_unique" UNIQUE("category_id");