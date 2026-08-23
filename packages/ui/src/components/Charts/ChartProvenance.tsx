import { Fragment } from 'react';
import type { ProvenanceFacts } from './chart-provenance';
import { provenanceParts } from './chart-provenance';

interface ChartProvenanceProps {
  facts: ProvenanceFacts | null;
}

/**
 * One provenance line under the headline value — **word first, dot second** (F8-07). The dot is
 * the second, non-colour channel; removing it would lose a cue, never the meaning.
 */
export function ChartProvenance({ facts }: ChartProvenanceProps) {
  const parts = provenanceParts(facts);
  if (parts.length === 0) {
    return null;
  }
  return (
    <span className="hg-charts-prov">
      {parts.map((part, index) => (
        <Fragment key={part.id}>
          {index > 0 ? (
            <span aria-hidden="true" className="hg-charts-prov-sep">
              ·
            </span>
          ) : null}
          <span
            className="hg-charts-prov-part"
            data-color={part.colorKey}
            data-strong={part.strong === true ? 'true' : undefined}
          >
            {part.dot === undefined ? null : (
              <span
                aria-hidden="true"
                className="hg-charts-prov-dot"
                data-color={part.dot.colorKey}
                style={
                  part.dot.customColor === undefined
                    ? undefined
                    : { background: part.dot.customColor }
                }
              />
            )}
            {part.label}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
