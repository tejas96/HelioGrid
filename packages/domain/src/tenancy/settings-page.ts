/**
 * What every settings page with one act bar shares (`SCR-M01-18`, `SCR-M01-19`): the standing line
 * under its title, and one test of whether a draft still equals what is saved.
 */

/** Who saved last, as a page's read carries it: absent from an api built before it was kept. */
export interface SettingsLastSave {
  readonly at: string;
  readonly by: { readonly name: string | null } | null;
}

/** What the standing line under the title says. */
export type SettingsStanding =
  | { readonly kind: 'saved'; readonly at: number; readonly name: string | null }
  | { readonly kind: 'saved-unknown' }
  | { readonly kind: 'never-set' };

/** The line for a save the read names; `null` when it names none, which each page reads its own way. */
export function standingOf(
  changed: SettingsLastSave | null | undefined,
): Extract<SettingsStanding, { kind: 'saved' }> | null {
  return changed === undefined || changed === null
    ? null
    : { kind: 'saved', at: Date.parse(changed.at), name: changed.by?.name ?? null };
}

/**
 * Two values hold the same content however they were built — object keys in any order, `undefined`
 * keys dropped. A draft compares itself with what is saved through this, so moving a field and
 * moving it back reads as unchanged.
 */
export function sameContent(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b);
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, held: unknown) =>
    held !== null && typeof held === 'object' && !Array.isArray(held)
      ? Object.fromEntries(Object.entries(held).sort(([a], [b]) => a.localeCompare(b)))
      : held,
  );
}
