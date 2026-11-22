-- 0074 · a design's own picture (T-M05-002d).
--
-- `design_picture`: a photo, a drone map or a plan kept with a design, its file name and what the
-- file said of itself. It never changes: a newer file is a new row. A CAD plan our server reads is
-- `reading` until the read ends, `ready` or `refused` — its one UPDATE. Tenant-scoped, all four;
-- SELECT, INSERT, UPDATE for `app_user`. No DELETE: a removed picture stays for Undo.
--
-- `design_picture_file`: the picture's stored parts — JPEG pieces with the box each covers, and
-- one page's plan lines. Tenant-scoped, all four; SELECT and INSERT for `app_user`.
--
-- `subject_kind` grows `design` (a picture's files are stored against its design) and
-- `design_picture` (the lines our server reads are kept against the picture). The file types grow
-- a plan's lines (JSON) and the CAD plans our server reads (DWG, binary DXF). Additive: no row
-- written before reads differently, and an app from before this release never names them.
CREATE TYPE "public"."design_picture_file_role" AS ENUM('piece', 'lines');--> statement-breakpoint
CREATE TYPE "public"."design_picture_kind" AS ENUM('photo', 'drone', 'plan');--> statement-breakpoint
CREATE TYPE "public"."design_picture_refusal" AS ENUM('broken', 'no_lines');--> statement-breakpoint
CREATE TYPE "public"."design_picture_state" AS ENUM('reading', 'ready', 'refused');--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'design';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'design_picture';--> statement-breakpoint
CREATE TABLE "design_picture" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"design_id" uuid NOT NULL,
	"kind" "design_picture_kind" NOT NULL,
	"name" text NOT NULL,
	"state" "design_picture_state" NOT NULL,
	"refusal" "design_picture_refusal",
	"facts" jsonb,
	"source_file_id" uuid,
	"added_at" timestamp with time zone NOT NULL,
	"added_by" uuid NOT NULL,
	"creation_key" uuid,
	"creation_fingerprint" text,
	CONSTRAINT "design_picture_name_given" CHECK (length("design_picture"."name") between 1 and 200),
	CONSTRAINT "design_picture_facts_is_object" CHECK ("design_picture"."facts" is null or jsonb_typeof("design_picture"."facts") = 'object'),
	CONSTRAINT "design_picture_state_whole" CHECK (("design_picture"."state" = 'ready') = ("design_picture"."facts" is not null) and ("design_picture"."state" = 'refused') = ("design_picture"."refusal" is not null)),
	CONSTRAINT "design_picture_read_on_server_is_a_plan" CHECK ("design_picture"."source_file_id" is null or "design_picture"."kind" = 'plan')
);
--> statement-breakpoint
CREATE TABLE "design_picture_file" (
	"picture_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"page" integer NOT NULL,
	"role" "design_picture_file_role" NOT NULL,
	"box_west" double precision,
	"box_south" double precision,
	"box_east" double precision,
	"box_north" double precision,
	CONSTRAINT "design_picture_file_picture_id_file_id_pk" PRIMARY KEY("picture_id","file_id"),
	CONSTRAINT "design_picture_file_page_counts" CHECK ("design_picture_file"."page" >= 1),
	CONSTRAINT "design_picture_file_box_whole" CHECK (("design_picture_file"."role" = 'piece') = ("design_picture_file"."box_west" is not null) and ("design_picture_file"."box_west" is null) = ("design_picture_file"."box_south" is null) and ("design_picture_file"."box_west" is null) = ("design_picture_file"."box_east" is null) and ("design_picture_file"."box_west" is null) = ("design_picture_file"."box_north" is null))
);
--> statement-breakpoint
ALTER TABLE "file" DROP CONSTRAINT "file_content_type_known";--> statement-breakpoint
ALTER TABLE "design_picture" ADD CONSTRAINT "design_picture_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_picture" ADD CONSTRAINT "design_picture_design_id_design_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."design"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_picture" ADD CONSTRAINT "design_picture_source_file_id_file_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_picture" ADD CONSTRAINT "design_picture_added_by_user_account_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_picture_file" ADD CONSTRAINT "design_picture_file_picture_id_design_picture_id_fk" FOREIGN KEY ("picture_id") REFERENCES "public"."design_picture"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_picture_file" ADD CONSTRAINT "design_picture_file_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_picture_file" ADD CONSTRAINT "design_picture_file_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "design_picture_tenant_design_idx" ON "design_picture" USING btree ("tenant_id","design_id","added_at");--> statement-breakpoint
CREATE UNIQUE INDEX "design_picture_tenant_creation_key" ON "design_picture" USING btree ("tenant_id","creation_key") WHERE "design_picture"."creation_key" is not null;--> statement-breakpoint
CREATE INDEX "design_picture_file_tenant_picture_idx" ON "design_picture_file" USING btree ("tenant_id","picture_id","page");--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_content_type_known" CHECK ("file"."content_type" in ('image/png', 'image/jpeg', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'application/json', 'image/vnd.dwg', 'image/vnd.dxf'));--> statement-breakpoint
ALTER TABLE "design_picture" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "design_picture" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "design_picture_tenant" ON "design_picture" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "design_picture" TO app_user;--> statement-breakpoint
ALTER TABLE "design_picture_file" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "design_picture_file" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "design_picture_file_tenant" ON "design_picture_file" FOR ALL TO app_user
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "design_picture_file" TO app_user;
