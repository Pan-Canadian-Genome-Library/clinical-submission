/**
    IMPORTANT NOTE: 
    
    This migration will NOT work if there are any existing foreign key violations.
    Please ensure rows in the study table reference an existant dac_id in the dac table 
    prior to running this migration,otherwise this migration will fail.
**/

ALTER TABLE "pcgl"."study" RENAME COLUMN "collaborator" TO "collaborators";--> statement-breakpoint
ALTER TABLE "pcgl"."study" ADD CONSTRAINT "dac_id_fk" FOREIGN KEY ("dac_id") REFERENCES "pcgl"."dac"("dac_id") ON DELETE no action ON UPDATE no action;