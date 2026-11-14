-- A newer proposal version put in force on a won deal's project (`M08-50`, `M11-14`): the parts
-- already paid stay as they are, and the unpaid ones are replaced by the new version's plan for what
-- remains. A replaced part keeps its row — its request shares still point at it, and the earlier
-- schedule remains readable — and is marked with the moment it left the schedule. Every reader of a
-- project's schedule takes the parts whose mark is null; old rows read as in force, as they are.
--
-- Additive: one nullable column, no new grant (project_tranche already takes UPDATE for the waiver).
ALTER TABLE "project_tranche" ADD COLUMN "replaced_at" timestamp with time zone;
