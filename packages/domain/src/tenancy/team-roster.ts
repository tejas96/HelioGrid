import { INVITATION_EXPIRY_DAYS, type InvitationStatus } from '../auth/invitation-policy';
import { inMatrixOrder, type RolePreset } from '../authz/roles';
import type { UiLanguage } from '../format/languages';
import { MS_PER_DAY } from '../format/zone';
import type { MembershipStatus } from './membership';

/**
 * The Team screen's one list (`M01-19`, `SCR-M01-12`), built once for both platforms (Law 11): the
 * roster and the invites joined, ordered and narrowed. Screens render these rows and decide none
 * of it.
 */

/** Where a row stands: an invite still open or run out, or a person on the team or let go. */
export const TEAM_ROW_STATUSES = ['invited', 'expired', 'active', 'deactivated'] as const;
export type TeamRowStatus = (typeof TEAM_ROW_STATUSES)[number];
export type TeamStatusFilter = 'all' | TeamRowStatus;

/** A roster row as the server sends it (`GET /tenants/me/members`). */
export interface RosterMember {
  readonly membershipId: string;
  readonly userId: string;
  readonly name: string;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
  readonly status: MembershipStatus;
  readonly lastActiveAt: string | null;
}

/** An invitation as the server sends it (`GET /invitations`). */
export interface RosterInvite {
  readonly id: string;
  readonly inviteeName: string;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
  readonly status: InvitationStatus;
  readonly sentAt: string;
  readonly expiresAt: string;
}

export interface TeamRow {
  /** The membership's id, or the invitation's. */
  readonly id: string;
  readonly name: string;
  readonly phoneE164: string;
  /** In F2's order (F2-25), every one held — the list shows them all (F2-10). */
  readonly roles: readonly RolePreset[];
  readonly status: TeamRowStatus;
  readonly isViewer: boolean;
  /** A member's last activity; null for an invite, and for a member never seen. */
  readonly lastActiveAt: string | null;
  /** An invite's expiry; null for a member. */
  readonly expiresAt: string | null;
  /** Which of its seven days an open invite is on, 1 to 7; null for anything else. */
  readonly inviteDay: number | null;
}

export interface TeamRosterView {
  readonly rows: readonly TeamRow[];
  /** Each chip's count, over the rows the search matches. */
  readonly counts: Readonly<Record<TeamStatusFilter, number>>;
  /** The heading's two counts, over the whole list: active plus deactivated, open plus run out. */
  readonly people: number;
  readonly invites: number;
  /** Only the reader is on the list: the screen teaches instead (`empty-teaching`). */
  readonly onlyViewer: boolean;
}

const ORDER: Record<TeamRowStatus, number> = { invited: 0, expired: 1, active: 2, deactivated: 3 };

function memberRow(member: RosterMember, viewerUserId: string): TeamRow | null {
  /* A membership is never written `invited`: an open invite is an invitation, listed as one. */
  if (member.status === 'invited') return null;
  return {
    id: member.membershipId,
    name: member.name,
    phoneE164: member.phoneE164,
    roles: inMatrixOrder(member.roles),
    status: member.status,
    isViewer: member.userId === viewerUserId,
    lastActiveAt: member.lastActiveAt,
    expiresAt: null,
    inviteDay: null,
  };
}

function inviteRow(invite: RosterInvite, now: number): TeamRow {
  const sent = Date.parse(invite.sentAt);
  const open = invite.status === 'pending' && now < Date.parse(invite.expiresAt);
  const daysGone = Math.floor((now - sent) / MS_PER_DAY);
  return {
    id: invite.id,
    name: invite.inviteeName,
    phoneE164: invite.phoneE164,
    roles: inMatrixOrder(invite.roles),
    status: open ? 'invited' : 'expired',
    isViewer: false,
    lastActiveAt: null,
    expiresAt: invite.expiresAt,
    inviteDay: open ? Math.min(INVITATION_EXPIRY_DAYS, Math.max(1, daysGone + 1)) : null,
  };
}

/** The newest open-or-run-out invite for each phone that is not already on the team. */
function listedInvites(members: readonly RosterMember[], invites: readonly RosterInvite[]) {
  const onTeam = new Set(members.map((member) => member.phoneE164));
  const newest = new Map<string, RosterInvite>();
  for (const invite of invites) {
    if (invite.status !== 'pending' && invite.status !== 'expired') continue;
    if (onTeam.has(invite.phoneE164)) continue;
    const held = newest.get(invite.phoneE164);
    if (!held || Date.parse(invite.sentAt) > Date.parse(held.sentAt)) {
      newest.set(invite.phoneE164, invite);
    }
  }
  return [...newest.values()];
}

/** Open invites, run-out invites, people on the team, people let go — each by name (AC-10). */
export function teamRoster(
  members: readonly RosterMember[],
  invites: readonly RosterInvite[],
  viewerUserId: string,
  now: number,
  language: UiLanguage,
): TeamRow[] {
  const byName = new Intl.Collator(language).compare;
  return [
    ...members.flatMap((member) => memberRow(member, viewerUserId) ?? []),
    ...listedInvites(members, invites).map((invite) => inviteRow(invite, now)),
  ].sort((a, b) => ORDER[a.status] - ORDER[b.status] || byName(a.name, b.name));
}

function matches(row: TeamRow, query: string): boolean {
  const words = query.trim().toLocaleLowerCase();
  return words === '' || row.name.toLocaleLowerCase().includes(words);
}

/** What *Find in this list* and the Status chips leave in view, and the counts they show (AC-7). */
export function teamRosterView(
  rows: readonly TeamRow[],
  query: string,
  status: TeamStatusFilter,
): TeamRosterView {
  const found = rows.filter((row) => matches(row, query));
  const count = (wanted: TeamRowStatus, among: readonly TeamRow[]) =>
    among.filter((row) => row.status === wanted).length;
  return {
    rows: status === 'all' ? found : found.filter((row) => row.status === status),
    counts: {
      all: found.length,
      invited: count('invited', found),
      expired: count('expired', found),
      active: count('active', found),
      deactivated: count('deactivated', found),
    },
    people: count('active', rows) + count('deactivated', rows),
    invites: count('invited', rows) + count('expired', rows),
    onlyViewer: rows.length === 1 && rows[0]?.isViewer === true,
  };
}

/** Where the Team list's reads stand: still out, all answered, or one got no answer. */
export type TeamLoad = 'loading' | 'failed' | 'ready';

/**
 * What the list area shows: the wait, the failure, the teaching state, no match for the words, a
 * Status chip with nobody under it, or the rows.
 */
export type TeamSurface = TeamLoad | 'teaching' | 'no-match' | 'empty-chip';

/** The Status chips, *All* first, then each status in the list's order. */
export const TEAM_STATUS_FILTERS: readonly TeamStatusFilter[] = ['all', ...TEAM_ROW_STATUSES];

/** A chip's value read back as a filter; anything else is no filter. */
export function teamStatusFilterOf(value: string): TeamStatusFilter | null {
  return TEAM_STATUS_FILTERS.find((filter) => filter === value) ?? null;
}

/**
 * Which body the Team list shows (`SCR-M01-12`). Teaching only while the reader is alone and nothing
 * narrows the list; no match only when the words typed find no one at all — words that find someone
 * a Status chip leaves out say the chip is empty, never that nobody matches.
 */
export function teamSurface(
  load: TeamLoad,
  view: TeamRosterView,
  query: string,
  status: TeamStatusFilter,
): TeamSurface {
  if (load !== 'ready') return load;
  const searched = query.trim() !== '';
  if (view.onlyViewer && !searched && status === 'all') return 'teaching';
  if (searched && view.counts.all === 0) return 'no-match';
  if (view.rows.length === 0) return 'empty-chip';
  return 'ready';
}

/** The search and the Status chips show over a list; the wait shows them too, a failure and the teaching state do not. */
export function showsListHead(surface: TeamSurface): boolean {
  return surface !== 'failed' && surface !== 'teaching';
}
