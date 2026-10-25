-- 0031 · who saved branding last (T-M01-018): the Branding page names the person and the date of
-- the save in force (SCR-M01-18). A row written before this column reads null and names the date
-- alone.
--
-- Additive only: a nullable column an older api never reads or writes.

ALTER TABLE "branding_settings" ADD COLUMN "updated_by" uuid;
ALTER TABLE "branding_settings" ADD CONSTRAINT "branding_settings_updated_by_user_account_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
