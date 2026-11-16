import type { TranslatedText } from '@heliogrid/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFieldCommits } from '../../primitives/FieldCommits';
import { useCommitOnUnmount } from '../../primitives/use-commit-on-unmount';
import { useFormat } from '../MarketProvider/market-context';
import {
  commitDraft,
  displayNumber,
  draftWithinWholeDigits,
  nudgeValue,
  restingMoney,
  typedFigureOf,
  wholeDigitsOf,
} from './NumberField.logic';
import type {
  NumberFieldCommits,
  NumberFieldProps,
  NumberFieldWords,
  OutOfRangeMode,
} from './NumberField.types';

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
  correctionMessage?: TranslatedText;
  commits: NumberFieldCommits;
  words: NumberFieldWords;
  wholeDigits?: number;
  /** How a figure reads while the field is not being edited — a money field, in the market's
   *  money format. Editing always shows the plain figure, which is what is parsed back. */
  idle?: (value: number) => string;
}

export interface NumberDraftState {
  draft: string;
  correction: TranslatedText | null;
  /** The generated constraint — the platform half composes it with `refusalPath`. */
  refusal: TranslatedText | null;
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
 * The rules it holds: commit ONCE on blur or Enter — or on unmount while focused, since a touch
 * press that leaves the step never blurs it — never per keystroke; empty or invalid never
 * commits; a correction and a refusal are cleared by focus because they were about the last
 * keystroke, while the caller's `error` is not this hook's business at all. A caller that asks for
 * `as-typed` also hears each figure the draft would commit; the draft and its notes wait for the
 * commit, so nothing is rewritten under the person's fingers.
 */
export function useNumberFieldDraft(opts: NumberDraftOptions): NumberDraftState {
  const { value, onCommit } = opts;
  const plainText = (figure: number | undefined) => displayNumber(figure, opts.precision);
  const resting = (figure: number | undefined) =>
    figure === undefined || opts.idle === undefined ? plainText(figure) : opts.idle(figure);
  const [draft, showDraft] = useState(() => resting(value));
  /* The draft as last set, ahead of the render: a phone reports keystrokes faster than it renders,
     and an edit read against the rendered draft would take the digits before it as a paste. */
  const latestDraft = useRef(draft);
  const setDraft = useCallback((next: string) => {
    latestDraft.current = next;
    showDraft(next);
  }, []);
  const [correction, setCorrection] = useState<TranslatedText | null>(null);
  const [refusal, setRefusal] = useState<TranslatedText | null>(null);
  const [focus, setFocus] = useState(false);
  /* Read in the effect below: a field focused as it mounts (`focusRequest`) is focused before that
     effect first runs, and the render's own `focus` is still false there, so the resting money text
     ("30,00,000") would overwrite the plain draft the person is typing into. */
  const focused = useRef(false);
  /* The text the field showed as it was focused: left as it was, nothing is sent — a figure shown
     to its `precision` (406) must not replace the exact one it stands for (405.528). */
  const shownAtFocus = useRef<string | null>(null);

  /* A figure past the whole digits has lost digits as a number: the draft keeps what was pasted. */
  const pastLimit = (figure: number | undefined) =>
    figure !== undefined &&
    opts.wholeDigits !== undefined &&
    wholeDigitsOf(String(Math.trunc(Math.abs(figure)))) > opts.wholeDigits;
  const restingText = resting(value);
  const keepsDraft = pastLimit(value);
  useEffect(() => {
    if (!focus && !focused.current && !keepsDraft) setDraft(restingText);
  }, [restingText, focus, keepsDraft, setDraft]);

  const clearNotes = () => {
    setCorrection(null);
    setRefusal(null);
  };

  const restore = () => {
    setDraft(plainText(value));
    clearNotes();
  };

  const commit = () => {
    if (value !== undefined && draft === shownAtFocus.current) {
      restore();
      return;
    }
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
      setDraft(plainText(value));
      setCorrection(null);
      setRefusal(outcome.constraint);
      return;
    }
    setRefusal(null);
    if (!pastLimit(outcome.value)) setDraft(plainText(outcome.value));
    setCorrection(outcome.correction);
    if (outcome.value !== value) onCommit?.(outcome.value);
  };

  useCommitOnUnmount(focus, commit);

  const type = (typed: string) => {
    const previous = latestDraft.current;
    const edited = typedFigureOf(typed, opts.min === undefined || opts.min < 0);
    const next =
      opts.wholeDigits === undefined
        ? edited
        : draftWithinWholeDigits(previous, edited, opts.wholeDigits);
    if (next === previous) return;
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
    shownAtFocus.current = null;
    setDraft(plainText(next));
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
      focused.current = true;
      setFocus(true);
      clearNotes();
      const shown = plainText(value);
      shownAtFocus.current = shown;
      setDraft(shown);
    },
    onBlur: () => {
      focused.current = false;
      setFocus(false);
      commit();
    },
    commit,
    cancel: restore,
    nudge,
  };
}

/**
 * The field as both halves draw it: its draft — a money field rests in the market's money format —
 * whether it offers steppers, and whether it reads as danger.
 */
export function useNumberField(props: NumberFieldProps): {
  draft: NumberDraftState;
  showSteppers: boolean;
  danger: boolean;
} {
  const {
    value,
    onCommit,
    onClear,
    min,
    max,
    step = 1,
    precision,
    currency = false,
    unit,
    outOfRange = 'clamp',
    correctionMessage,
    commits,
    words,
    steppers,
    error,
    wholeDigits,
  } = props;
  const format = useFormat();
  const formCommits = useFieldCommits();
  const draft = useNumberFieldDraft({
    value,
    onCommit,
    onClear,
    min,
    max,
    step,
    precision,
    currency,
    ...(currency ? { idle: (figure: number) => restingMoney(format, figure) } : {}),
    unit,
    outOfRange,
    correctionMessage,
    commits: commits ?? formCommits,
    words,
    wholeDigits,
  });
  return {
    draft,
    /* A payment is not stepped. An unset `steppers` follows `currency` — the only case where the
       grammar is knowable from the props the caller already passed. */
    showSteppers: steppers ?? !currency,
    danger: draft.refusal !== null || error !== undefined,
  };
}
