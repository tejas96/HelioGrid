import type { ReactNode } from 'react';
import type { SurfaceState } from '../UnavailableNote';

/**
 * The two fixed participants. Not `ActorClassName`'s four: a third speaker in a call transcript is
 * a data error, not a fifth class. The *words and glyphs* are `ActorClass`'s.
 */
export type TranscriptParty = 'agent' | 'customer';

export interface TranscriptTurn {
  id?: string | number;
  party: TranscriptParty;
  /** What was said. One turn, however long — never pre-truncated by the caller. */
  text: ReactNode;
  /** Seconds into the call. Rendered mono/tabular; a real 44px seek control when `onSeek` is given. */
  at?: number;
  /**
   * The language of **this** turn. Only needed where the call's language actually changed mid-call —
   * the component derives the switch points from it and renders one marker at the change. It is
   * **never** printed on every turn: the label is per transcript.
   */
  language?: string;
  /** Facts true of one turn — a `Badge` for "handed over here", "flagged by the owner". Nodes. */
  marks?: ReactNode;
}

export interface LanguageSwitch {
  to: string;
  /** Seconds into the call, so the header sentence can say "switched to English at 2:38". */
  at?: number;
}

/** The call's language. A string or `{name}`. **Per transcript, not per turn.** */
export type TranscriptLanguage = string | { name: string; code?: string } | null;

export interface TranscriptProps {
  turns: TranscriptTurn[];
  language?: TranscriptLanguage;
  /**
   * A mid-call language change, stated outright (no row permits one; §M07.7's "labelled" forbids
   * asserting one language about a call that changed). Derived from the turns' `language` when
   * absent.
   */
  switches?: LanguageSwitch[];
  /** The participants' names. `agentName` is the tenant's agent, not the class word. */
  agentName?: string;
  customerName?: string;
  title?: string;
  /** The call's identity line — "12 Mar 2026, 4:12 pm · 4 min 12 sec · outbound". */
  meta?: string;
  /** Why the words are here when the audio is not: "Recording deleted 14 Jun 2026 · transcript retained". */
  retainedNote?: string;
  /** Seconds currently playing — marks the turn, so the words and the audio stay in step. */
  currentAt?: number;
  /** Given **only** while the recording is playable. Absent, the offsets stay as legible text. */
  onSeek?: (seconds: number) => void;
  /** Chronological window from the **first** turn (default 40) — the opposite end from `ActivityStream`. */
  visibleCount?: number;
  step?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  /** The whole call's turn count when only a page was handed over. The count line states the whole. */
  total?: number;
  state?: SurfaceState;
  emptyTitle?: string;
  emptyDescription?: string;
  errorMessage?: string;
  onRetry?: () => void;
  unavailableTitle?: string;
  unavailableMessage?: string;
  density?: 'expressive' | 'functional';
}
