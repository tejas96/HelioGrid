-- 0018 · the orchestration outbox (T-M01-030 part b): one tenant table, the durable handoff from a
-- product change to a Temporal workflow (infra/temporal/README.md §5).
--
-- An event is written in the SAME transaction as the change it hands off; the api starts the
-- workflow after the commit, and the outbox-sweep schedule starts any it missed. The row id is the
-- event id and the workflow id is derived from it, so a retried dispatch joins the first run.
--
-- Tenant-scoped, all four always, and append-only for app_user: SELECT and INSERT alone. The
-- dispatcher reads and marks rows on the admin path (BYPASSRLS), never as a tenant session.
--
-- Additive only: a new table nothing older reads.

CREATE TABLE "orchestration_outbox" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"workflow" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"dispatched_at" timestamp with time zone
);

ALTER TABLE "orchestration_outbox" ADD CONSTRAINT "orchestration_outbox_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "orchestration_outbox_tenant_created_idx" ON "orchestration_outbox" USING btree ("tenant_id","created_at");
CREATE INDEX "orchestration_outbox_undispatched_idx" ON "orchestration_outbox" USING btree ("created_at") WHERE "orchestration_outbox"."dispatched_at" is null;
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "orchestration_outbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orchestration_outbox" FORCE ROW LEVEL SECURITY;
CREATE POLICY "orchestration_outbox_tenant" ON "orchestration_outbox" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT ON TABLE "orchestration_outbox" TO app_user;
