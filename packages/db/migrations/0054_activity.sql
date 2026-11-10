-- 0054 · the timeline (T-M02-012; RFC decisions 13, 17): one append-only tenant table and two
-- pgEnums — every entry of the one stream a customer and their leads show (M02-35).
--
-- An entry is anchored on its customer, with an optional lead (T-M02-012's ruling). Its order is
-- `sequence`, an identity the database alone numbers in apply order (`F4-19`); `captured_at` is when
-- the device captured it, shown and never sorted by. `body` is the kind's envelope, parsed in domain;
-- a kind an older app does not know renders as a plain system entry, so the kind set grows by
-- ADD VALUE and never breaks a reader.
--
-- actor_ref carries no foreign key, as the audit log's does not: an entry outlives the row it names,
-- and the agent and the customer are actors with no account. A person's entry names that person.
--
-- A merge changes no entry (decision 17): the survivor's stream is every entry whose customer is
-- the survivor or a customer merged into it, read through `customer.merged_into`.
--
-- Tenant-scoped, all four always. SELECT and INSERT ALONE for app_user — no role holds UPDATE,
-- DELETE or TRUNCATE — and it joins `append-only-ledgers.ts`. A correction is a new entry.
--
-- Additive only: a new table and new types nothing older reads.
CREATE TYPE "public"."activity_kind" AS ENUM('lead_created', 'note', 'call', 'enquiry', 'stage_change', 'state_change', 'assignment', 'field_change', 'duplicate_kept', 'referral', 'message_copied', 'visit_booked', 'visit_rescheduled', 'task_done', 'customer_merged');--> statement-breakpoint
CREATE TYPE "public"."activity_actor" AS ENUM('person', 'agent', 'system', 'customer');--> statement-breakpoint
CREATE TABLE "activity" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sequence" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
	"customer_id" uuid NOT NULL,
	"lead_id" uuid,
	"kind" "activity_kind" NOT NULL,
	"actor_kind" "activity_actor" NOT NULL,
	"actor_ref" uuid,
	"captured_at" timestamp with time zone NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"body" jsonb NOT NULL,
	CONSTRAINT "activity_person_is_named" CHECK ("activity"."actor_kind" <> 'person' or "activity"."actor_ref" is not null),
	CONSTRAINT "activity_body_is_object" CHECK (jsonb_typeof("activity"."body") = 'object')
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_tenant_customer_sequence_idx" ON "activity" USING btree ("tenant_id","customer_id","sequence" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activity_tenant_lead_sequence_idx" ON "activity" USING btree ("tenant_id","lead_id","sequence" DESC NULLS LAST) WHERE "activity"."lead_id" is not null;--> statement-breakpoint
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
-- The ledger: SELECT and INSERT alone — no role holds UPDATE or DELETE (M02-35).
ALTER TABLE "activity" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "activity_tenant" ON "activity" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "activity" TO app_user;
