import { useEffect, useState } from 'react';
import { commitDraft, displayNumber, nudgeValue } from './NumberField.logic';
import type { NumberFieldCommits, OutOfRangeMode } from './NumberField.types';

export interface NumberDraftOptions {
  /** None: the field is unset and edits as an empty draft. */
  value: number | undefined;
  onCommit?: (value: number) => void;
  onClear?: () => void;
  min?: number;
  max?: number;
  step: number;
  precision?: number;
  currency: boolean;
  unit?: string;
  outOfRange: OutOfRangeMode;
  correctionMessage?: string;
  commits: NumberFieldCommits;
  /** How a figure reads while the field is not being edited — a money field, in the market's
   *  money format. Editing always shows the plain figure, which is what is parsed back. */
  idle?: (value: number) => string;
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
 * keystroke, while the caller's `error` is not this hook's business at all. A caller that asks for
 * `as-typed` also hears each figure the draft would commit; the draft and its notes wait for the
 * commit, so nothing is rewritten under the person's fingers.
 */
export function useNumberFieldDraft(opts: NumberDraftOptions): NumberDraftState {
  const { value, onCommit } = opts;
  const resting = (figure: number | undefined) =>
    figure === undefined || opts.idle === undefined ? displayNumber(figure) : opts.idle(figure);
  const [draft, setDraft] = useState(() => resting(value));
  const [correction, setCorrection] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);

  const restingText = resting(value);
  useEffect(() => {
    if (!focus) setDraft(restingText);
  }, [restingText, focus]);

  const clearNotes = () => {
    setCorrection(null);
    setRefusal(null);
  };

  const restore = () => {
    setDraft(displayNumber(value));
    clearNotes();
  };

  const commit = () => {
    if (draft.trim() === '' && value !== undefined && opts.onClear !== undefined) {
      clearNotes();
      opts.onClear();
      return;
    }
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

  const type = (next: string) => {
    setDraft(next);
    if (opts.commits !== 'as-typed') return;
    /* An emptied box is reported too: on touch *Save* does not leave the field, and the last digit
       must never stand in for a figure taken away. */
    if (next.trim() === '' && value !== undefined && opts.onClear !== undefined) {
      opts.onClear();
      return;
    }
    const outcome = commitDraft({ ...opts, draft: next });
    if (outcome.kind === 'accept' && outcome.value !== value) onCommit?.(outcome.value);
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
    setDraft: type,
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
