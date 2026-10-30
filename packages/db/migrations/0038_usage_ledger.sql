-- 0038 · the usage ledger (T-M12-010): one append-only row per metered unit (M12-32, M12-33,
-- M12-37) and the nightly storage gauge (M12-33, BM-20).
--
-- Both tables are tenant-scoped, all four; app_user holds SELECT alone. Their writers are the
-- outbox step and the nightly step, both on the admin path. Both are append-only ledgers
-- (append-only-ledgers.ts).
--
-- Additive only: two new tables and one new enum that no older reader is handed.
CREATE TYPE "public"."usage_meter" AS ENUM('voice_minutes', 'ai_roof_detections', 'marketing_sends', 'tracked_field_seats', 'otp_delivery', 'field_location_ingestion', 'solar_imagery', 'ai_extraction', 'speech');--> statement-breakpoint
CREATE TABLE "storage_gauge_snapshot" (
	"tenant_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"gauge_bytes" bigint NOT NULL,
	"taken_at" timestamp with time zone NOT NULL,
	CONSTRAINT "storage_gauge_snapshot_tenant_id_snapshot_date_pk" PRIMARY KEY("tenant_id","snapshot_date"),
	CONSTRAINT "storage_gauge_snapshot_bytes_whole" CHECK ("storage_gauge_snapshot"."gauge_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "usage_event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"meter" "usage_meter" NOT NULL,
	"quantity" bigint NOT NULL,
	"billable" boolean NOT NULL,
	"subject_kind" "subject_kind" NOT NULL,
	"subject_ref" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"period_key" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "usage_event_quantity_positive" CHECK ("usage_event"."quantity" >= 1),
	CONSTRAINT "usage_event_bills_a_billed_meter" CHECK (not "usage_event"."billable" or "usage_event"."meter" in ('voice_minutes', 'ai_roof_detections', 'marketing_sends', 'tracked_field_seats')),
	CONSTRAINT "usage_event_period_key_month" CHECK ("usage_event"."period_key" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
ALTER TABLE "storage_gauge_snapshot" ADD CONSTRAINT "storage_gauge_snapshot_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "usage_event_tenant_idempotency_key" ON "usage_event" USING btree ("tenant_id","meter","idempotency_key","period_key");--> statement-breakpoint
CREATE INDEX "usage_event_tenant_meter_occurred_idx" ON "usage_event" USING btree ("tenant_id","meter","occurred_at");--> statement-breakpoint
ALTER TABLE "usage_event" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usage_event" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "usage_event_tenant" ON "usage_event" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "usage_event" TO app_user;--> statement-breakpoint
ALTER TABLE "storage_gauge_snapshot" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "storage_gauge_snapshot" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "storage_gauge_snapshot_tenant" ON "storage_gauge_snapshot" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT ON TABLE "storage_gauge_snapshot" TO app_user;
