-- 0071 · the design studio's first record (T-M05-001a).
--
-- `design`: one design of a lead. `lead_id` is the one link to the CRM; the site a design is made
-- for stays the lead's own. `ordinal` is the N of "Design N", counted per lead by the server.
-- Tenant-scoped, all four: tenant_id, an index leading with it, a fail-closed policy, grants.
-- No DELETE grant: nothing removes a design yet.
--
-- `lead`: four nullable columns beside the site facts it already holds — the site's name, the
-- pin's two halves and the utility operator. Additive: a lead written before them reads with
-- none, and an app from before this release never sends them. No new grant (UPDATE is held).
CREATE TYPE "public"."design_mount" AS ENUM('roof', 'ground');--> statement-breakpoint
CREATE TYPE "public"."design_status" AS ENUM('draft');--> statement-breakpoint
CREATE TABLE "design" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"mount" "design_mount" NOT NULL,
	"status" "design_status" NOT NULL,
	"recommended" boolean NOT NULL,
	"duplicated_from" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"updated_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "design_ordinal_counts" CHECK ("design"."ordinal" >= 1)
);
--> statement-breakpoint
ALTER TABLE "design" ADD CONSTRAINT "design_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design" ADD CONSTRAINT "design_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design" ADD CONSTRAINT "design_duplicated_from_design_id_fk" FOREIGN KEY ("duplicated_from") REFERENCES "public"."design"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design" ADD CONSTRAINT "design_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design" ADD CONSTRAINT "design_updated_by_user_account_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "design_tenant_lead_idx" ON "design" USING btree ("tenant_id","lead_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "design_lead_ordinal_key" ON "design" USING btree ("tenant_id","lead_id","ordinal");--> statement-breakpoint
CREATE UNIQUE INDEX "design_one_recommended_per_lead_key" ON "design" USING btree ("tenant_id","lead_id") WHERE "design"."recommended";--> statement-breakpoint
CREATE UNIQUE INDEX "design_tenant_creation_key" ON "design" USING btree ("tenant_id","creation_key") WHERE "design"."creation_key" is not null;--> statement-breakpoint
ALTER TABLE "design" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "design" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "design_tenant" ON "design" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "design" TO app_user;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "site_name" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "site_latitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "site_longitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "site_utility" text;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_site_pin_whole" CHECK (("lead"."site_latitude" is null) = ("lead"."site_longitude" is null));--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_site_pin_on_globe" CHECK ("lead"."site_latitude" between -90 and 90 and "lead"."site_longitude" between -180 and 180);
