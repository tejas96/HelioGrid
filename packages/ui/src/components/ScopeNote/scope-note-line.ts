import type { ScopeNoteSpec } from './ScopeNote.types';

/** "approve pricing, raise an invoice or write off a balance". */
export function joinActs(acts: ScopeNoteSpec['acts']): string {
  if (acts === undefined) {
    return '';
  }
  const list = (Array.isArray(acts) ? acts : [acts]).filter((act) => act !== '');
  if (list.length === 0) {
    return '';
  }
  const last = list[list.length - 1];
  if (list.length === 1 || last === undefined) {
    return list[0] ?? '';
  }
  return `${list.slice(0, -1).join(', ')} or ${last}`;
}

/**
 * The first sentence, composed: whose act it is. `title` replaces it outright where a screen needs
 * its own words. Null when there is nothing to say — the caller then renders nothing.
 *
 * Shared by both platform halves so the sentence cannot drift between them.
 */
export function composeScopeLine({ holder, acts, title }: ScopeNoteSpec): string | null {
  if (title !== undefined) {
    return title;
  }
  const phrase = joinActs(acts);
  if (holder !== undefined) {
    return phrase === '' ? `Only ${holder} can act on this.` : `Only ${holder} can ${phrase}.`;
  }
  if (phrase === '') {
    return null;
  }
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} is not yours to take.`;
}

/** The type floor is 12px; the prop's default is 13. */
export function scopeNoteSize(size: number | undefined): number {
  return Math.max(12, size ?? 13);
}
