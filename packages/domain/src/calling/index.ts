/**
 * `pack.calling-rules` (`F1-15`–`F1-17`) and the rules that read it: whether a market may dial
 * outbound at all, what a tenant may narrow a floor to, and when a scheduled message goes. The
 * India instance is `IN_CALLING_RULES` (`F1-36`, `F1-39`, `F1-62`).
 *
 * The compliance gate itself is `M07`'s and is not here. This package supplies what it enforces.
 */
export type { ClockTime } from './clock-time';
export { clockTime, clockTimeHhmm } from './clock-time';
export type {
  CallingRulesPack,
  CallingWindow,
  Floor,
  MessagingRuleset,
  MessagingWindow,
  NoVoiceRuleset,
  RulesetItem,
  TenantDefault,
  VoiceRuleset,
} from './pack';
export { callingWindow, floor, IN_CALLING_RULES, NO_WINDOW, tenantDefault } from './pack';
export { isOutboundVoiceAvailable } from './voice';
export { isWithinFloor, lawfulSendTime, windowInForce } from './window';
