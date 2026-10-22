-- 0027 · a person's photo in one company (T-M01-009 part a): the first-run profile stores a photo
-- (M01-14), and each company keeps its own (brief ruling 16) — one pointer per membership at a file
-- of that company, stored against the person's own user_account.
--
-- Tenant-scoped, all four always. app_user writes it through the person's own session: a photo is
-- set, replaced and cleared, so SELECT, INSERT, UPDATE and DELETE.
--
-- Additive only: a new table nothing older reads; no row means the initials.

CREATE TABLE "member_photo" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

ALTER TABLE "member_photo" ADD CONSTRAINT "member_photo_membership_id_tenant_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."tenant_membership"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "member_photo" ADD CONSTRAINT "member_photo_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "member_photo" ADD CONSTRAINT "member_photo_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "member_photo_tenant_membership_idx" ON "member_photo" USING btree ("tenant_id","membership_id");
-- The tenant pin is transaction-local (set_config … true) and NULLIF makes an unset pin match
-- nothing: fail closed. The policy renders exactly as the RLS checker's canonical list.
ALTER TABLE "member_photo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "member_photo" FORCE ROW LEVEL SECURITY;
CREATE POLICY "member_photo_tenant" ON "member_photo" FOR ALL TO app_user
	USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
	WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "member_photo" TO app_user;
