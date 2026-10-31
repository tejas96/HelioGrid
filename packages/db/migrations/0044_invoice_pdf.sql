-- 0044 · the invoice PDF (T-M12-012d): an invoice points at the one file row that holds its PDF,
-- set once after it issues. A file the platform makes itself has no uploader, so `uploaded_by`
-- takes null; the user file flow matches the uploader and never serves one. Old readers: no
-- running code reads an invoice's PDF or a file without an uploader before this release.
ALTER TYPE "public"."subject_kind" ADD VALUE 'subscription_invoice';--> statement-breakpoint
ALTER TABLE "file" DROP CONSTRAINT "file_content_type_known";--> statement-breakpoint
ALTER TABLE "file" ALTER COLUMN "uploaded_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD COLUMN "pdf_file_id" uuid;--> statement-breakpoint
ALTER TABLE "subscription_invoice" ADD CONSTRAINT "subscription_invoice_pdf_file_id_file_id_fk" FOREIGN KEY ("pdf_file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_content_type_known" CHECK ("file"."content_type" in ('image/png', 'image/jpeg', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'));
