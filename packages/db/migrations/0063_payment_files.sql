-- 0063 · a payment's files hang on the payment (block 5, M11-37). A receipt photo is stored after
-- the payment is saved, against the payment itself (file subject `project_payment`), so a slow
-- upload never holds the money back and no ledger row is changed to point at a photo; the receipt
-- PDF hangs on the payment the same way. project_payment.file_id is no longer written or read.
--
-- Contract, not additive: the column goes. No release ever read or wrote it — 0062 and this ship in
-- the same release — so no older reader meets its absence.
ALTER TABLE "project_payment" DROP CONSTRAINT "project_payment_file_id_file_id_fk";--> statement-breakpoint
ALTER TABLE "project_payment" DROP COLUMN "file_id";
