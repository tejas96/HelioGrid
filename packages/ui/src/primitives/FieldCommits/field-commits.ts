import { createContext, useContext } from 'react';

/**
 * When a field hands its edit up. `on-leave`: once it is left, as the builder's draft saves it.
 * `as-typed`: at each keystroke, for a form with its own *Save* — on touch *Save* never takes focus
 * from the field first, so a field that waited to be left would be saved without its edit
 * (`packages/ui/CLAUDE.md` Traps).
 */
export type FieldCommits = 'on-leave' | 'as-typed';

const FieldCommitsContext = createContext<FieldCommits>('on-leave');

/** A form with its own *Save* wraps its fields in this, set to `as-typed`. */
export const FieldCommitsProvider = FieldCommitsContext.Provider;

/** How the fields here hand their edits up; a field's own `commits` prop wins. */
export function useFieldCommits(): FieldCommits {
  return useContext(FieldCommitsContext);
}
