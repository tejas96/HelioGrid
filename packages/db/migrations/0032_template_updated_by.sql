-- 0032 · who saved the proposal and timeline templates last (T-M01-019): the Proposal template
-- page names the person and the date of the save in force (SCR-M01-19). A row written before this
-- column reads null and names the date alone.
--
-- Additive only: nullable columns an older api never reads or writes.

ALTER TABLE "proposal_template_settings" ADD COLUMN "updated_by" uuid;
ALTER TABLE "timeline_template" ADD COLUMN "updated_by" uuid;
ALTER TABLE "proposal_template_settings" ADD CONSTRAINT "proposal_template_settings_updated_by_user_account_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "timeline_template" ADD CONSTRAINT "timeline_template_updated_by_user_account_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
