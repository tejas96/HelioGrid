import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { ScopeNoteSpec } from './ScopeNote.types';

/** The acts as a list, the empty ones dropped. */
function actsOf(acts: ScopeNoteSpec['acts']): TranslatedText[] {
  if (acts === undefined) {
    return [];
  }
  return (Array.isArray(acts) ? acts : [acts]).filter((act) => act !== '');
}

/**
 * The first sentence, composed: whose act it is. `title` replaces it outright where a screen needs
 * its own words. Null when there is nothing to say — the caller then renders nothing.
 *
 * Shared by both platform halves so the sentence cannot drift between them.
 */
export function composeScopeLine(spec: ScopeNoteSpec): TranslatedText | null {
  if (spec.title !== undefined) {
    return spec.title;
  }
  const acts = actsOf(spec.acts);
  if (spec.holder !== undefined) {
    return spec.words.onlyHolder(spec.holder, acts);
  }
  return acts.length === 0 ? null : spec.words.notYours(acts);
}

/** The type floor is 12px; the prop's default is 13. */
export function scopeNoteSize(size: number | undefined): number {
  return Math.max(12, size ?? 13);
}

/** A plain spec object, as opposed to any of the object shapes ReactNode itself allows. */
function isScopeNoteSpec(value: ScopeNoteSpec | ReactNode): value is ScopeNoteSpec {
  return (
    typeof value === 'object' &&
    value !== null &&
    !isValidElement(value) &&
    !(Symbol.iterator in value) &&
    !('then' in value)
  );
}

/** What a `scope` host prop draws: a ready node as it is, a spec through `draw`, or nothing. */
export function scopeNoteFor(
  spec: ScopeNoteSpec | ReactNode,
  draw: (spec: ScopeNoteSpec) => ReactNode,
): ReactNode {
  if (spec === undefined || spec === null || spec === false || spec === '') {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  return isScopeNoteSpec(spec) ? draw(spec) : null;
}
