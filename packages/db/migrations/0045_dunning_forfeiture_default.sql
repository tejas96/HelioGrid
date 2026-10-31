-- 0045 · no launch price (T-M12-013): a dunning notice never discloses a forfeiture, so new code no
-- longer writes `forfeiture_disclosed`. Old readers: an api of the release before still writes the
-- column and reads it nowhere; the default fills it for the new one. D396 drops it later.
ALTER TABLE "dunning_event" ALTER COLUMN "forfeiture_disclosed" SET DEFAULT false;
