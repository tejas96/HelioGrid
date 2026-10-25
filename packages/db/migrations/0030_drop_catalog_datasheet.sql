-- 0030 · an own catalog item no longer points at a datasheet file (T-M01-016): catalog files are
-- Excel or CSV only (owner ruling), so `source_datasheet_id` has no reader and no writer.
--
-- Contract in one release: no api reads or writes the column, and no environment runs an older api
-- yet. Rollback is a new migration adding the nullable column back.

ALTER TABLE "tenant_catalog_item" DROP CONSTRAINT "tenant_catalog_item_source_datasheet_id_file_id_fk";
ALTER TABLE "tenant_catalog_item" DROP COLUMN "source_datasheet_id";
