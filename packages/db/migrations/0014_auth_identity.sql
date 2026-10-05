-- 0014 · provider logins in their own table (T-M01-032 part c): one global table, one pgEnum, and
-- user_account.google_subject dropped.
--
-- A sign-in provider beside the phone (M01-02) is a value of login_provider, never a column on the
-- account: adding a provider adds an enum value and its token checker, and nothing here moves.
-- The primary key (provider, subject) links one login to one account; the unique
-- (user_account_id, provider) holds an account to one login per provider. The bind tells its two
-- refusals apart by these constraint names, so they are named, never generated.
--
-- Tenancy: auth_identity is UNREACHABLE — no grant to app_user; the admin path alone reads and
-- writes it, before any session exists (listed in GLOBAL_TABLES).
--
-- Release: the column is dropped in this one release, with no copy, by the owner's ruling at part
-- c's /start: nothing is deployed, the local database held 0 linked subjects, and no client called
-- the Google route yet. A deployed database would need expand, then contract.

CREATE TYPE "public"."login_provider" AS ENUM('google');
CREATE TABLE "auth_identity" (
	"user_account_id" uuid NOT NULL,
	"provider" "login_provider" NOT NULL,
	"subject" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_identity_provider_subject_pk" PRIMARY KEY("provider","subject"),
	CONSTRAINT "auth_identity_account_provider_unique" UNIQUE("user_account_id","provider")
);
ALTER TABLE "auth_identity" ADD CONSTRAINT "auth_identity_user_account_id_user_account_id_fk" FOREIGN KEY ("user_account_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_account" DROP CONSTRAINT "user_account_google_subject_unique";
ALTER TABLE "user_account" DROP COLUMN "google_subject";
