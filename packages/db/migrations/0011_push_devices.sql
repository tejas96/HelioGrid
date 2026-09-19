-- 0011 · the handsets a person is pushed on (T-FPLAT-067, F6-06, F6-13):
-- one global table and one pgEnum.
--
-- Tenancy: push_device is GLOBAL, and that is a decision rather than a convenience. A phone
-- belongs to a PERSON, not to a company. Tenant-scoping it would give someone who holds
-- memberships in two companies two rows for one handset, two pushes for one notification, and a
-- token whose uniqueness meant nothing. It keys user_account, the one home of a human, exactly
-- as `session` does.
--
-- UNREACHABLE — no grant to app_user; the admin path alone reads and writes it. That is the
-- shape `session` and `otp_challenge` already take for the same reason: a row keyed to a person
-- rather than to a tenant has no tenant pin to be filtered by, so the safe answer is that the
-- runtime role cannot touch it at all. Registration happens inside an authenticated request but
-- on the admin repository, which is how a session is written during sign-in.
--
-- `token` carries its own unique key. A handset that signs in again re-registers the SAME token,
-- and the write replaces rather than appends — so a person accumulates no duplicates and is
-- never pushed twice for one notification. A token the provider reports dead is DELETED: F6
-- §F6.2 is explicit that nothing retries, and the inbox loses nothing when a push does (F6-06).
--
-- `last_seen_at` exists so a later slice can retire handsets nobody has opened in months without
-- guessing which they were; nothing reads it yet and nothing here pretends otherwise.
--
-- Not authored here: the drain that sends a push the quiet window held (`deferred.md` — it needs
-- the owner's ruling on where a periodic job runs); delivery receipts; iOS delivery, which is
-- built but unprovable without a paid Apple membership and a handset.

CREATE TYPE "public"."push_platform" AS ENUM('ios', 'android');

CREATE TABLE "push_device" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_ref" uuid NOT NULL,
	"platform" "push_platform" NOT NULL,
	"token" text NOT NULL,
	"registered_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL
);

ALTER TABLE "push_device" ADD CONSTRAINT "push_device_user_ref_user_account_id_fk" FOREIGN KEY ("user_ref") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;

-- One row per token, product-wide: the upsert that registration performs targets this.
CREATE UNIQUE INDEX "push_device_token_key" ON "push_device" USING btree ("token");
-- The send reads every live handset a person has, in one lookup.
CREATE INDEX "push_device_user_idx" ON "push_device" USING btree ("user_ref");
