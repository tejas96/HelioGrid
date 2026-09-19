-- 0010 · the quiet window moves to its own tenant-scoped table (T-FPLAT-018, F6-14).
--
-- WHAT 0009 GOT WRONG, and why this is forward-only. 0009 put quiet_hours_start/_end on `tenant`
-- and granted app_user column-level UPDATE on them. The grant was necessary and not sufficient:
-- `tenant`'s policy is tenant_own_row FOR SELECT (0002), so an update by app_user matches no row
-- and silently changes nothing — which is precisely why every tenant-EDITABLE setting in this
-- schema already lives in its own tenant-scoped table rather than on the tenant row. Migrations
-- are append-only (M19), so the columns are dropped here rather than edited away there.
--
-- Tenancy: notification_settings is TENANT-SCOPED, all four — tenant_id, a unique key that is
-- also the index and leads with it, a fail-closed policy for app_user, explicit grants. One row
-- per company, and its ABSENCE is the market's default: F6-14's default is the hours outside the
-- market's lawful calling window, derived from the pack in packages/domain, so no number is
-- written here and a company that never set a window stores nothing.
--
-- The grants are SELECT, INSERT and UPDATE on the two columns alone: a company sets its own
-- window and nothing else about the row.

ALTER TABLE "tenant" DROP COLUMN "quiet_hours_start";
ALTER TABLE "tenant" DROP COLUMN "quiet_hours_end";

CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"quiet_hours_start" time NOT NULL,
	"quiet_hours_end" time NOT NULL
);

ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;

CREATE UNIQUE INDEX "notification_settings_tenant_key" ON "notification_settings" USING btree ("tenant_id");

-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "notification_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_settings" FORCE ROW LEVEL SECURITY;
CREATE POLICY "notification_settings_tenant" ON "notification_settings" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "notification_settings" TO app_user;
GRANT UPDATE ("quiet_hours_start", "quiet_hours_end") ON TABLE "notification_settings" TO app_user;
