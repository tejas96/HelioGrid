import { CAPABILITY_MATRIX, type Capability } from './capabilities';
import { VISIBILITY_DOMAINS, type VisibilityDomain } from './cells';
import { can, limitsOn, visibilityIn } from './policy';
import { inMatrixOrder, ROLE_PRESETS, type RolePreset } from './roles';

/**
 * The grant line on Assign Roles (`SCR-M01-13`, `M01-20`): which held presets speak in the one
 * sentence that says what a person can do. A held preset another held preset already covers is
 * left out, so EPC Owner speaks alone; the speakers together still hold exactly what the whole
 * set holds (Law 11). The sentence's words are `packages/i18n`'s, one clause per speaker.
 *
 * No two presets cover each other in today's matrix (a test holds it), so no tie needs breaking.
 */
export interface GrantLine {
  /** In F2's order (F2-25). Empty when no preset is held. */
  readonly speakers: readonly RolePreset[];
}

export function grantLine(roles: readonly RolePreset[]): GrantLine {
  const held = inMatrixOrder(roles);
  return { speakers: held.filter((preset) => !held.some((other) => coveredBy(other, preset))) };
}

/** Whether `held`, all together, already holds everything `preset` gives. */
export function isCovered(preset: RolePreset, held: readonly RolePreset[]): boolean {
  return holdingOf([...held, preset]) === holdingOf(held);
}

/** Every pair where the first covers the second — read from the fixed matrix once, not per tick. */
const COVERING_PAIRS: ReadonlySet<string> = new Set(
  ROLE_PRESETS.flatMap((other) =>
    ROLE_PRESETS.filter((preset) => other !== preset && covers(other, preset)).map((preset) =>
      pairKey(other, preset),
    ),
  ),
);

function pairKey(other: RolePreset, preset: RolePreset): string {
  return `${other}>${preset}`;
}

function coveredBy(other: RolePreset, preset: RolePreset): boolean {
  return COVERING_PAIRS.has(pairKey(other, preset));
}

/** Holding `preset` beside `other` changes nothing `other` alone holds. */
function covers(other: RolePreset, preset: RolePreset): boolean {
  return holdingOf([other, preset]) === holdingOf([other]);
}

/**
 * What a set of presets holds, as one comparable string: every capability with the limits it
 * holds it under, and every domain's reach. A limit `all` (any case) narrows nothing, so it reads
 * as an outright grant — that is how EPC Owner's `All` covers another preset's `own` — and a
 * domain seen whole covers any assigned or through reach into it.
 */
function holdingOf(roles: readonly RolePreset[]): string {
  const capabilities = (Object.keys(CAPABILITY_MATRIX) as Capability[]).map((capability) => [
    capability,
    can(roles, capability),
    limitsRead(roles, capability),
  ]);
  const reach = VISIBILITY_DOMAINS.map((domain) => reachIn(roles, domain));
  return JSON.stringify([capabilities, reach]);
}

/** A domain's reach. Seeing all of it leaves nothing for an assigned or a through reach to add. */
function reachIn(roles: readonly RolePreset[], domain: VisibilityDomain): unknown[] {
  const { scope, includesAssigned, through } = visibilityIn(roles, domain);
  if (scope === 'all') return [domain, scope];
  return [domain, scope, includesAssigned, through.map((t) => `${t.domain}:${t.scope}`).sort()];
}

function limitsRead(roles: readonly RolePreset[], capability: Capability): readonly string[] {
  const phrases = limitsOn(roles, capability);
  return phrases.some((phrase) => phrase.toLowerCase() === 'all') ? [] : [...phrases].sort();
}
