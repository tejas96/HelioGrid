import type { ActivityEntry, ActivityKindSpec } from './ActivityStream.types';

/**
 * The default kind registry. OPEN: an unknown kind renders with a neutral mark and a humanised
 * label, so a screen with its own vocabulary works without editing this file — `SCR-M12-02`'s
 * dunning steps and `SCR-M11-02`'s reversal pairs each name their own.
 */
export const ACTIVITY_KINDS: Record<string, ActivityKindSpec> = {
  note: { label: 'Note', tone: 'neutral', glyph: 'note' },
  call: { label: 'Call', tone: 'accent', glyph: 'phone' },
  'agent-call': { label: 'Agent call', tone: 'info', glyph: 'phone' },
  stage: { label: 'Stage change', tone: 'accent', glyph: 'flag' },
  assignment: { label: 'Assignment', tone: 'neutral', glyph: 'user' },
  proposal: { label: 'Proposal', tone: 'accent', glyph: 'doc' },
  'link-open': { label: 'Link opened', tone: 'info', glyph: 'link' },
  survey: { label: 'Survey', tone: 'success', glyph: 'clipboard' },
  design: { label: 'Design', tone: 'accent', glyph: 'grid' },
  'sign-off': { label: 'Sign-off', tone: 'success', glyph: 'check' },
  payment: { label: 'Payment', tone: 'success', glyph: 'rupee' },
  document: { label: 'Document', tone: 'neutral', glyph: 'doc' },
  task: { label: 'Task', tone: 'warning', glyph: 'check' },
  system: { label: 'System', tone: 'neutral', glyph: 'cog' },
  dunning: { label: 'Dunning', tone: 'warning', glyph: 'bell' },
  reversal: { label: 'Reversal', tone: 'danger', glyph: 'undo' },
};

/** "link-open" → "Link open". What an unregistered kind is called until a screen names it. */
export function humanise(kind: string): string {
  const words = String(kind).replace(/[-_]/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The caller's registry wins, then the default, then a neutral dot with a humanised label. */
export function kindOf(
  kinds: Record<string, ActivityKindSpec>,
  kind: string,
): Required<ActivityKindSpec> {
  const spec = kinds[kind] ?? ACTIVITY_KINDS[kind];
  return {
    label: spec?.label ?? humanise(kind),
    tone: spec?.tone ?? 'neutral',
    glyph: spec?.glyph ?? 'dot',
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
