CREATE SEQUENCE "pcgl"."dac_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9999 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "pcgl"."dac" ALTER COLUMN "dac_id" SET DEFAULT 
	'PCGLDA' || lpad(
		nextval('pcgl.dac_id_seq')::text,
		4,
		'0'
	)
;--> statement-breakpoint
ALTER TABLE "pcgl"."dac" ADD CONSTRAINT "dac_dac_name_unique" UNIQUE("dac_name");