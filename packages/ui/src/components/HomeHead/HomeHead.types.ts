import type { ReactNode } from 'react';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';

/** One held preset's home in the switcher: its title, its preset beside it, the one in force ticked. */
export interface HomeHeadEntry {
  key: string;
  label: string;
  /** The preset — two presets share "My Day" and two "Owner Dashboard", so the title alone is ambiguous. */
  meta: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * The home's head (`SCR-SHELL-01`): today's date, the title that IS the switcher (`M13-10`, the
 * export's decision 4) and the line saying whose home this is — the first band of the content
 * region at both widths. Every word arrives as a prop.
 */
export interface HomeHeadProps {
  /** "Today · 2 Oct 2026" — today in the market's style, the words the caller's. */
  dateLine: string;
  title: string;
  /** The title button's accessible name: the title, and that it switches. */
  switchName: string;
  /** The switcher list's accessible name. */
  switchLabel: string;
  /** Every held preset's home, in ladder order. One entry still opens the switcher. */
  entries: HomeHeadEntry[];
  /** Whose home this is (`M13-10`): "Sales Executive home · you also hold Survey Engineer". */
  presetLine: string;
  /** The switcher's width: the phone spans its column, the desktop's is the drawing's 284. */
  switcherWidth: number;
  /** What the switcher's coach mark points at (`M01-16`): a ref the head binds to the title. */
  titleAnchor?: CoachMarkAnchor;
  /** The head's primary action at the row's end — the desktop's verb button. The phone has none. */
  action?: ReactNode;
}
