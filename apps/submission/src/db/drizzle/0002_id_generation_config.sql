CREATE TABLE "pcgl"."generated_identifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_hash" text NOT NULL,
	"generated_id" varchar(255) NOT NULL,
	"config_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "generated_identifiers_source_hash_unique" UNIQUE("source_hash")
);
--> statement-breakpoint
CREATE TABLE "pcgl"."id_generation_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"prefix" varchar(50) NOT NULL,
	"padding_length" integer NOT NULL,
	"sequence_name" varchar(255) NOT NULL,
	"sequence_start" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "id_generation_config_sequence_name_unique" UNIQUE("sequence_name"),
	CONSTRAINT "id_generation_config_entity_name_field_name_unique" UNIQUE("entity_name","field_name")
);
--> statement-breakpoint
ALTER TABLE "pcgl"."generated_identifiers" ADD CONSTRAINT "generated_identifiers_config_id_id_generation_config_id_fk" FOREIGN KEY ("config_id") REFERENCES "pcgl"."id_generation_config"("id") ON DELETE no action ON UPDATE no action;