/**
 * Where an open proposal stands for the forecast (`M13-03`, `T-M13-007`): shared or opened and not
 * yet answered, the customer asked for changes, or the customer accepted and the win is not yet
 * confirmed. A leaf file: the market pack gives each its likelihood (`format/proposal-facts.ts`).
 */
export const FORECAST_STAGES = ['shared', 'negotiating', 'accepted'] as const;
export type ForecastStage = (typeof FORECAST_STAGES)[number];
