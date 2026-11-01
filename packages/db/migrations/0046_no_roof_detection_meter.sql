-- The product has no roof detection (owner ruling 2026-11-01): no row may bill one. The
-- `usage_meter` value stays until the release before stops naming it in a query (D398).
ALTER TABLE "overage_addon" DROP CONSTRAINT "overage_addon_billed_meter";--> statement-breakpoint
ALTER TABLE "usage_event" DROP CONSTRAINT "usage_event_bills_a_billed_meter";--> statement-breakpoint
ALTER TABLE "overage_addon" ADD CONSTRAINT "overage_addon_billed_meter" CHECK ("overage_addon"."meter" in ('voice_minutes', 'marketing_sends', 'tracked_field_seats'));--> statement-breakpoint
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_bills_a_billed_meter" CHECK (not "usage_event"."billable" or "usage_event"."meter" in ('voice_minutes', 'marketing_sends', 'tracked_field_seats'));
