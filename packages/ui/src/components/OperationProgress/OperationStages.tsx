import { IndeterminateRail } from '../PendingAction/IndeterminateRail';
import type { OperationStage, OperationStageState } from './OperationProgress.types';

/** Each stage states its state IN WORDS for a screen reader; the glyph is the second channel. */
const STATE_WORDS: Record<OperationStageState, string> = {
  done: 'done',
  active: 'running',
  waiting: 'not started',
};

function DoneGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="hg-operation-progress-stage-check"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

/**
 * MS2-38's three narrated steps, when the caller has all of them: done · running · not yet.
 * Defaults are `active` for the first stage and `waiting` after, exactly as the DS resolves them.
 */
export function OperationStages({ stages }: { stages: OperationStage[] }) {
  return (
    <ol className="hg-operation-progress-stages">
      {stages.map((stage, index) => {
        const state: OperationStageState = stage.state ?? (index === 0 ? 'active' : 'waiting');
        return (
          <li key={stage.label} className="hg-operation-progress-stage" data-state={state}>
            {state === 'done' ? <DoneGlyph /> : null}
            {state === 'active' ? (
              <IndeterminateRail
                width={13}
                thickness={3}
                className="hg-operation-progress-stage-rail"
              />
            ) : null}
            {state === 'waiting' ? (
              <span className="hg-operation-progress-stage-dot" aria-hidden="true">
                <span />
              </span>
            ) : null}
            <span className="hg-operation-progress-stage-label">{stage.label}</span>
            <span className="hg-operation-progress-stage-state">{STATE_WORDS[state]}</span>
          </li>
        );
      })}
    </ol>
  );
}
