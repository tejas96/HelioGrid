-- 0050 · the CRM's values in the shared vocabularies (T-M02-001 RFC decisions 11, 12, 17): what a
-- notice, a file or an audit entry may point at (a customer, a lead, a lead import), the two notices
-- the CRM raises (a lead assigned to you, pushed; a new enquiry on your lead, in-app), and the two
-- audited CRM acts (a duplicate kept on purpose, two customers merged).
--
-- The notification values sit where domain's tuple places them, beside the CRM's other notice;
-- enum-parity compares sets, so the order is for a reader of `\dT+`.
--
-- Expand only: every reader takes these as open enums with a fallback (the notification wire's
-- `extensibleEnum`, the audit and subject reads), so an older app reads the new rows and new code
-- reads the old ones. No value is used in this transaction.
ALTER TYPE "public"."subject_kind" ADD VALUE 'customer';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'lead';--> statement-breakpoint
ALTER TYPE "public"."subject_kind" ADD VALUE 'lead_import';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'lead_assigned' AFTER 'lead_unassigned_24h';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'lead_enquiry' AFTER 'lead_assigned';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'crm.duplicate_kept';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'crm.customers_merged';
