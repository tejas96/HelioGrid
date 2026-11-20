-- 0072 · the design document (T-M05-002a).
--
-- `design_document`: one stored document per design — the whole drawing, saved whole on each
-- change. `schema_version` names how `body` reads; `version` counts the saves, so a save made over
-- an older count is refused rather than merged (`F4-15`); 0 is a turn taken with nothing saved.
-- `saved_opening` is the studio opening that made the last save: a save whose answer was lost
-- knows its own, and the same person's save on another device is a conflict like any other.
-- `editor_id` holds the design's turn to edit until `editor_until`: one editor at a time, and a
-- turn no studio renews runs out by itself.
-- Tenant-scoped, all four: tenant_id, an index leading with it, a fail-closed policy, grants.
-- No DELETE grant: a design and its document are never removed yet.
CREATE TABLE "design_document" (
	"design_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"schema_version" integer NOT NULL,
	"body" jsonb NOT NULL,
	"version" integer NOT NULL,
	"saved_at" timestamp with time zone,
	"saved_by" uuid,
	"saved_opening" uuid,
	"editor_id" uuid,
	"editor_until" timestamp with time zone,
	CONSTRAINT "design_document_body_is_object" CHECK (jsonb_typeof("design_document"."body") = 'object'),
	CONSTRAINT "design_document_version_counts" CHECK ("design_document"."version" >= 0),
	CONSTRAINT "design_document_saved_whole" CHECK (("design_document"."saved_at" is null) = ("design_document"."saved_by" is null)),
	CONSTRAINT "design_document_turn_whole" CHECK (("design_document"."editor_id" is null) = ("design_document"."editor_until" is null))
);
--> statement-breakpoint
ALTER TABLE "design_document" ADD CONSTRAINT "design_document_design_id_design_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."design"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_document" ADD CONSTRAINT "design_document_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_document" ADD CONSTRAINT "design_document_saved_by_user_account_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_document" ADD CONSTRAINT "design_document_editor_id_user_account_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "design_document_tenant_idx" ON "design_document" USING btree ("tenant_id","design_id");--> statement-breakpoint
ALTER TABLE "design_document" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "design_document" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "design_document_tenant" ON "design_document" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "design_document" TO app_user;
