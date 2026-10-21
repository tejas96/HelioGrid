-- 0026 · the invited person's two answers (T-M01-008 part a): a decline tells the company's EPC
-- Owners, and the one-tap ask on a run-out link tells the person who sent it (M01.2 S1.wrong.1,
-- S1.wrong.2). Both are notifications about the invitation, so no table is added — only the types.
--
-- Expand only: every notification read takes the type as an open enum and falls back on a value it
-- does not know, so an older app reads the new rows and new code reads the old ones.

ALTER TYPE "public"."notification_type" ADD VALUE 'invite_declined' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'reinvite_requested' BEFORE 'system';
