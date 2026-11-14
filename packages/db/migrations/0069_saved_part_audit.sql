-- A company's saved parts on its own record (`F2-22`, `M06-28`): adding, changing, archiving and
-- restoring a saved cable, electrical or structure part is a catalog change, each an audit entry
-- naming the part.
--
-- Additive: four values on the audit vocabulary and one subject kind; no row or reader changes.
ALTER TYPE "public"."audit_event_type" ADD VALUE 'saved_parts.part_added' BEFORE 'price_book.version_published';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'saved_parts.part_changed' BEFORE 'price_book.version_published';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'saved_parts.part_archived' BEFORE 'price_book.version_published';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'saved_parts.part_restored' BEFORE 'price_book.version_published';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'saved_part';
