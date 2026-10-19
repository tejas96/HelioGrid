import { INVITATION_EXPIRY_DAYS, type RolePreset, roleKind, type TeamRow } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ROLE_KIND_TONE, TEAM_STATUS_TONE } from '../Chip/Chip.logic';
import type { MemberCardProps, MemberListProps, MemberRowWords } from './MemberCard.types';

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
