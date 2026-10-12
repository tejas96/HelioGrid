-- 0024 · the company profile's bank details typed half way (T-M01-005d): the owner types one to
-- three of the four bank facts and stops (M06-17), and the profile had nowhere to keep them —
-- "bank_details" is all four facts or nothing, which is what every document reads.
--
-- Expand only: nullable, no default, no backfill. Older code never selects the column; a client built
-- before the field existed saves without naming it, and the api then keeps what is stored.

ALTER TABLE "business_profile" ADD COLUMN "bank_details_typed" jsonb;
