import { useSettingsScreen } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT, type SettingsRow } from '@heliogrid/domain';
import { settingsListFor, settingsWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useInstantMove, usePrefetch, useShownPath } from '../../../lib/instant-move';
import { DOOR_PATH, settingsRowPath } from '../constants';

/**
 * `useSettingsScreen()` — the phone's too — in the reader's language, with the way a row opens its
 * page on the web: one answer for the list page behind `More` and the side list beside every
 * settings page, so the two never disagree. A press lights its row at once, and every row's page
 * is loaded before it is pressed.
 */
export function useSettingsList() {
  const t = useTranslate();
  const settings = useSettingsScreen();
  const move = useInstantMove();
  const list = settingsListFor(t, settings.roles);
  usePrefetch(list.groups.flatMap((group) => group.rows.map((row) => pathOf(row.key))));
  const words = settingsWords(t);
  return {
    list,
    summary: words.summary,
    hints: words.hints,
    person: { name: settings.personName },
    open: (row: SettingsRow) => move(pathOf(row)),
    first: settings.firstBeside,
    openedRow: settings.openedRow,
    /** The row whose page is in view, or on its way: the segment under `More`, else null. */
    shownSegment: segmentUnderMore(useShownPath()),
  };
}

const pathOf = (row: SettingsRow): string => settingsRowPath(SETTINGS_SEGMENT[row]);

function segmentUnderMore(path: string): string | null {
  const prefix = `${DOOR_PATH.more}/`;
  return path.startsWith(prefix) ? (path.slice(prefix.length).split('/')[0] ?? null) : null;
}
