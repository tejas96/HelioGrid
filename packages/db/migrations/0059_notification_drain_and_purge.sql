-- heliogrid:no-transaction
-- 0059 · the two notification jobs (D10; F6-14, F6-19): the push drain finds the pushes owed and not
-- yet sent by when they fell due, and the horizon purge finds every company's notices past the
-- centre's horizon by when they were emitted.
--
-- Both run on the admin path, which crosses companies and owns the table, so no grant changes:
-- app_user keeps SELECT, INSERT and UPDATE (read_at) — nothing a person's request reaches may mark
-- a push sent or delete a notice.
--
-- ADDITIVE, one release: two indexes, read by nothing older.
--
-- Locks: `notification` takes a row for every notice a live act writes, so each index is built
-- CONCURRENTLY — a share-update-exclusive lock that never blocks those inserts — which Postgres
-- allows only outside a transaction: this file runs without one (the directive above), each
-- statement sent on its own, and each is IF NOT EXISTS so a crash mid-apply runs it again. A build
-- that failed part way leaves an INVALID index that IF NOT EXISTS would keep: drop it and rerun.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notification_push_unsent_due_idx" ON "notification" USING btree ("push_due_at") WHERE "notification"."push_sent_at" is null;--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notification_emitted_idx" ON "notification" USING btree ("emitted_at");
