-- 0043 · yearly renewal (T-M12-012c), the queues that name 0042's new invoice statuses: a new enum
-- value cannot be used in the transaction that adds it, so these two indexes land here. The timers
-- fail an `issued` renewal at its due moment; the reconcile polls the links that can still take
-- money, read by their due moment so the halted rows' `failed` renewals never grow its read.
CREATE INDEX "subscription_invoice_due_idx" ON "subscription_invoice" USING btree ("due_at") WHERE "subscription_invoice"."status" = 'issued';--> statement-breakpoint
CREATE INDEX "subscription_invoice_open_link_idx" ON "subscription_invoice" USING btree ("due_at") WHERE "subscription_invoice"."status" in ('issued', 'failed');
