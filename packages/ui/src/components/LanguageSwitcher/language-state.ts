import type { AgentLanguage, LanguageContentState } from './LanguageSwitcher.types';

/** The state of one language, from its own counts. `state` on the item always wins. */
export function stateOf(item: AgentLanguage, total: number | null): LanguageContentState {
  if (item.state !== undefined) {
    return item.state;
  }
  const written = item.written;
  if (written === undefined) {
    return 'authored';
  }
  if (written <= 0) {
    return 'empty';
  }
  if (total !== null && written < total) {
    return 'inherited';
  }
  return 'authored';
}

/** The fraction the strip is measured against, when the caller has not stated it. */
export function totalOf(languages: AgentLanguage[], sections: number | undefined): number | null {
  if (sections !== undefined) {
    return sections;
  }
  const widest = languages.reduce((m, l) => Math.max(m, l.of ?? 0), 0);
  return widest === 0 ? null : widest;
}

/** The summary is about the WORK, not the switcher: how many of the six are written at all. */
export function summaryLine(
  languages: AgentLanguage[],
  total: number | null,
  sectionNoun: string,
): string {
  const writtenLangs = languages.filter((l) => stateOf(l, total) !== 'empty').length;
  const plural = languages.length === 1 ? '' : 's';
  const each = total === null ? '' : ` · ${total} ${sectionNoun} each`;
  return `Written in ${writtenLangs} of ${languages.length} agent language${plural}${each}`;
}

/**
 * The selected language's sentence — a fraction says how much, only words say what.
 * "Marathi · 5 of 8 sections written here · 3 fall back to Hindi".
 */
export function selectedSentence(
  cur: AgentLanguage | undefined,
  total: number | null,
  sectionNoun: string,
  fallbackName: string,
): string {
  if (cur === undefined) {
    return '';
  }
  const written = cur.written;
  if (cur.primary === true) {
    return total !== null && written !== undefined
      ? `${cur.label} is the primary agent language · ${written} of ${total} ${sectionNoun} written · nothing falls back`
      : `${cur.label} is the primary agent language · everything else falls back to it`;
  }
  const state = stateOf(cur, total);
  if (state === 'empty') {
    return `Nothing written in ${cur.label} yet · all ${total ?? ''} ${sectionNoun} fall back to ${fallbackName}`.replace(
      '  ',
      ' ',
    );
  }
  if (state === 'inherited' && total !== null && written !== undefined) {
    return `${cur.label} · ${written} of ${total} ${sectionNoun} written here · ${total - written} fall back to ${fallbackName}`;
  }
  return total !== null && written !== undefined
    ? `${cur.label} · ${written} of ${total} ${sectionNoun} written here · nothing falls back`
    : `${cur.label} · written here`;
}

/**
 * The whole fact in the accessible name: a screen-reader user gets the sentence the sighted reader
 * assembles from a pill, a fraction and a glyph.
 */
export function spokenName(
  item: AgentLanguage,
  total: number | null,
  sectionNoun: string,
  fallbackName: string,
  showFraction: boolean,
): string {
  const written = item.written;
  const fraction =
    showFraction && total !== null && written !== undefined
      ? `, ${written} of ${total} ${sectionNoun}`
      : '';
  if (item.primary === true) {
    return `${item.label}, primary agent language${fraction === '' ? '' : `${fraction} written`}`;
  }
  const state = stateOf(item, total);
  if (state === 'empty') {
    return `${item.label}, nothing written, falls back to ${fallbackName}`;
  }
  if (state === 'inherited' && total !== null && written !== undefined) {
    return `${item.label}, ${written} of ${total} ${sectionNoun} written here, ${total - written} fall back to ${fallbackName}`;
  }
  return `${item.label}, written here${fraction}`;
}
