import type { FocusAfter } from '../../primitives/FocusAfter/FocusAfter.types';
import { HueTile } from '../HueTile/HueTile';
import type { PerformanceStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { performanceControls } from './performance-controls';
import { StepControls } from './StepControls';
import { LinkAct, StepNote } from './StepParts';

function FilledCard({ view }: { view: PerformanceStepView }) {
  const { words, fill } = view;
  const fallback = fill !== 'source';
  return (
    <div className="hg-pst-auto" data-tone={fallback ? 'fallback' : undefined} role="status">
      <HueTile
        glyph={fill === 'built_in' ? 'cloud-off' : 'sun'}
        hue={fallback ? 'neutral' : 'teal'}
        size={36}
      />
      <span className="hg-pst-auto-words">
        <span className="hg-pst-auto-title">{words.fillTitle}</span>
        <span className="hg-pst-auto-line">{words.fillLine}</span>
      </span>
      {fill === 'filling' ? null : (
        <LinkAct glyph="retry" label={words.refill} onPress={view.onRefill} />
      )}
    </div>
  );
}

/**
 * Step 4 (`M06-10`, `T-M06-006`): the figures fill themselves from the source of record, and the
 * card says where they came from and offers Reset. The person changes the efficiency, or a month
 * they know better — and a size changed since is said, never silently applied (`T-M06-033`).
 */
export function PerformanceStep({
  view,
  shared,
  focusAfter,
}: {
  view: PerformanceStepView;
  shared: ProposalStepWords;
  focusAfter: FocusAfter;
}) {
  return (
    <div className="hg-pst-controls">
      {view.capacityChanged === undefined ? null : (
        <StepNote notice={view.capacityChanged} tone="warning" glyph="alert-triangle" />
      )}
      <FilledCard view={view} />
      <StepControls
        controls={performanceControls(view, shared)}
        shared={shared}
        focusAfter={focusAfter}
      />
    </div>
  );
}
