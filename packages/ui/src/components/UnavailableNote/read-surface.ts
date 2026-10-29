import type { Read } from '@heliogrid/domain';
import type { SurfaceState } from './UnavailableNote.types';

export interface ReadSurface {
  readonly state: SurfaceState;
  /** Set exactly when the read failed: a failed read always carries its retry. */
  readonly onRetry?: () => void;
}

/**
 * **The one way a read reaches a design-system component** — `Block`, `Card`, `DataTable`,
 * `Sheet` and the rest take `state` and `onRetry` as the design system declares them, so a screen
 * spreads `{...readSurface(read)}` and never writes a state by hand (`hand-state.grit`).
 */
export function readSurface(read: Read<unknown>): ReadSurface {
  switch (read.kind) {
    case 'loading':
      return { state: 'loading' };
    case 'empty':
      return { state: 'empty' };
    case 'failed':
      return { state: 'error', onRetry: read.retry };
    case 'ready':
      return { state: 'ready' };
  }
}
