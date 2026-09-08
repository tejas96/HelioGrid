-- 0001 · the market pack, stored (T-FCORE-016). Schema only: IN_PACK is seeded by the publish
-- command through the application, never by an INSERT here.
--
-- Both tables are READABLE GLOBAL reference data: no tenant_id, no RLS, SELECT for every member
-- of app_user and no write privilege — the publish command on the admin path (the owner role)
-- is the only writer. Roles are cluster objects and come from infra/postgres/init/01-roles.sql;
-- app_user must exist before the GRANT below.

CREATE TABLE "market_pack" (
	"market_code" text PRIMARY KEY NOT NULL,
	CONSTRAINT "market_pack_market_code_alpha2" CHECK ("market_pack"."market_code" ~ '^[A-Z]{2}$')
);

CREATE TABLE "market_pack_version" (
	"market_code" text NOT NULL,
	"revision" integer NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"pack" jsonb NOT NULL,
	CONSTRAINT "market_pack_version_market_code_revision_pk" PRIMARY KEY("market_code","revision"),
	CONSTRAINT "market_pack_version_revision_positive" CHECK ("market_pack_version"."revision" >= 1)
);

ALTER TABLE "market_pack_version" ADD CONSTRAINT "market_pack_version_market_code_market_pack_market_code_fk" FOREIGN KEY ("market_code") REFERENCES "public"."market_pack"("market_code") ON DELETE no action ON UPDATE no action;

-- The current-version read and the staleness comparison; the primary key serves pinned reads.
CREATE INDEX "market_pack_version_current_idx" ON "market_pack_version" USING btree ("market_code","published_at" DESC NULLS LAST);

-- Every tenant reads its market's pack; none writes it (F1-12). No write privilege of any kind
-- is granted to a member of app_user — the tenancy scan asserts exactly this.
GRANT SELECT ON TABLE "market_pack", "market_pack_version" TO app_user;
