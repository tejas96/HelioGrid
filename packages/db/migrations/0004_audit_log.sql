-- 0004 · the append-only audit log (T-FPLAT-004): one tenant-scoped table recording what the
-- product performed — who, what, when, and whether the act was refused (F2-22, F2-23, F2-24).
--
-- Tenancy: audit_log_entry is TENANT-SCOPED, all four — tenant_id, a composite index leading
-- with it, a fail-closed policy for app_user, explicit grants.
--
-- The grants are SELECT and INSERT ALONE. No role holds UPDATE or DELETE on this table, so
-- append-only is a privilege the database enforces rather than a discipline the code keeps.
--
-- actor_ref and subject_ref carry NO foreign key on purpose: an entry outlives the row it
-- records, attribution survives a deactivation forever (F2-20), and a platform-staff actor
-- (F2-24) holds no membership in the tenant whose log they appear in.
--
-- The event vocabulary is CLOSED to F2-22's covered-events checklist and holds only the acts
-- that exist today; a module appends its own value with its own migration when its slice lands
-- (Law 9). No analytics event is ever a value here. Every pgEnum mirrors a domain tuple; the
-- enum-parity invariant proves the pairs equal.
--
-- Not authored here, and each for its own reason: retention_tier and the archive tier after 24
-- months hot (its own task, when the first entry ages out); sender_name (T-M11-009's, with the
-- payment-request send it records).

CREATE TYPE "public"."audit_actor_kind" AS ENUM('tenant_user', 'platform_staff');
CREATE TYPE "public"."audit_event_type" AS ENUM('auth.signed_in', 'auth.signed_out', 'auth.signed_out_everywhere', 'team.roles_changed', 'team.member_deactivated');
CREATE TYPE "public"."audit_subject_kind" AS ENUM('user_account', 'tenant_membership');

CREATE TABLE "audit_log_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" "audit_event_type" NOT NULL,
	"actor_kind" "audit_actor_kind" NOT NULL,
	"actor_ref" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"blocked" boolean NOT NULL,
	"subject_kind" "audit_subject_kind" NOT NULL,
	"subject_ref" uuid NOT NULL,
	"change_payload" jsonb
);

ALTER TABLE "audit_log_entry" ADD CONSTRAINT "audit_log_entry_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "audit_log_entry_tenant_occurred_idx" ON "audit_log_entry" USING btree ("tenant_id","occurred_at" DESC NULLS LAST);

-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "audit_log_entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log_entry" FORCE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_entry_tenant" ON "audit_log_entry" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "audit_log_entry" TO app_user;
