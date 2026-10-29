import { useEffect, useState } from 'react';

export interface CommitDraft {
  /** The text the field is showing. */
  draft: string;
  setDraft: (next: string) => void;
  focus: boolean;
  setFocus: (on: boolean) => void;
  /** Blur or Enter. Empty never commits; an unchanged string never commits. */
  commit: () => void;
  /** Escape, or any other cancel route: restore the last committed value. */
  cancel: () => void;
  /** What the field shows: the draft in commit-once mode, else the caller's value. */
  shown: string;
  /** A keystroke: drafted in commit-once mode, else handed straight to `onChange`. */
  change: (next: string) => void;
  /** Leaving the field: commit-once mode commits on the way out. */
  leave: () => void;
}

/**
 * Commit-once mode (MS12-26 / MS3-26), the whole of it, shared by both platform halves.
 *
 * Three rules the DS spells out and this hook is the single home for: EMPTY NEVER COMMITS (the
 * field restores the last committed value instead), AN UNCHANGED STRING NEVER COMMITS (so a
 * focus-and-leave never writes an undo entry), and cancelling restores the last committed value.
 */
export function useCommitDraft(
  value: string | undefined,
  commitOnBlur: boolean,
  onCommit?: (value: string) => void,
  onChange?: (value: string) => void,
): CommitDraft {
  const [focus, setFocus] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => {
    if (commitOnBlur && !focus) {
      setDraft(value ?? '');
    }
  }, [value, focus, commitOnBlur]);

  const commit = () => {
    const raw = draft.trim();
    const last = value ?? '';
    if (raw === '') {
      setDraft(last); // empty never commits
      return;
    }
    if (raw !== last) {
      onCommit?.(raw); // same string in, no undo entry out
    }
  };

  return {
    draft,
    setDraft,
    focus,
    setFocus,
    commit,
    cancel: () => setDraft(value ?? ''),
    shown: commitOnBlur ? draft : (value ?? ''),
    change: (next) => {
      if (commitOnBlur) {
        setDraft(next);
        return;
      }
      onChange?.(next);
    },
    leave: () => {
      setFocus(false);
      if (commitOnBlur) {
        commit();
      }
    },
  };
}
