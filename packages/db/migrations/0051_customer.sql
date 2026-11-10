-- 0051 · the customer and the people on it (T-M02-007, T-M02-008, T-M02-016; RFC decisions 2, 3,
-- 4, 17, 18): four tenant tables and one pgEnum — the phone-identified customer, the role labels a
-- company gives its contacts, the contacts, and the link a deliberate duplicate leaves.
--
-- Phone is the identity, not a unique key (M02-02, M02-12): Keep both lands a second customer with
-- the same number, so `(tenant_id, phone_e164)` is a plain index. It is `text_pattern_ops`, so the
-- one index answers the dedupe's exact match and search's prefix match: a tenant holds one market,
-- so a national-number prefix is its calling code plus the digits typed, and no national column is
-- stored beside the number it derives from.
--
-- Search over name and city is a generated `simple` tsvector with a GIN index (pg_trgm needs
-- CREATE on the database, which the migration role does not hold — 0015). GIN cannot lead with
-- tenant_id without btree_gin, for the same reason; the RLS predicate scopes it.
--
-- The customer is their own default primary contact (decision 3): primary_contact_id null means
-- the customer, set it names one of THEIR contacts — the key is (tenant_id, id, primary_contact_id)
-- onto contact's (tenant_id, customer_id, id), so a contact of another customer cannot be named.
-- A merge clears the loser's primary before it re-points that loser's contacts.
--
-- Do-not-call and the wrong-number block are the moment they were set (M02-37's V1 ruling, M02-44):
-- set means on, null means off, so no boolean is stored beside the instant it derives from.
-- preferred_language is the product's language set: the product only ever addresses a customer in a
-- language it has.
--
-- A merged customer is a tombstone (M02-60): merged_into, merged_at and merged_by are set together
-- and the row is never deleted.
--
-- contact_role_label is a seed key (the three every company starts with, whose words are catalog
-- copy) or a company's own plain text, never both. The seeds are written here for every company
-- that exists; tenant creation writes them for each new one.
--
-- duplicate_link pairs two customers (T-M02-008's grain ruling); only Keep both writes one, with
-- its mandatory reason, and a merge resolves it.
--
-- Tenant-scoped, all four always. SELECT, INSERT and UPDATE for app_user on customer, contact and
-- duplicate_link (edits, and the merge's re-pointing and tombstone); SELECT and INSERT on
-- contact_role_label (no rename or retirement is specified). No DELETE: a customer is never deleted,
-- and neither is what points at one.
--
-- Additive only: new tables and a new type nothing older reads.
CREATE TYPE "public"."contact_role_seed" AS ENUM('decision_maker', 'landlord', 'spouse');--> statement-breakpoint
CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"phone_e164" text NOT NULL,
	"name" text,
	"city" text,
	"preferred_language" "ui_language",
	"do_not_call_set_at" timestamp with time zone,
	"do_not_call_set_by" uuid,
	"wrong_number_at" timestamp with time zone,
	"primary_contact_id" uuid,
	"merged_into" uuid,
	"merged_at" timestamp with time zone,
	"merged_by" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"search" tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("city", ''))) STORED,
	CONSTRAINT "customer_do_not_call_names_its_setter" CHECK (("customer"."do_not_call_set_at" is null) = ("customer"."do_not_call_set_by" is null)),
	CONSTRAINT "customer_merge_is_whole" CHECK (("customer"."merged_into" is null) = ("customer"."merged_at" is null) and ("customer"."merged_at" is null) = ("customer"."merged_by" is null)),
	CONSTRAINT "customer_never_merged_into_itself" CHECK ("customer"."merged_into" <> "customer"."id")
);
--> statement-breakpoint
CREATE TABLE "contact_role_label" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"seed_key" "contact_role_seed",
	"label" text,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "contact_role_label_seed_or_text" CHECK (("contact_role_label"."seed_key" is null) <> ("contact_role_label"."label" is null)),
	CONSTRAINT "contact_role_label_text_given" CHECK (char_length(btrim("contact_role_label"."label")) >= 1)
);
--> statement-breakpoint
CREATE TABLE "contact" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone_e164" text NOT NULL,
	"role_label_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "contact_tenant_customer_id_key" UNIQUE("tenant_id","customer_id","id")
);
--> statement-breakpoint
CREATE TABLE "duplicate_link" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_a_id" uuid NOT NULL,
	"customer_b_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "duplicate_link_two_customers" CHECK ("duplicate_link"."customer_a_id" <> "duplicate_link"."customer_b_id"),
	CONSTRAINT "duplicate_link_reason_given" CHECK (char_length(btrim("duplicate_link"."reason")) >= 1)
);
--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_do_not_call_set_by_user_account_id_fk" FOREIGN KEY ("do_not_call_set_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_merged_into_customer_id_fk" FOREIGN KEY ("merged_into") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_merged_by_user_account_id_fk" FOREIGN KEY ("merged_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_role_label" ADD CONSTRAINT "contact_role_label_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_role_label" ADD CONSTRAINT "contact_role_label_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_role_label_id_contact_role_label_id_fk" FOREIGN KEY ("role_label_id") REFERENCES "public"."contact_role_label"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_primary_contact_is_own_fk" FOREIGN KEY ("tenant_id","id","primary_contact_id") REFERENCES "public"."contact"("tenant_id","customer_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_link" ADD CONSTRAINT "duplicate_link_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_link" ADD CONSTRAINT "duplicate_link_customer_a_id_customer_id_fk" FOREIGN KEY ("customer_a_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_link" ADD CONSTRAINT "duplicate_link_customer_b_id_customer_id_fk" FOREIGN KEY ("customer_b_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_link" ADD CONSTRAINT "duplicate_link_created_by_user_account_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_tenant_phone_idx" ON "customer" USING btree ("tenant_id","phone_e164" text_pattern_ops);--> statement-breakpoint
CREATE INDEX "customer_tenant_merged_into_idx" ON "customer" USING btree ("tenant_id","merged_into") WHERE "customer"."merged_into" is not null;--> statement-breakpoint
CREATE INDEX "customer_search_idx" ON "customer" USING gin ("search");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_role_label_tenant_seed_key" ON "contact_role_label" USING btree ("tenant_id","seed_key") WHERE "contact_role_label"."seed_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_role_label_tenant_label_key" ON "contact_role_label" USING btree ("tenant_id","label") WHERE "contact_role_label"."label" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_role_label_tenant_creation_key" ON "contact_role_label" USING btree ("tenant_id","creation_key") WHERE "contact_role_label"."creation_key" is not null;--> statement-breakpoint
CREATE INDEX "contact_tenant_phone_idx" ON "contact" USING btree ("tenant_id","phone_e164" text_pattern_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "contact_tenant_creation_key" ON "contact" USING btree ("tenant_id","creation_key") WHERE "contact"."creation_key" is not null;--> statement-breakpoint
CREATE INDEX "duplicate_link_tenant_customer_a_idx" ON "duplicate_link" USING btree ("tenant_id","customer_a_id");--> statement-breakpoint
CREATE INDEX "duplicate_link_tenant_customer_b_idx" ON "duplicate_link" USING btree ("tenant_id","customer_b_id");--> statement-breakpoint
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. Each policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "customer" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "customer_tenant" ON "customer" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "customer" TO app_user;--> statement-breakpoint
ALTER TABLE "contact_role_label" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact_role_label" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "contact_role_label_tenant" ON "contact_role_label" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "contact_role_label" TO app_user;--> statement-breakpoint
ALTER TABLE "contact" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "contact_tenant" ON "contact" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "contact" TO app_user;--> statement-breakpoint
ALTER TABLE "duplicate_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "duplicate_link" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "duplicate_link_tenant" ON "duplicate_link" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "duplicate_link" TO app_user;--> statement-breakpoint
-- The three labels every company starts with (M02-34), for every company that exists. A migration
-- has no app-side UUIDv7, so these ids come from gen_random_uuid() (as 0034's do).
INSERT INTO "contact_role_label" ("id", "tenant_id", "seed_key", "created_at")
SELECT gen_random_uuid(), "tenant"."id", "seed"."key", now()
FROM "tenant" CROSS JOIN unnest(enum_range(NULL::"contact_role_seed")) AS "seed"("key");
