-- 0073 · a person's studio picks (T-M05-002b).
--
-- `user_account`: two columns that follow the person to every device, as `unit_preference` does.
-- `studio_helpers_off` lists the drawing helpers (Square, Line up, Buildings) the person turned
-- off: none at first. `number_entry` is how they set a number: the slider first, or a box.
-- Additive, with defaults: an account written before them reads all helpers on and the slider,
-- and an app from before this release never names them. No new grant: `user_account` is written
-- on the admin path alone.
CREATE TYPE "public"."number_entry" AS ENUM('slider', 'box');--> statement-breakpoint
CREATE TYPE "public"."studio_helper" AS ENUM('square', 'line_up', 'buildings');--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "studio_helpers_off" "studio_helper"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "number_entry" "number_entry" DEFAULT 'slider' NOT NULL;
