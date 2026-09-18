-- 0008 · the notification type registry and the record that is the truth (T-FPLAT-017):
-- one tenant-scoped table and one pgEnum (F6-02, F6-05, F6-06, F6-07, F6-08, F6-09).
--
-- Tenancy: notification is TENANT-SCOPED, all four — tenant_id, a composite index leading with
-- it, a fail-closed policy for app_user, explicit grants.
--
-- The grants are SELECT, INSERT and UPDATE ON read_at ALONE. A column-level UPDATE grant is what
-- makes F6-07 true: no role can change the type, the subject, the words or the emit time of a
-- record that was already delivered, and read state is the one thing that may move. The writer
-- sets it only WHERE read_at IS NULL, so it is set once and travels up only — nothing un-reads.
--
-- subject_kind and subject_ref are NOT NULL, both. F6-02 says a notification points at a real
-- record and is never a dead announcement, so it is unwritable rather than discouraged; the one
-- type with no record of its own is `system`, whose subject is the tenant it addresses.
--
-- recipient_user_ref KEYS user_account, unlike the audit log's actor_ref: an entry records a
-- person who may be gone, a notification is addressed to one who must be there. It carries no key
-- to the membership — a membership can be deactivated, and the pair with tenant_id is that
-- membership anyway.
--
-- The type vocabulary is COMPLETE from day one and forward-compatible (F6-05's own words), which
-- is the one place Law 9's grow-with-the-slice is overridden. It mirrors domain's tuple; the
-- enum-parity invariant proves the pair equal.
--
-- Not authored here, each for its own reason: push tokens and the held push, quiet hours and
-- per-user mutes (T-FPLAT-018, with the delivery rows); the bounded horizon and its purge
-- (T-FPLAT-019); the per-type copy, which the slice that first raises each type authors.

CREATE TYPE "public"."notification_type" AS ENUM('proposal_opened', 'agent_escalation', 'follow_up_due', 'survey_submitted', 'design_returned', 'signoff_requested', 'payment_due', 'lead_unassigned_24h', 'system');

CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recipient_user_ref" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"subject_kind" "subject_kind" NOT NULL,
	"subject_ref" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"language" "ui_language" NOT NULL,
	"emitted_at" timestamp with time zone NOT NULL,
	"read_at" timestamp with time zone,
	"push_sent_at" timestamp with time zone
);

ALTER TABLE "notification" ADD CONSTRAINT "notification_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_user_ref_user_account_id_fk" FOREIGN KEY ("recipient_user_ref") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "notification_tenant_recipient_emitted_idx" ON "notification" USING btree ("tenant_id","recipient_user_ref","emitted_at" DESC NULLS LAST);

-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification" FORCE ROW LEVEL SECURITY;
CREATE POLICY "notification_tenant" ON "notification" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "notification" TO app_user;
GRANT UPDATE ("read_at") ON TABLE "notification" TO app_user;
