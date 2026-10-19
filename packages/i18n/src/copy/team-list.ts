import {
  type FormatPack,
  formatClockAt,
  formatDayMonth,
  INVITATION_EXPIRY_DAYS,
  isTenantToday,
  type RolePreset,
  TEAM_STATUS_FILTERS,
  type TeamRow,
  type TeamStatusFilter,
  type UiLanguage,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { presetName } from './shell';
import { SIGN_IN } from './sign-in';
import { TEAM, TEAM_EMPTY_CHIP, type TeamRowWords, teamRowWords, teamStatusWord } from './team';

/** The Team list's words, built once for both apps (`SCR-M01-12`): each screen only places them. */
export interface TeamListWords {
  /** One row's words on the market's clock. */
  row(row: TeamRow): TeamRowWords;
  /** A preset's name, in the reader's words. */
  role(preset: RolePreset): string;
  /** The list's accessible name — *Everyone at <company>*, or *… matching <words>* under a search. */
  label: string;
  loading: string;
  loadFailed: string;
  tryAgain: string;
  alone: string;
  aloneLine: string;
  noMatch: string;
  clearSearch: string;
  /** What the chosen Status chip says with nobody under it; null under *All*, which always holds the reader. */
  emptyChip: string | null;
  showAll: string;
  find: string;
  statusFilter: string;
  you: string;
  /** The Status chips, *All* first, then each status in the list's order. */
  statusOptions: { value: TeamStatusFilter; label: string }[];
}

export function teamListWords(
  translate: Translator['t'],
  facts: {
    pack: FormatPack;
    language: UiLanguage;
    now: number;
    company: string;
    query: string;
    status: TeamStatusFilter;
  },
): TeamListWords {
  const { pack, language, now, company, status } = facts;
  const query = facts.query.trim();
  const clock = {
    dayMonth: (value: string) => formatDayMonth(pack, value, language),
    clockAt: (value: string) => formatClockAt(pack, value),
    isToday: (value: string) => isTenantToday(pack, value, now),
  };
  return {
    row: (row) => teamRowWords(translate, row, clock, INVITATION_EXPIRY_DAYS),
    role: (preset) => presetName(translate, preset),
    label:
      query === ''
        ? translate(TEAM.everyone, { company })
        : translate(TEAM.everyoneMatching, { company, query }),
    loading: translate(TEAM.loading),
    loadFailed: translate(TEAM.loadFailed),
    tryAgain: translate(SIGN_IN.tryAgain),
    alone: translate(TEAM.alone),
    aloneLine: translate(TEAM.aloneLine),
    noMatch: translate(TEAM.noMatch, { query }),
    clearSearch: translate(TEAM.clearSearch),
    emptyChip: status === 'all' ? null : translate(TEAM_EMPTY_CHIP[status]),
    showAll: translate(TEAM.showAll),
    find: translate(TEAM.find),
    statusFilter: translate(TEAM.statusFilter),
    you: translate(TEAM.you),
    statusOptions: TEAM_STATUS_FILTERS.map((filter) => ({
      value: filter,
      label: filter === 'all' ? translate(TEAM.all) : teamStatusWord(translate, filter),
    })),
  };
}
