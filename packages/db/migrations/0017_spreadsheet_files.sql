-- 0017 · spreadsheets in the one files table (T-M01-030 part a): two file types and one subject.
--
-- A supplier's price list is stored like every other file (forward-compat.md) before the catalog
-- import reads it (M01-41). The company's catalog joins subject_kind as what the list is stored
-- against — its ref is the company's own id, because the file exists before the import that reads
-- it.
--
-- file.content_type leaves its pgEnum for text held by a CHECK: Postgres caps an enum label at 63
-- bytes, and the .xlsx type, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, is
-- 65. The CHECK lists the four types domain's FILE_CONTENT_TYPES holds, and invariant enum-parity
-- reads it back against the contract as it read the enum.
--
-- Safe both ways while a release rolls: the column holds the same strings it held, an older api
-- reads and writes them as text exactly as before, and no row holds a new type until a new client
-- declares one. The column's grants (SELECT, INSERT, UPDATE on uploaded_at alone) are untouched.

ALTER TABLE "file" ALTER COLUMN "content_type" SET DATA TYPE text USING "content_type"::text;
ALTER TABLE "file" ADD CONSTRAINT "file_content_type_known" CHECK ("file"."content_type" in ('image/png', 'image/jpeg', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
DROP TYPE "public"."file_content_type";
ALTER TYPE "public"."subject_kind" ADD VALUE 'catalog';
