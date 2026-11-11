import { stageBarPartsOf } from './ListTop.logic';
import type { ListSummaryProps } from './ListTop.types';

type Stages = NonNullable<ListSummaryProps['stages']>;

/**
 * The stages as one thin bar under the narrow summary: each stage holding a lead takes its share of
 * the row. Its name is the meter's heading; the chips under the search are the way to filter.
 */
export function ListStageBar({ stages }: { stages: Stages }) {
  return (
    <span className="hg-list-stage-bar" role="img" aria-label={stages.words.heading}>
      {stageBarPartsOf(stages.stages).map((part) => (
        <span
          key={part.stage}
          className="hg-list-stage-bar-part"
          style={{ flexGrow: part.count }}
        />
      ))}
    </span>
  );
}
