import { keepsControl, keepsOwnAdmin } from '../authz/administration';
import { isCovered } from '../authz/grant-line';
import { inMatrixOrder, type RolePreset } from '../authz/roles';
import type { TransportFailure } from '../format/transport-failure';
import type { TeamActAnswer } from './team-acts';
import type { TeamRow } from './team-roster';

/**
 * What Assign Roles decides (`SCR-M01-13`, `M01-20`), once for both platforms (Law 11): which
 * rows open it, which presets a sheet cannot clear, and what a save changes. The server decides
 * every write; these only read.
 */

/** Only an active member has presets to assign: an invite or a deactivated person has none. */
export function opensAssignRoles(row: TeamRow): boolean {
  return row.status === 'active';
}

/**
 * Why a held preset's row is off: the company's last EPC Owner (F2-19), or the viewer's own
 * admin rights, which only another EPC Owner may take (F2-19).
 */
export type PresetLock = 'sole-owner' | 'own-admin';

/**
 * The held presets this person's sheet cannot clear, and why. `roster` is the WHOLE list, never
 * the rows a search left in view. When both reasons hold, the sole-owner one is shown.
 */
export function lockedPresets(
  person: TeamRow,
  roster: readonly TeamRow[],
): Partial<Record<RolePreset, PresetLock>> {
  const heldByOthers = roster
    .filter((other) => other.status === 'active' && other.id !== person.id)
    .flatMap((other) => other.roles);
  const locks: Partial<Record<RolePreset, PresetLock>> = {};
  for (const preset of person.roles) {
    const without = person.roles.filter((held) => held !== preset);
    if (!keepsControl([...heldByOthers, ...without])) locks[preset] = 'sole-owner';
    else if (!keepsOwnAdmin(person.isViewer, without)) locks[preset] = 'own-admin';
  }
  return locks;
}

export interface RoleChange {
  readonly added: readonly RolePreset[];
  readonly removed: readonly RolePreset[];
  /** The removed presets the kept ones, together, do not cover — what the person can no longer do. */
  readonly lost: readonly RolePreset[];
}

/** Each in F2's order. A save that removes nothing asks nothing (`SCR-M01-13` brief). */
export function roleChange(
  before: readonly RolePreset[],
  after: readonly RolePreset[],
): RoleChange {
  const added = inMatrixOrder(after).filter((preset) => !before.includes(preset));
  const removed = inMatrixOrder(before).filter((preset) => !after.includes(preset));
  const lost = removed.filter((preset) => !isCovered(preset, after));
  return { added, removed, lost };
}

/**
 * Why *Save roles* is off: the person is no longer active, nothing is ticked (F2-21), or nothing
 * changed; null when it may run. `person` is their row as last read.
 */
export type SaveRolesOff = 'gone' | 'empty' | 'unchanged';

export function saveRolesOff(
  person: TeamRow,
  after: readonly RolePreset[],
  /* The last save's refusal: a 409 the list could not confirm still says gone, as its banner does. */
  refusal: AssignRolesRefusal | null = null,
): SaveRolesOff | null {
  if (!opensAssignRoles(person) || refusal?.kind === 'gone') return 'gone';
  if (after.length === 0) return 'empty';
  const { added, removed } = roleChange(person.roles, after);
  return added.length === 0 && removed.length === 0 ? 'unchanged' : null;
}

/**
 * Whether a save that got no answer landed after all (F8-36): the person, read again, is active and
 * holds exactly the ticks.
 */
export function savedAsPicked(person: TeamRow, picked: readonly RolePreset[]): boolean {
  return saveRolesOff(person, picked) === 'unchanged';
}

/**
 * What an answer to *Save roles* means: `done` it landed · `unknown` none came, read the person
 * again before saying anything · `gone` the person is no longer active (409), or not on the team
 * (404) · `last-owner` / `own-admin` F2-19 refused it · `forbidden` the reader no longer manages the
 * team · `failed` nothing changed — a 5xx, a 401 after a refused refresh, any other answer.
 */
export type AssignRolesOutcome =
  | 'done'
  | 'unknown'
  | 'gone'
  | 'last-owner'
  | 'own-admin'
  | 'forbidden'
  | 'failed';

export function assignRolesOutcome(answer: TeamActAnswer): AssignRolesOutcome {
  if (answer === null) return 'unknown';
  const { status, code } = answer;
  if (status >= 200 && status < 300) return 'done';
  if (status === 403) return 'forbidden';
  if (status === 404 || status === 409) return 'gone';
  if (status === 422 && code === 'LAST_OWNER') return 'last-owner';
  if (status === 422 && code === 'OWN_ADMIN') return 'own-admin';
  return 'failed';
}

/**
 * Why the open sheet's last save did not land, as its banner says it: `failed` nothing changed ·
 * `gone`, `last-owner`, `own-admin` as `assignRolesOutcome` · `unconfirmed` no answer came and the
 * person could not be read again either, so whether it landed is unknown (F8-36).
 */
export type AssignRolesRefusal =
  | { readonly kind: 'failed' | 'gone' | 'last-owner' | 'own-admin' }
  | { readonly kind: 'unconfirmed'; readonly failure: TransportFailure };

/**
 * What the open sheet says once a save that did not land has been read back — null when it landed
 * after all and the sheet closes as on a 200. `roster` is the list read again, null when it got no
 * answer; `sent` the person and the ticks the save carried; `failure` why the save got no answer,
 * when the client named it.
 */
export function refusalAfterReread(
  outcome: Exclude<AssignRolesOutcome, 'done' | 'forbidden' | 'failed'>,
  roster: readonly TeamRow[] | null,
  sent: { readonly id: string; readonly ticks: readonly RolePreset[] },
  failure: TransportFailure | null,
): AssignRolesRefusal | null {
  if (outcome !== 'unknown') return { kind: outcome };
  if (roster === null) return { kind: 'unconfirmed', failure: failure ?? 'no_answer' };
  const fresh = roster.find((row) => row.id === sent.id);
  if (fresh === undefined || !opensAssignRoles(fresh)) return { kind: 'gone' };
  return savedAsPicked(fresh, sent.ticks) ? null : { kind: 'failed' };
}
