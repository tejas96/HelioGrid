import type {
  ActivityEntry,
  ActivityKindLook,
  ActivityKindSpec,
  ActivityStreamWords,
} from './ActivityStream.types';

/**
 * The default kind registry's look; each kind's name is the words' `kind`. OPEN: an unknown kind
 * renders with a neutral mark and its code as its name, so a screen with its own vocabulary works
 * without editing this file — `SCR-M12-02`'s dunning steps and `SCR-M11-02`'s reversal pairs each
 * name their own.
 */
export const ACTIVITY_KINDS: Record<string, ActivityKindLook> = {
  note: { tone: 'neutral', glyph: 'note' },
  call: { tone: 'accent', glyph: 'phone' },
  'agent-call': { tone: 'info', glyph: 'phone' },
  stage: { tone: 'accent', glyph: 'flag' },
  assignment: { tone: 'neutral', glyph: 'user' },
  proposal: { tone: 'accent', glyph: 'doc' },
  'link-open': { tone: 'info', glyph: 'link' },
  survey: { tone: 'success', glyph: 'clipboard' },
  design: { tone: 'accent', glyph: 'grid' },
  'sign-off': { tone: 'success', glyph: 'check' },
  payment: { tone: 'success', glyph: 'rupee' },
  document: { tone: 'neutral', glyph: 'doc' },
  task: { tone: 'warning', glyph: 'check' },
  system: { tone: 'neutral', glyph: 'cog' },
  dunning: { tone: 'warning', glyph: 'bell' },
  reversal: { tone: 'danger', glyph: 'undo' },
};

/** The caller's registry wins, then the default, then a neutral dot named by the words. */
export function kindOf(
  kinds: Record<string, ActivityKindSpec>,
  kind: string,
  name: ActivityStreamWords['kind'],
): Required<ActivityKindSpec> {
  const spec = kinds[kind];
  const look = spec ?? ACTIVITY_KINDS[kind];
  return {
    label: spec?.label ?? name(kind),
    tone: look?.tone ?? 'neutral',
    glyph: look?.glyph ?? 'dot',
  };
}

export const asDate = (value: ActivityEntry['at']): Date =>
  value instanceof Date ? value : new Date(value);

export const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

/** Local calendar day, so two entries either share a heading or they do not. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 24-hour storage; the market pack's clock turns it into what the reader sees. */
export function hhmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export interface ActivityGroup {
  key: string;
  date: Date;
  items: ActivityEntry[];
}

/** Sorted by `at`, newest first unless asked otherwise. Never memoised — see ActivityStream.tsx. */
export function sortEntries(entries: ActivityEntry[], order: 'newest' | 'oldest'): ActivityEntry[] {
  const sorted = [...entries].sort((a, b) => asDate(a.at).getTime() - asDate(b.at).getTime());
  return order === 'newest' ? sorted.reverse() : sorted;
}

/** Day grouping is what makes hundreds of entries legible without reading them. */
export function groupEntries(entries: ActivityEntry[], groupBy: 'day' | 'none'): ActivityGroup[] {
  const groups: ActivityGroup[] = [];
  for (const entry of entries) {
    const date = asDate(entry.at);
    const key = groupBy === 'day' && isValidDate(date) ? dayKey(date) : 'all';
    const last = groups[groups.length - 1];
    if (last !== undefined && last.key === key) last.items.push(entry);
    else groups.push({ key, date, items: [entry] });
  }
  return groups;
}
