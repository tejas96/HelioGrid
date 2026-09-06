import type { CallingRulesPack } from './pack';

/**
 * `F1-16` — **a market with no voice ruleset in its pack cannot enable outbound voice.** Absence
 * is a HARD DISABLE, not a permissive default: the capability is unavailable to that market's
 * tenants, and no tenant setting and no support action turns it on (`F1-12`, `F1` §5 — a
 * capability a market cannot support degrades by the product's defined path).
 *
 * Outbound only. Answering an INBOUND call is `F1-36`b lane 1 and is never window-bound, so it is
 * not this question.
 */
export function isOutboundVoiceAvailable(rules: CallingRulesPack): boolean {
  return rules.voice.declared;
}
