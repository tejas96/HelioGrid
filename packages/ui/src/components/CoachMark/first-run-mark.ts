import type { TranslatedText } from '@heliogrid/contracts';
import type { MarkInView } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { CoachMarkProps } from './CoachMark.types';

/** The words a first-run mark shows — `firstRunMarkWords` and `firstRunMarkLabels` in `i18n`. */
export interface FirstRunMarkWords {
  title: TranslatedText;
  body: TranslatedText;
  counterLabel: TranslatedText;
  nextLabel: TranslatedText;
  dismissLabel: TranslatedText;
}

/**
 * One first-run mark's props, the same on both platforms (`M01-16`): ONE mark at a time, never a
 * carousel; a run of one shows no counter — "1 of 1" says nothing; Next passes this mark and the
 * last one has none, so its forward button closes the run; Got it passes every mark. Each app adds
 * only where the mark points and where it sits.
 */
export function firstRunMarkProps(
  inView: Pick<MarkInView, 'step' | 'total'>,
  words: FirstRunMarkWords,
  actions: { onPass: (step: number) => void; onDismiss: () => void },
  /** The control the mark points at, which takes the focus once the run has closed. */
  focusAfter: FocusAfter,
): CoachMarkProps {
  const { step, total } = inView;
  const mark = {
    open: true,
    ring: true,
    title: words.title,
    body: words.body,
    nextLabel: words.nextLabel,
    dismissLabel: words.dismissLabel,
    onNext: step < total ? () => actions.onPass(step) : undefined,
    onDismiss: actions.onDismiss,
    focusAfter,
  };
  return total > 1 ? { ...mark, step, total, counterLabel: words.counterLabel } : mark;
}
