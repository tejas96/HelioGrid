-- 0029 · what an import row's name matched (T-M01-017; deferred D129): the items its brand and model
-- named, whatever its outcome — so a question names the product it is about, a several-matches row
-- offers its candidates, and a left-out row's report reads the price its one product held — and, on
-- a repeated row, the earlier row naming the same product.
--
-- Expand only: two columns with a default and a null. An older api selects named columns and never
-- these; new code reads `[]` and null on rows judged before, which is today's report.

ALTER TABLE "catalog_import_row" ADD COLUMN "named_items" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "catalog_import_row" ADD COLUMN "repeats_row" integer;
ALTER TABLE "catalog_import_row" ADD CONSTRAINT "catalog_import_row_repeats_row_positive" CHECK ("catalog_import_row"."repeats_row" >= 1);
