/**
 * `M08-08` — the one canonical stage chain every project runs, market-neutral by ruling, and the
 * terminal it can leave by. A readonly tuple, so contracts derives its `z.enum` and M08's
 * migration mirrors the pgEnum from this one list when its slice lands (Law 9).
 *
 * Authored ahead of the machine because a payment tranche falls due on a stage (`M01-54`) and a
 * settings row validates against the CHAIN, never against one market's labels: the pack labels
 * only the stages a market names differently (`F1-22`, `format/vocabulary.ts`), and `F1-51`
 * fixes two of these nine for India.
 */
export const PROJECT_STAGE_CHAIN = [
  'won',
  'material_ordered',
  'dispatched',
  'installation',
  'electrical_metering',
  'utility_inspection',
  'commissioned',
  'incentive_claimed',
  'handed_over',
] as const;
export type ProjectChainStage = (typeof PROJECT_STAGE_CHAIN)[number];

/** Reachable from any stage, reason mandatory, terminal (`M08-08`). */
export const CANCELLED_STAGE = 'cancelled' as const;

export const PROJECT_STAGES = [...PROJECT_STAGE_CHAIN, CANCELLED_STAGE] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

/** A tranche falls due on a stage a project passes THROUGH — never on the terminal it leaves by. */
export function isTrancheDueStage(value: string): value is ProjectChainStage {
  return (PROJECT_STAGE_CHAIN as readonly string[]).includes(value);
}
