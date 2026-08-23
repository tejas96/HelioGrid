import type { ReactNode } from 'react';

/** Take control of the retry lifecycle. Omit to let the component run its own. */
export type NoConnectionStatus = 'idle' | 'trying' | 'failed';

/**
 * The product's one full-screen "no connection" state. A surface that merely failed a fetch uses
 * its own error state; this is only for when the app can reach nothing at all. Retry is the
 * primary action and reports what actually happened — it never spins under a user indefinitely.
 * Says nothing about sync, because the product queues nothing.
 */
export interface NoConnectionProps {
  title?: string;
  /** Sentence case, states the fact and the fix. Never mentions sync, queues or pending work. */
  message?: string;
  /**
   * The retry. Return `false` or reject to say it failed and the screen will say so; return a
   * promise that resolves to anything else (or nothing at all) and the screen assumes the host is
   * handling it and unmounting this on success.
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: the DS contract is exactly this union — a retry may return nothing at all, an explicit false, or a promise, and each is read differently.
  onRetry?: () => void | boolean | Promise<unknown>;
  /** Verb. Default "Try again". */
  retryLabel?: string;
  /** Shown when a retry came back with nothing. */
  failedMessage?: string;
  /** Shown when a retry never answered inside `retryTimeout`. */
  timeoutMessage?: string;
  /** Milliseconds before an unanswered retry is called unanswered rather than left spinning. */
  retryTimeout?: number;
  /** Take control of the retry lifecycle. Omit to let the component run its own. */
  status?: NoConnectionStatus;
  /** What the app can STILL do without a connection — a link, a secondary action. Omit if none. */
  children?: ReactNode;
  /** Cloud drift and glow breathe. Already off under `prefers-reduced-motion`. */
  animate?: boolean;
  /** Moves focus to the retry button on mount. This screen replaces everything, so default true. */
  autoFocusRetry?: boolean;
  /** Fill the nearest positioned ancestor instead of flowing (device frames, specimen cards). */
  inset?: boolean;
}
