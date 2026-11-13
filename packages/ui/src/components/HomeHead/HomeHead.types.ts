import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';

/** One held preset's home in the switcher: its title, its preset beside it, the one in force ticked. */
export interface HomeHeadEntry {
  key: string;
  label: TranslatedText;
  /** The preset — two presets share "My Day" and two "Owner Dashboard", so the title alone is ambiguous. */
  meta: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * The home's head (`SCR-SHELL-01`, redesign direction A): today's date, the greeting for the hour
 * in the display face, the home's title as the switcher (`M13-10`) with the line saying whose home
 * this is, and the role's verb as THE action — prominent at both widths, never a small button.
 * The page's one heading still names the home; the greeting is its welcome, not its name.
 */
export interface HomeHeadProps {
  /** "Today · 2 Oct 2026" — today in the market's style, the words the caller's. */
  // biome-ignore lint/plugin/copy-prop-type: a date the market pack formats
  dateLine: string;
  /** "Good morning, Arjun" — the part of the day and the person's first name. */
  greeting: TranslatedText;
  /** The day in counts under the greeting, where a home has one ("7 overdue · 15 today · 4 done"). */
  summary?: TranslatedText | undefined;
  title: TranslatedText;
  /** The title button's accessible name: the title, and that it switches. */
  switchName: string;
  /** The switcher list's accessible name. */
  switchLabel: TranslatedText;
  /** Every held preset's home, in ladder order. One entry still opens the switcher. */
  entries: HomeHeadEntry[];
  /** Whose home this is (`M13-10`): "Sales Executive home · you also hold Survey Engineer". */
  presetLine: TranslatedText;
  /** The switcher's width: the phone spans its column, the desktop's is the drawing's 284. */
  switcherWidth: number;
  /** What the switcher's coach mark points at (`M01-16`): a ref the head binds to the title. */
  titleAnchor?: CoachMarkAnchor;
  /** The role's verb (*Add lead*), a `prominent` button: beside the titles on a wide screen, under them on a phone. */
  action?: ReactNode;
}
