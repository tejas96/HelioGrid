import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { chartSlot } from '../Charts/chart-palette';
import { formatAllocation, partValue, splitKeyFitsOneRow } from './AllocationMeter.model';
import type { AllocationPart } from './AllocationMeter.types';

interface AllocationSplitProps {
  label?: string;
  parts: AllocationPart[];
  unit: string;
  density: 'expressive' | 'functional';
  className?: string;
  style?: CSSProperties;
}

/**
 * A SAVED SPLIT IS READ, NOT CHECKED: the split met its target when it was saved, so nothing here
 * is in progress — no label row, no remainder words, no rule. The colour is never the only signal:
 * each key entry carries its swatch, its share and its caption, in the strip's order.
 */
export function AllocationSplit({
  label,
  parts,
  unit,
  density,
  className,
  style,
}: AllocationSplitProps) {
  return (
    <section
      className={classNames('hg-allocation-split', className)}
      aria-label={label}
      style={style}
    >
      <div aria-hidden="true" className="hg-allocation-split-strip" data-density={density}>
        {parts.map((part, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: a saved split's parts keep their order and may repeat a label and a share
            key={index}
            className="hg-allocation-split-segment hg-charts-slot"
            data-slot={chartSlot(index)}
            style={{ flexGrow: partValue(part) }}
          />
        ))}
      </div>
      <ul
        className="hg-allocation-split-key"
        data-rows={splitKeyFitsOneRow(parts.length) ? 'one' : 'many'}
      >
        {parts.map((part, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a saved split's parts keep their order and may repeat a label and a share
          <li key={index} className="hg-allocation-split-entry">
            <span className="hg-allocation-split-share-row">
              <span
                aria-hidden="true"
                className="hg-allocation-swatch hg-charts-slot"
                data-slot={chartSlot(index)}
              />
              <span className="hg-allocation-split-share">
                {`${formatAllocation(partValue(part))}${unit}`}
              </span>
            </span>
            {part.caption === null || part.caption === undefined ? null : (
              <span className="hg-allocation-split-caption">{part.caption}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
