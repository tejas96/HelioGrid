-- 0022 · the join request (T-M01-035): someone signing up asks a company that already exists to add
-- them (M01-09). The request IS a notification to that company's EPC Owners, so no table is added —
-- only the type.
--
-- Expand only: every notification read takes the type as an open enum and falls back on a value it
-- does not know, so an older app reads the new rows and new code reads the old ones.

ALTER TYPE "public"."notification_type" ADD VALUE 'join_requested' BEFORE 'system';
