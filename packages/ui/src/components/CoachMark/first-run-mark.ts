import type { MarkInView } from '@heliogrid/domain';
import type { CoachMarkProps } from './CoachMark.types';

/** The words a first-run mark shows — `firstRunMarkWords` and `firstRunMarkLabels` in `i18n`. */
export interface FirstRunMarkWords {
  title: string;
  body: string;
  counterLabel: string;
  nextLabel: string;
  dismissLabel: string;
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
): CoachMarkProps {
  const { step, total } = inView;
  const counted = total > 1;
  return {
    open: true,
    ring: true,
    title: words.title,
    body: words.body,
    step: counted ? step : undefined,
    total: counted ? total : undefined,
    counterLabel: words.counterLabel,
    nextLabel: words.nextLabel,
    dismissLabel: words.dismissLabel,
    onNext: step < total ? () => actions.onPass(step) : undefined,
    onDismiss: actions.onDismiss,
  };
}
