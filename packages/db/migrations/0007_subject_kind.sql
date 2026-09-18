-- 0007 · the suite's one polymorphic pointer gets its own name (T-FPLAT-059).
--
-- T-FPLAT-004 authored `subject_kind` + `subject_ref` as ONE union every record that names a
-- subject reads — the audit entry, then `notification`, then `file`. It was authored inside the
-- audit slice and took that slice's name, so the second reader would have declared a column
-- typed `audit_subject_kind` in a table that has nothing to do with the audit log.
--
-- A rename, and nothing else: the values, the column and every written row are untouched.
-- Renaming it BEFORE the second reader lands is what keeps the union one union — the alternative
-- is a second pgEnum holding the same values, which is the drift `M17` exists to catch.

ALTER TYPE "public"."audit_subject_kind" RENAME TO "subject_kind";
