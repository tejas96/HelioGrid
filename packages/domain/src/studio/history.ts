/**
 * Undo and Redo: every change a person made since the design opened, with no limit. A change made
 * after an undo drops what could have been redone.
 */
export interface History<State> {
  readonly past: readonly State[];
  readonly present: State;
  readonly future: readonly State[];
}

/** A history that starts at what the design holds when it opens. */
export function historyOf<State>(present: State): History<State> {
  return { past: [], present, future: [] };
}

/** One more change. */
export function historyAfter<State>(history: History<State>, next: State): History<State> {
  return { past: [...history.past, history.present], present: next, future: [] };
}

/** One change back; the same history when there is none. */
export function historyUndone<State>(history: History<State>): History<State> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

/** One undone change made again; the same history when there is none. */
export function historyRedone<State>(history: History<State>): History<State> {
  const [next, ...later] = history.future;
  if (next === undefined) return history;
  return { past: [...history.past, history.present], present: next, future: later };
}
