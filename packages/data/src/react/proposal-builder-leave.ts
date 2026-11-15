import type { BuilderFrame, BuilderSaveState } from './proposal-builder-frame';

/** The save states in which the screen shows what the server does not hold (`T-M06-023`). */
const HOLDING: ReadonlySet<BuilderSaveState['kind']> = new Set(['unsaved', 'offline', 'conflict']);

/**
 * Whether a way out of the builder asks first: a value kept unsaved, typed with no connection, met
 * by a change from elsewhere, or refused and still on screen would be lost by leaving. A value
 * being saved, or one saved, asks nothing — the draft is the server's. One rule, both apps' guard.
 */
export function builderHoldsChange(
  frame: Pick<BuilderFrame, 'save'> | null,
  refused: number,
): boolean {
  const save = frame?.save ?? null;
  return refused > 0 || (save !== null && HOLDING.has(save.kind));
}
