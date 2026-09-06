import { type ClockTime, clockTime } from './clock-time';

/**
 * `pack.calling-rules` — the market's communications-compliance ruleset, VOICE AND MESSAGING in
 * the one key (`F1-15`). §F1.2 partitions communications law into a single key on purpose, so a
 * second declaration for messaging would split the key against that partition.
 *
 * This is DATA. The compliance gate that enforces it is `M07`'s, it is product code and it never
 * varies per market — the ruleset always does. Every statutory word here (TRAI, DND, the
 * 09:00–21:00 window, 90 days) is a VALUE, never a field name and never a line of copy.
 *
 * **What is NOT here, and why.** `F1-36`(d)'s four hard floors — never claims to be human · never
 * denies being AI when asked · instant human handoff on request · full transcription to the
 * timeline — are non-negotiable PRODUCT LAW, not pack data: a field for one would imply a market
 * could author it away. `F1-39`'s "a customer who declines recording is still served" is the same
 * class. Lane 2 honours the market's holiday calendar (`F1-36`b), which is `pack.formats` data
 * (`F1-48`) and lands with `T-FCORE-008`; it is not restated here (`F1-01` — one fact, one key).
 */

/**
 * `F1-17` — every ruleset item declares whether it is a statutory FLOOR the gate enforces, or a
 * DEFAULT a tenant edits above that floor. The classification is carried on the item rather than
 * in a table beside it: an unclassified item is then a compile error, not a silent
 * default-to-editable, which §F1.2's edge cases name as the failure to prevent.
 */
export interface Floor<T> {
  readonly enforcement: 'floor';
  readonly value: T;
}

export interface TenantDefault<T> {
  readonly enforcement: 'default';
  readonly value: T;
}

export type RulesetItem<T> = Floor<T> | TenantDefault<T>;

/** Enforced by `M07`'s gate. Tenant configuration may only NARROW it; no override flag exists. */
export function floor<T>(value: T): Floor<T> {
  return { enforcement: 'floor', value };
}

/** Tenant-editable above the floor it sits inside (`F1-12`). Named for who may move it. */
export function tenantDefault<T>(value: T): TenantDefault<T> {
  return { enforcement: 'default', value };
}

/**
 * A window of the tenant's day (`F1-10`, `Q58` — one clock, the tenant's). `closes` is strictly
 * after `opens`: a window crossing midnight is refused at authoring time rather than handled,
 * because no market authors one and every comparison downstream would need a second branch.
 */
export interface CallingWindow {
  readonly opens: ClockTime;
  readonly closes: ClockTime;
}

export function callingWindow(opens: string, closes: string): CallingWindow {
  const window = { opens: clockTime(opens), closes: clockTime(closes) };
  if (window.closes <= window.opens) {
    throw new RangeError(`a window closes after it opens, not ${opens}–${closes}`);
  }
  return window;
}

/**
 * An AUTHORED absence of a window (`F1-62`a): every hour of the day is lawful. Not a missing
 * value — the item is declared and classified like every other, so `F1-15`'s floor structure is
 * satisfied and nothing downstream waits on a value.
 */
export const NO_WINDOW = null;

export type MessagingWindow = CallingWindow | typeof NO_WINDOW;

/**
 * What a caller line carries (`F1-37`). The market's series rule turns on this, and so does the
 * lawful-window question: lane 1, inbound, is never window-bound and lane 2, promotional, is
 * (`F1-36`b). A market-neutral vocabulary — no market's own series names appear on it.
 */
export const TRAFFIC_CLASSES = ['transactional', 'promotional', 'inbound'] as const;

export type TrafficClass = (typeof TRAFFIC_CLASSES)[number];

/**
 * Which caller-line series a market allows each class of traffic (`F1-37`). Series are the
 * market's own numbering, so they are VALUES here and are never spelled anywhere else.
 *
 * `requiredByClass` writes out every class — a class carrying `null` has no required series, and
 * a fourth class added to `TRAFFIC_CLASSES` is then a compile error rather than a quiet
 * `undefined` that reads as "no requirement".
 */
export interface CallerLineSeries {
  readonly requiredByClass: Record<TrafficClass, string | null>;
  /** Series this product's tenants may never dial from, whatever the class. */
  readonly forbidden: readonly string[];
}

/**
 * What a market demands be registered before messaging traffic flows (`F1-38`). Registration is a
 * third-party approval clock: it gates ACTIVATION, not scope — the code ships and the tenant's own
 * registered identifiers are tenant data, never pack data.
 *
 * A market that demands no registration declares none, so absence is the answer rather than an
 * empty list a caller must interpret.
 */
export interface SenderRegistration {
  /** The registration platform — `DLT` in India. A value, never a field name. */
  readonly platform: string;
  /** What must be registered, coarsest first. Unregistered traffic is carrier-blocked. */
  readonly levels: readonly string[];
}

/** A market that declares no voice ruleset. `F1-16` reads this as a HARD DISABLE of outbound. */
export interface NoVoiceRuleset {
  readonly declared: false;
}

export interface VoiceRuleset {
  readonly declared: true;
  /** `F1-36`b lane 2 — where unsolicited promotional dialling is lawful. Lane 1, inbound, is never window-bound. */
  readonly promotionalWindow: Floor<CallingWindow>;
  /** `F1-36`a — past this age the scrub is stale and promotional dialling pauses fail-closed; transactional continues. */
  readonly dndScrubMaxAgeHours: Floor<number>;
  /** `F1-36`c — a keypress or a spoken "stop calling" is honoured within this, and is irreversible without the customer. */
  readonly optOutHonouredWithinHours: Floor<number>;
  /** `F1-36`e — then hard delete. The transcript is retained. */
  readonly recordingRetentionDays: Floor<number>;
  /**
   * `F1-36`d — whether the agent volunteers that it is AI before being asked. A FLOOR because it
   * is pack data no tenant edits (`F1-12`), and it flips only when the market's law binds.
   */
  readonly proactiveAiDisclosure: Floor<boolean>;
  /** `F1-39` — a default above the floor: consent is captured, and a customer who declines is served regardless. */
  readonly recordingConsentCaptured: TenantDefault<boolean>;
  /** `F1-37` — which series each class of outbound may dial from. A FLOOR: the carrier enforces it, not a preference. */
  readonly callerLineSeries: Floor<CallerLineSeries>;
}

export interface MessagingRuleset {
  /** `F1-15` — a FLOOR a tenant narrows and never widens. `NO_WINDOW` where the market states no hour. */
  readonly statutoryWindow: Floor<MessagingWindow>;
  /** `F1-15` — the hour an automatic transactional message goes, on the tenant's clock. A tenant may narrow it. */
  readonly scheduledSendHour: TenantDefault<ClockTime>;
  /** `F1-38` — what must be registered before a send is carried. A FLOOR; `null` where the market demands none. */
  readonly senderRegistration: Floor<SenderRegistration | null>;
}

export interface CallingRulesPack {
  readonly voice: NoVoiceRuleset | VoiceRuleset;
  readonly messaging: MessagingRuleset;
}

/**
 * India — TRAI/DND for voice (`F1-36`, `F1-39`) and TCCCPR for messaging (`F1-62`). A reader
 * checks this table against the PRD row rather than trusting the code.
 */
export const IN_CALLING_RULES: CallingRulesPack = {
  voice: {
    declared: true,
    promotionalWindow: floor(callingWindow('09:00', '21:00')),
    dndScrubMaxAgeHours: floor(24),
    optOutHonouredWithinHours: floor(24),
    recordingRetentionDays: floor(90),
    /**
     * `F1-36`d — India ships it OFF: the agent opens naturally ("I'm Asha from [company]") with
     * no proactive AI mention. It flips ON when TRAI's AI-caller identification rule binds, which
     * is a pack-data update taking the next pack version (`F1-11`), never a product release.
     */
    proactiveAiDisclosure: floor(false),
    recordingConsentCaptured: tenantDefault(true),
    /**
     * `F1-37` — promotional outbound rides the **140-series RTM route**, and the **1600-series is
     * closed to non-BFSI entities**, which every tenant of this product is. The row names a
     * required series for the promotional class only, so the other two carry `null`: no
     * requirement is a complete answer here, not a gap — nothing downstream is left undefined by
     * it, unlike a rule the code would have to act on.
     */
    callerLineSeries: floor({
      requiredByClass: { transactional: null, promotional: '140', inbound: null },
      forbidden: ['1600'],
    }),
  },
  messaging: {
    /**
     * `F1-62`a — TCCCPR states no hour anywhere. Its time band is a preference the RECIPIENT
     * registers with their own access provider, enforced by DLT, never readable by this product,
     * and binding promotional traffic only. So the window is authored EMPTY: transactional sends
     * are unconstrained by time, and a promotional refusal is reported honestly (`F1-38`) rather
     * than pre-empted by a guessed window.
     */
    statutoryWindow: floor(NO_WINDOW),
    /** `F1-62` — 19:00 on the tenant's clock: Indian households are home, so a problem can be raised before the crew leaves. */
    scheduledSendHour: tenantDefault(clockTime('19:00')),
    /**
     * `F1-38` — SMS rides only a DLT-registered entity, header and template; unregistered traffic
     * is carrier-blocked, and platform→tenant messaging rides the same rule. The tenant's OWN
     * registered entity and headers are tenant data, never authored here: this declares the DUTY,
     * which is the market fact. Registration is a third-party clock gating activation, not scope.
     */
    senderRegistration: floor({ platform: 'DLT', levels: ['entity', 'header', 'template'] }),
  },
};
