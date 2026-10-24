import {
  INVITATION_EXPIRY_DAYS,
  type RolePreset,
  roleKind,
  type TeamAct,
  type TeamRow,
  teamRowAct,
} from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ROLE_KIND_TONE, TEAM_STATUS_TONE } from '../Chip/Chip.logic';
import type {
  MemberActProps,
  MemberCardProps,
  MemberListProps,
  MemberRowWords,
  TeamConfirmProps,
} from './MemberCard.types';

/**
 * One list row as the member card draws it (`SCR-M01-12`): its status as the dot's tone, each
 * preset in its kind's iris tone and the caller's words, and an open invite's share of its seven
 * days. Both apps call this one mapping, so the two cards cannot disagree.
 */
export function memberCardOf(
  row: TeamRow,
  words: MemberRowWords,
  roleName: (preset: RolePreset) => string,
  youLabel: string,
): MemberCardProps {
  return {
    name: row.name,
    mark: TEAM_STATUS_TONE[row.status],
    ...(row.isViewer ? { youLabel } : {}),
    line: words.line,
    roles: row.roles.map((preset) => ({
      label: roleName(preset),
      tone: ROLE_KIND_TONE[roleKind(preset)],
    })),
    ...(row.inviteDay !== null && words.day !== null && words.expires !== null
      ? {
          invite: {
            progress: (row.inviteDay / INVITATION_EXPIRY_DAYS) * 100,
            day: words.day,
            expires: words.expires,
          },
        }
      : {}),
  };
}

/** An empty list's one sentence, its glyph and the act that leaves it. */
export interface MemberListEmpty {
  readonly glyph: ShellGlyphName;
  readonly title: string;
  readonly act: string;
  readonly onAct: () => void;
}

/**
 * The empty state a list body draws, or null: words that find no one (*Clear search*), or a Status
 * chip with nobody under it (*Show all*, owner ruling on `SCR-M01-12`).
 */
export function memberListEmptyOf({
  surface,
  words,
  onClearSearch,
  onShowAll,
}: Pick<
  MemberListProps,
  'surface' | 'words' | 'onClearSearch' | 'onShowAll'
>): MemberListEmpty | null {
  if (surface === 'no-match') {
    return { glyph: 'search', title: words.noMatch, act: words.clearSearch, onAct: onClearSearch };
  }
  if (surface === 'empty-chip' && words.emptyChip !== null) {
    return { glyph: 'people', title: words.emptyChip, act: words.showAll, onAct: onShowAll };
  }
  return null;
}

/** How each act looks: its pill, its words' tone and its glyph (`SCR-M01-12`, design-system change 7). */
export const MEMBER_ACT_LOOK: Record<
  TeamAct,
  {
    variant: 'primary' | 'secondary';
    danger: boolean;
    glyph: ShellGlyphName;
    glyphTone: 'primary' | 'inverse' | 'danger';
  }
> = {
  deactivate: { variant: 'secondary', danger: true, glyph: 'user-minus', glyphTone: 'danger' },
  revoke: { variant: 'secondary', danger: false, glyph: 'undo', glyphTone: 'primary' },
  'invite-again': { variant: 'primary', danger: false, glyph: 'send', glyphTone: 'inverse' },
};

/**
 * A row's act as both apps draw it, judged against the WHOLE `roster` (never the rows a search left in
 * view), or null for a row with none. The words are the caller's.
 */
export function memberActOf(
  row: TeamRow,
  roster: readonly TeamRow[],
  words: {
    act(act: TeamAct): string;
    spoken(act: TeamAct, name: string): string;
    onlyOwner: string;
  },
  sending: string | null,
): Pick<MemberActProps, 'act' | 'label' | 'spokenName' | 'offReason' | 'busy'> | null {
  const offered = teamRowAct(row, roster);
  if (offered === null) return null;
  return {
    act: offered.act,
    label: words.act(offered.act),
    spokenName: words.spoken(offered.act, row.name),
    ...(offered.off ? { offReason: words.onlyOwner } : {}),
    busy: sending === row.id,
  };
}

/**
 * How each confirm look sits on its surfaces: a Team act's (`SCR-M01-12`) as a danger `sm` modal
 * with no handle; a roles removal's (`SCR-M01-13` m-confirm, d-confirm) with a handle and a `md`
 * modal of no tone — the boards draw it so.
 */
export const CONFIRM_LOOK = {
  act: { sheet: { handle: false }, modal: { tone: 'danger', size: 'sm' } },
  roles: { sheet: { handle: true }, modal: { size: 'md' } },
} as const satisfies Record<
  NonNullable<TeamConfirmProps['look']>,
  {
    sheet: { handle: boolean };
    modal: { tone?: 'danger'; size: 'sm' | 'md' };
  }
>;
