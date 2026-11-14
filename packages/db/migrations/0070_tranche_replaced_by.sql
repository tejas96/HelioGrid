-- The earlier payment plan stays readable (`T-M06-025`, `M11-14`): a part a newer version replaced
-- names who put that version in force and the version in force it belonged to, so the project's
-- payments read can show each earlier plan under its version, with when and by whom it was replaced.
--
-- Additive: two nullable columns. A part replaced before them reads with neither — its plan is
-- shown with no version and no person, never a made-up one. No new grant (UPDATE is held already).
ALTER TABLE "project_tranche" ADD COLUMN "replaced_by" uuid;--> statement-breakpoint
ALTER TABLE "project_tranche" ADD COLUMN "replaced_version_id" uuid;--> statement-breakpoint
ALTER TABLE "project_tranche" ADD CONSTRAINT "project_tranche_replaced_by_user_account_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
