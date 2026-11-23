ALTER TABLE "file" DROP CONSTRAINT "file_content_type_known";--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_content_type_known" CHECK ("file"."content_type" in ('image/png', 'image/jpeg', 'image/webp', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'application/json', 'image/vnd.dwg', 'image/vnd.dxf'));
