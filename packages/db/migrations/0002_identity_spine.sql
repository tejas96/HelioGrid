-- 0002 · the identity spine (T-M01-025): the account, the tenant, the sign-in code, the
-- session, the membership and its roles. Schema only — no row is inserted here; the company
-- signup and the OTP flow write through the application on the admin path.
--
-- Tenancy, table by table:
--   tenant           ARMED — RLS enabled and forced, one SELECT policy on the row's own id; a
--                    member reads its own company. INSERT is never granted to app_user: signup
--                    crosses tenancy and runs on the admin path.
--   user_account     ARMED — RLS enabled and forced, one SELECT policy: the row is visible to a
--                    session whose tenant holds a membership on it, so the roster and every
--                    picker read names under RLS. Every write runs on the admin path.
--   otp_challenge    UNREACHABLE — no grant to app_user; the admin path alone.
--   session          UNREACHABLE — no grant to app_user; the admin path alone.
--   tenant_membership TENANT-SCOPED, all four: tenant_id, a composite index leading with it, a
--                    fail-closed policy for app_user, explicit grants (SELECT, UPDATE).
--   membership_role  TENANT-SCOPED, all four (SELECT); the role-change writes are a later slice's.
-- Every pgEnum mirrors a domain tuple; the enum-parity invariant proves the pairs equal.

CREATE TYPE "public"."measurement_system" AS ENUM('metric', 'imperial');
CREATE TYPE "public"."membership_status" AS ENUM('invited', 'active', 'deactivated');
CREATE TYPE "public"."otp_channel" AS ENUM('sms', 'voice');
CREATE TYPE "public"."platform_kind" AS ENUM('web', 'mobile');
CREATE TYPE "public"."role_preset" AS ENUM('epc_owner', 'sales_manager', 'sales_executive', 'survey_engineer', 'design_engineer', 'project_manager', 'field_technician', 'installation_team_member', 'hr_admin', 'finance', 'operations', 'marketing');
CREATE TYPE "public"."tenant_segment" AS ENUM('residential', 'ci', 'both');
CREATE TYPE "public"."ui_language" AS ENUM('en', 'hi', 'mr');

CREATE TABLE "user_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"phone_e164" text NOT NULL,
	"name" text,
	"google_subject" text,
	"interface_language" "ui_language" NOT NULL,
	"unit_preference" "measurement_system" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_account_phone_e164_unique" UNIQUE("phone_e164"),
	CONSTRAINT "user_account_google_subject_unique" UNIQUE("google_subject")
);

CREATE TABLE "tenant" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"city" text NOT NULL,
	"market_code" text NOT NULL,
	"currency_code" text NOT NULL,
	"default_language" "ui_language" NOT NULL,
	"timezone" text NOT NULL,
	"segment" "tenant_segment",
	"typical_system_kwp" numeric(8, 2),
	"created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "otp_challenge" (
	"id" uuid PRIMARY KEY NOT NULL,
	"phone_e164" text NOT NULL,
	"code_hash" text NOT NULL,
	"channel" "otp_channel" NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"failed_verifies" integer NOT NULL,
	"verified_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"delivery_failed_at" timestamp with time zone
);

CREATE TABLE "session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_account_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"platform_kind" "platform_kind" NOT NULL,
	"active_tenant_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"last_foreground_activity_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "session_token_hash_unique" UNIQUE("token_hash")
);

CREATE TABLE "tenant_membership" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_account_id" uuid NOT NULL,
	"status" "membership_status" NOT NULL,
	"last_active_at" timestamp with time zone,
	"coach_marks_dismissed" smallint NOT NULL,
	"authorization_version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "tenant_membership_coach_marks_range" CHECK ("tenant_membership"."coach_marks_dismissed" between 0 and 3)
);

CREATE TABLE "membership_role" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"role_preset" "role_preset" NOT NULL
);

ALTER TABLE "tenant" ADD CONSTRAINT "tenant_market_code_market_pack_market_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."market_pack"("market_code") ON DELETE no action ON UPDATE no action;
ALTER TABLE "session" ADD CONSTRAINT "session_user_account_id_user_account_id_fk" FOREIGN KEY ("user_account_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "session" ADD CONSTRAINT "session_active_tenant_id_tenant_id_fk" FOREIGN KEY ("active_tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tenant_membership" ADD CONSTRAINT "tenant_membership_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tenant_membership" ADD CONSTRAINT "tenant_membership_user_account_id_user_account_id_fk" FOREIGN KEY ("user_account_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "membership_role" ADD CONSTRAINT "membership_role_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "membership_role" ADD CONSTRAINT "membership_role_membership_id_tenant_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."tenant_membership"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "tenant_company_name_city_idx" ON "tenant" USING btree (lower("company_name"),lower("city"));
CREATE INDEX "otp_challenge_phone_issued_idx" ON "otp_challenge" USING btree ("phone_e164","issued_at" DESC NULLS LAST);
CREATE INDEX "session_user_account_idx" ON "session" USING btree ("user_account_id");
CREATE UNIQUE INDEX "tenant_membership_tenant_user_key" ON "tenant_membership" USING btree ("tenant_id","user_account_id");
CREATE INDEX "tenant_membership_tenant_status_active_idx" ON "tenant_membership" USING btree ("tenant_id","status","last_active_at");
CREATE INDEX "tenant_membership_user_account_idx" ON "tenant_membership" USING btree ("user_account_id");
CREATE UNIQUE INDEX "membership_role_tenant_membership_preset_key" ON "membership_role" USING btree ("tenant_id","membership_id","role_preset");
CREATE INDEX "membership_role_tenant_preset_idx" ON "membership_role" USING btree ("tenant_id","role_preset");
CREATE INDEX "membership_role_membership_idx" ON "membership_role" USING btree ("membership_id");

-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Every policy below renders exactly as the RLS checker's canonical list.
ALTER TABLE "tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_own_row" ON "tenant" FOR SELECT TO app_user
	USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT ON TABLE "tenant" TO app_user;

ALTER TABLE "user_account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_account" FORCE ROW LEVEL SECURITY;
CREATE POLICY "user_account_tenant_members" ON "user_account" FOR SELECT TO app_user
	USING (EXISTS (
		SELECT 1 FROM "tenant_membership" m
		WHERE m.user_account_id = "user_account".id
		  AND m.tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid));
GRANT SELECT ON TABLE "user_account" TO app_user;

ALTER TABLE "tenant_membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_membership" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_membership_tenant" ON "tenant_membership" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, UPDATE ON TABLE "tenant_membership" TO app_user;

ALTER TABLE "membership_role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membership_role" FORCE ROW LEVEL SECURITY;
CREATE POLICY "membership_role_tenant" ON "membership_role" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT ON TABLE "membership_role" TO app_user;
