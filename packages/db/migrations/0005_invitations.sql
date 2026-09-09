-- 0005 · team invitations (T-M01-028): the phone-keyed invite and the presets it carries
-- (M01-12, M01-13, F2-21). Schema only — no row is inserted here; the send, the revoke and the
-- landing-side acts write through the application, and the accept — one membership and its
-- roles from one invitation — runs on the same explicit admin path as signup.
--
-- Tenancy: invitation and invitation_role are TENANT-SCOPED, all four — tenant_id, a composite
-- index leading with it, a fail-closed policy for app_user, explicit grants. The send and the
-- revoke ride the runtime pool under the policy, so invitation holds SELECT, INSERT and UPDATE
-- and invitation_role SELECT and INSERT; nothing deletes an invite — revocation and decline are
-- states. The accept writes tenant_membership and membership_role on the admin path, as signup
-- does, because the person holds no membership yet.
--
-- invitation_token_hash_key is deliberately GLOBAL, not led by tenant_id: the landing resolves a
-- link before any tenant is known, and the secret is 32 random bytes, so no two tenants can meet
-- on it. It is listed by name, with this reason, in the tenancy scan's GLOBAL_UNIQUES.
--
-- `expired` is a value the store never writes: a pending invitation past expires_at READS as
-- expired, so the row and the clock cannot disagree. The value exists so the enum mirrors the
-- one domain tuple the contract also derives from (the enum-parity invariant proves the pair).
--
-- The audit vocabulary grows with the slice that performs the act (Law 9): the three invite
-- acts a tenant's own people perform, and the invitation as a subject kind. Decline and the
-- re-invite request are the invited person's acts, who may hold no account yet, and are
-- recorded on the row itself.

ALTER TYPE "public"."audit_event_type" ADD VALUE 'team.invite_sent';
ALTER TYPE "public"."audit_event_type" ADD VALUE 'team.invite_revoked';
ALTER TYPE "public"."audit_event_type" ADD VALUE 'team.invite_accepted';
ALTER TYPE "public"."audit_subject_kind" ADD VALUE 'invitation';

CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired', 'revoked');

CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"inviter_user_id" uuid NOT NULL,
	"invitee_name" text NOT NULL,
	"invitee_phone_e164" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" "invitation_status" NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"declined_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"reinvite_requested_at" timestamp with time zone
);

CREATE TABLE "invitation_role" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"role_preset" "role_preset" NOT NULL
);

ALTER TABLE "invitation" ADD CONSTRAINT "invitation_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_user_id_user_account_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invitation_role" ADD CONSTRAINT "invitation_role_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invitation_role" ADD CONSTRAINT "invitation_role_invitation_id_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation"("id") ON DELETE no action ON UPDATE no action;

CREATE UNIQUE INDEX "invitation_token_hash_key" ON "invitation" USING btree ("token_hash");
CREATE INDEX "invitation_tenant_status_expires_idx" ON "invitation" USING btree ("tenant_id","status","expires_at");
CREATE INDEX "invitation_tenant_phone_idx" ON "invitation" USING btree ("tenant_id","invitee_phone_e164");
CREATE INDEX "invitation_tenant_sent_idx" ON "invitation" USING btree ("tenant_id","sent_at" DESC NULLS LAST);
CREATE UNIQUE INDEX "invitation_role_tenant_invitation_preset_key" ON "invitation_role" USING btree ("tenant_id","invitation_id","role_preset");
CREATE INDEX "invitation_role_invitation_idx" ON "invitation_role" USING btree ("invitation_id");

-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Every policy below renders exactly as the RLS checker's canonical list.
ALTER TABLE "invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitation" FORCE ROW LEVEL SECURITY;
CREATE POLICY "invitation_tenant" ON "invitation" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON TABLE "invitation" TO app_user;

ALTER TABLE "invitation_role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitation_role" FORCE ROW LEVEL SECURITY;
CREATE POLICY "invitation_role_tenant" ON "invitation_role" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "invitation_role" TO app_user;
