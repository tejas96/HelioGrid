-- 0009 · quiet hours, per-user mutes, and when a push falls due (T-FPLAT-018):
-- one tenant-scoped table, one pgEnum, two columns on tenant and one on notification
-- (F6-11, F6-13, F6-14, F6-15).
--
-- Tenancy: notification_preference is TENANT-SCOPED, all four — tenant_id, an index leading with
-- it, a fail-closed policy for app_user, explicit grants. The unique key leads with tenant_id, so
-- the same person in two companies keeps two sets of preferences, which is what a per-tenant
-- setting means.
--
-- The grants are SELECT, INSERT and UPDATE ON push_muted ALONE. A person may switch their own
-- push on and off; no role may re-point a row at another person or another group, and there is no
-- DELETE grant because a row's absence and push_muted = false say the same thing and only one of
-- them needs a privilege.
--
-- A mute is the absence of a PUSH, never of a record: F6-06 makes the record the truth, so no
-- column here reaches the in-app half and none ever should. The rule that some groups may not be
-- muted at all is POLICY and lives in packages/domain — this table stores what was written, and
-- the read applies the rule again, because a person may mute billing and be made Owner afterwards.
--
-- notification.push_due_at is set at emit and never moved: the emit instant, or the end of the
-- tenant's quiet window where that held it. With push_sent_at beside it a sender asks one
-- question — due, and not yet sent — so no row can be in a state the pair does not describe, and
-- a third state vocabulary could only drift from the two. It needs no new grant: the INSERT grant
-- is table-wide and nothing updates the column.
--
-- tenant.quiet_hours_start / _end are NULLABLE, and NULL is not "unset": it means the MARKET's
-- default, which F6-14 explains as the hours outside the market's lawful calling window and which
-- packages/domain derives from the pack. So the number lives in exactly one place, a tenant that
-- has never opened the setting stores nothing, and this migration writes no policy number of its
-- own. The column-level UPDATE grant is what makes the window tenant-configurable; app_user holds
-- SELECT on tenant and nothing else, and this widens it by exactly two columns.
--
-- Not authored here: per-device push tokens and the sender that reads push_due_at (T-FPLAT-067,
-- which needs an external account decision); recipient resolution (T-FPLAT-066); the bounded
-- horizon and its purge (T-FPLAT-019).

CREATE TYPE "public"."notification_type_group" AS ENUM('sales', 'delivery', 'payments', 'team', 'billing');

ALTER TABLE "notification" ADD COLUMN "push_due_at" timestamp with time zone;

ALTER TABLE "tenant" ADD COLUMN "quiet_hours_start" time;
ALTER TABLE "tenant" ADD COLUMN "quiet_hours_end" time;
GRANT UPDATE ("quiet_hours_start", "quiet_hours_end") ON TABLE "tenant" TO app_user;

CREATE TABLE "notification_preference" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_ref" uuid NOT NULL,
	"type_group" "notification_type_group" NOT NULL,
	"push_muted" boolean NOT NULL
);

ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_ref_user_account_id_fk" FOREIGN KEY ("user_ref") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;

CREATE UNIQUE INDEX "notification_preference_tenant_user_group_key" ON "notification_preference" USING btree ("tenant_id","user_ref","type_group");

-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "notification_preference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_preference" FORCE ROW LEVEL SECURITY;
CREATE POLICY "notification_preference_tenant" ON "notification_preference" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "notification_preference" TO app_user;
GRANT UPDATE ("push_muted") ON TABLE "notification_preference" TO app_user;
