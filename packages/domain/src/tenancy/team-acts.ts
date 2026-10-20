import { keepsControl } from '../authz/administration';
import { FOUNDER_ROLE, type RolePreset } from '../authz/roles';
import type { TeamRow } from './team-roster';

/**
 * What the Team screen's row acts decide (`M01-19`, `SCR-M01-12`), once for both platforms
 * (Law 11): which act a row offers and whether it is off, what an answer to it means, and the
 * words a confirm needs from the rows. The server decides every write; these only read.
 */

/** The one act on a row: end a person's access, withdraw an open invite, send a run-out one again. */
export type TeamAct = 'deactivate' | 'revoke' | 'invite-again';

export interface TeamRowAct {
  readonly act: TeamAct;
  /** The act shows but cannot run — the only EPC Owner's own *Deactivate* (F2-19). */
  readonly off: boolean;
}

/**
 * A row's act. `roster` is the WHOLE list `teamRoster` built, never the rows a search or a Status
 * chip left in view: an Owner the search hides still keeps the company in control.
 */
export function teamRowAct(row: TeamRow, roster: readonly TeamRow[]): TeamRowAct | null {
  if (row.status === 'invited') return { act: 'revoke', off: false };
  if (row.status === 'expired') return { act: 'invite-again', off: false };
  if (row.status === 'deactivated') return null;
  const heldByOthers = roster
    .filter((other) => other.status === 'active' && other.id !== row.id)
    .flatMap((other) => other.roles);
  return { act: 'deactivate', off: !keepsControl(heldByOthers) };
}

/** The confirm a row act opens: shut, asking, or refused because the last EPC Owner would go. */
export type TeamConfirmState =
  | { readonly kind: 'shut' }
  | {
      readonly kind: 'asking';
      readonly act: Exclude<TeamAct, 'invite-again'>;
      readonly row: TeamRow;
      readonly busy: boolean;
    }
  | { readonly kind: 'refused'; readonly row: TeamRow; readonly lostOwner: string | null };

/** An answer to a write, as the client read it; null when none came. */
export type TeamActAnswer = { readonly status: number; readonly code: string } | null;

/**
 * What an answer means to the screen: `done` it landed · `refresh` it changed elsewhere first, read
 * again and say nothing · `refused` the last EPC Owner would go, show the refused form · `forbidden`
 * the reader no longer manages the team · `say` Invite again was turned down, say why · `failed`
 * nothing usable came back.
 */
export type TeamActOutcome = 'done' | 'refresh' | 'refused' | 'forbidden' | 'say' | 'failed';

export function teamActOutcome(act: TeamAct, answer: TeamActAnswer): TeamActOutcome {
  if (answer === null) return 'failed';
  const { status, code } = answer;
  if (status >= 200 && status < 300) return 'done';
  if (status === 403) return 'forbidden';
  if (status === 404 || status === 409) return 'refresh';
  if (act === 'deactivate' && status === 422 && code === 'LAST_OWNER') return 'refused';
  if (act === 'invite-again' && (status === 422 || status === 429)) return 'say';
  return 'failed';
}

const holdsOwner = (row: TeamRow) => row.status === 'active' && row.roles.includes(FOUNDER_ROLE);

/**
 * The one person who was an active EPC Owner in `before` and is not in `after` — the name the
 * refused form gives. None, or more than one, gives null: the form then names no one. The reader is
 * never named: losing their own preset is refused as forbidden, not as this.
 */
export function ownerLostBetween(
  before: readonly TeamRow[],
  after: readonly TeamRow[],
): string | null {
  const stillOwners = new Set(after.filter(holdsOwner).map((row) => row.id));
  const lost = before.filter((row) => holdsOwner(row) && !row.isViewer && !stillOwners.has(row.id));
  return lost.length === 1 ? (lost[0]?.name ?? null) : null;
}

/** The send *Invite again* makes: a run-out invite's name, phone and presets; nothing for any other row. */
export function inviteAgainOf(
  row: TeamRow,
): { inviteeName: string; phoneE164: string; roles: RolePreset[] } | null {
  if (row.status !== 'expired') return null;
  return { inviteeName: row.name, phoneE164: row.phoneE164, roles: [...row.roles] };
}

/** The first word of a stored name — what a confirm and a toast call a person (owner ruling D6 A). */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/u)[0] ?? '';
}

/** What the screen tells the person once an act settles; its words are the screen's. */
export type TeamActNote =
  | { readonly kind: 'deactivated'; readonly name: string }
  | { readonly kind: 'revoked'; readonly name: string }
  /** It landed, or had already changed elsewhere: nothing is said, the list moved. */
  | { readonly kind: 'moved' }
  | { readonly kind: 'turned-down'; readonly code: string }
  | { readonly kind: 'failed' };

/** The note an act's outcome leaves: what landed, why it was turned down, or that the list moved. */
export function teamActNote(
  act: TeamAct,
  outcome: TeamActOutcome,
  name: string,
  code: string,
): TeamActNote {
  if (outcome === 'say') return { kind: 'turned-down', code };
  if (outcome === 'failed') return { kind: 'failed' };
  if (outcome === 'done' && act === 'deactivate') return { kind: 'deactivated', name };
  if (outcome === 'done' && act === 'revoke') return { kind: 'revoked', name };
  return { kind: 'moved' };
}

/**
 * Whether the act's row moved or left with the note, so focus goes to the search field; a turned-down
 * or failed act leaves its button where it was (AC-21).
 */
export function noteLeavesRow(note: TeamActNote): boolean {
  return note.kind !== 'turned-down' && note.kind !== 'failed';
}
