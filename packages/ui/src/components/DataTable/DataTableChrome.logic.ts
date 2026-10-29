import type { TranslatedText } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { pageWindow } from './DataTable.logic';
import type { DataTableWords, PageRange, PaginationProps } from './DataTable.types';

/** The loading table's five placeholder rows — one list, so both halves draw the same number. */
export const TABLE_SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e'] as const;

/** The caption as the reader sees it: marked *continued* on a table that carries on from a page. */
export function captionTextOf(
  caption: TranslatedText | undefined,
  continued: boolean,
  words: DataTableWords,
): TranslatedText | undefined {
  if (caption === undefined) return undefined;
  return continued ? words.continued(caption) : caption;
}

/** The mark on a blocked table's message: the alert on a failed read, the empty table otherwise. */
export function tableMessageMarkOf(tone: 'warning' | undefined): ShellGlyphName {
  return tone === 'warning' ? 'alert-circle' : 'lines-wide';
}

/**
 * **What a row's own line says**: what is wrong, as a warning — else the caller's words for the
 * fix, or the table's own *fixed* line, as a success.
 */
export function rowNoteOf(
  issue: TranslatedText | null,
  fixed: boolean | TranslatedText | null,
  fixedLine: TranslatedText,
): { warn: boolean; text: TranslatedText; glyph: ShellGlyphName } {
  if (issue !== null) return { warn: true, text: issue, glyph: 'alert-circle' };
  return { warn: false, text: typeof fixed === 'string' ? fixed : fixedLine, glyph: 'tick' };
}

/** One pager step: which way it goes, its name, and whether it sits at its end. */
export interface PageStep {
  direction: -1 | 1;
  label: TranslatedText;
  disabled: boolean;
}

/** The pager's span shown, and its two steps — each disabled at its end. */
export function pagerOf({
  page,
  pageSize,
  rowCount,
  previousLabel,
  nextLabel,
}: Pick<PaginationProps, 'page' | 'pageSize' | 'rowCount' | 'previousLabel' | 'nextLabel'>): {
  range: PageRange;
  back: PageStep;
  on: PageStep;
} {
  const { range, last } = pageWindow(page, pageSize, rowCount);
  return {
    range,
    back: { direction: -1, label: previousLabel, disabled: page <= 0 },
    on: { direction: 1, label: nextLabel, disabled: page >= last },
  };
}
