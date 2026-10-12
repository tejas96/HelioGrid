-- 0023 · the company profile's postal code (T-M01-005a): the board draws a PIN code beside the street
-- address and the city (M01-24), and the profile had one address text and nowhere to keep it.
--
-- Expand only: nullable, no default, no backfill. Older code never selects the column; a client built
-- before the field existed saves without naming it, and the api then keeps what is stored.

ALTER TABLE "business_profile" ADD COLUMN "postal_code" text;
