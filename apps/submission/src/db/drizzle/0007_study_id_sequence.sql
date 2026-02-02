CREATE SEQUENCE "pcgl"."study_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9999 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "pcgl"."study" ALTER COLUMN "study_id" SET DEFAULT 
	'PCGLST' || lpad(
		nextval('pcgl.study_id_seq')::text,
		4,
		'0'
	)
;