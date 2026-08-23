import { useEffect, useState } from 'react';
import { commitDraft, displayNumber, nudgeValue } from './NumberField.logic';
import type { OutOfRangeMode } from './NumberField.types';

export interface NumberDraftOptions {
  value: number;
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step: number;
  precision?: number;
  currency: boolean;
  unit?: string;
  outOfRange: OutOfRangeMode;
  correctionMessage?: string;
}

export interface NumberDraftState {
  draft: string;
  correction: string | null;
  /** The generated constraint clause — the platform half composes it with `refusalPath`. */
  refusal: string | null;
  focus: boolean;
  setDraft: (next: string) => void;
  /** Focusing clears a correction and a refusal; it never touches the caller's `error`. */
  onFocus: () => void;
  onBlur: () => void;
  /** Blur or Enter. */
  commit: () => void;
  /** Escape — the edit is abandoned and the last good value returns. */
  cancel: () => void;
  nudge: (direction: 1 | -1) => void;
}

/**
 * The draft, the commit and the two notes — one implementation for both platforms.
 *
 * The rules it holds: commit ONCE on blur or Enter, never per keystroke; empty or invalid never
 * commits; a correction and a refusal are cleared by focus because they were about the last
 * keystroke, while the caller's `error` is not this hook's business at all.
 */
export function useNumberFieldDraft(opts: NumberDraftOptions): NumberDraftState {
  const { value, onCommit } = opts;
  const [draft, setDraft] = useState(() => displayNumber(value));
  const [correction, setCorrection] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    if (!focus) setDraft(displayNumber(value));
  }, [value, focus]);

  const clearNotes = () => {
    setCorrection(null);
    setRefusal(null);
  };

  const restore = () => {
    setDraft(displayNumber(value));
    clearNotes();
  };

  const commit = () => {
    const outcome = commitDraft({ ...opts, draft });
    if (outcome.kind === 'restore') {
      restore();
      return;
    }
    if (outcome.kind === 'refuse') {
      setDraft(displayNumber(value));
      setCorrection(null);
      setRefusal(outcome.constraint);
      return;
    }
    setRefusal(null);
    setDraft(displayNumber(outcome.value));
    setCorrection(outcome.correction);
    if (outcome.value !== value) onCommit?.(outcome.value);
  };

  const nudge = (direction: 1 | -1) => {
    const next = nudgeValue({ ...opts, draft, direction });
    setDraft(displayNumber(next));
    clearNotes();
    onCommit?.(next);
  };

  return {
    draft,
    correction,
    refusal,
    focus,
    setDraft,
    onFocus: () => {
      setFocus(true);
      clearNotes();
      setDraft(displayNumber(value));
    },
    onBlur: () => {
      setFocus(false);
      commit();
    },
    commit,
    cancel: restore,
    nudge,
  };
}
