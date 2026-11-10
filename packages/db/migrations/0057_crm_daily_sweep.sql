-- 0057 · the CRM's one daily sweep (T-M02-015; RFC decision 7): one tenant table — the day each
-- company's 09:00 sweep ran.
--
-- Every CRM timer is one sweep at 09:00 tenant-local (M02-49): a Schedule every 15 minutes runs each
-- company once per local day after 09:00. The row for (company, local date) is the claim: the sweep
-- inserts it in the transaction that wakes, resurfaces, flags and escalates, so a second run that
-- day finds it and does nothing, and a sweep that fails leaves no row and runs again. The key IS the
-- pair, so the row needs no id of its own.
--
-- Tenant-scoped, all four always. SELECT and INSERT alone for app_user: a day's claim is never
-- changed or removed.
--
-- Additive only: a new table nothing older reads.
CREATE TABLE "crm_daily_sweep" (
	"tenant_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"ran_at" timestamp with time zone NOT NULL,
	CONSTRAINT "crm_daily_sweep_tenant_id_local_date_pk" PRIMARY KEY("tenant_id","local_date")
);
--> statement-breakpoint
ALTER TABLE "crm_daily_sweep" ADD CONSTRAINT "crm_daily_sweep_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "crm_daily_sweep" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "crm_daily_sweep" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "crm_daily_sweep_tenant" ON "crm_daily_sweep" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "crm_daily_sweep" TO app_user;
