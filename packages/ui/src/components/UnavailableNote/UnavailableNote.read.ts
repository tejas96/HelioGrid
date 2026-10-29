import type { SurfaceRead, SurfaceState } from './UnavailableNote.types';

/** The state a read draws. A failed read draws `error`; no read draws `ready` — a frame that holds
 *  static content passes none. */
export function surfaceStateOf(read?: SurfaceRead): SurfaceState {
  if (read === undefined) return 'ready';
  return read.kind === 'failed' ? 'error' : read.kind;
}

/** The retry a read carries. Only a failed read has one, so `error` is the only state that offers it. */
export function retryOf(read?: SurfaceRead): (() => void) | undefined {
  return read?.kind === 'failed' ? read.retry : undefined;
}
