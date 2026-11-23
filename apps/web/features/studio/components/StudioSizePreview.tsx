'use client';
import type { SizeCardView } from '@heliogrid/data/react';
import type { MeasurementSystem } from '@heliogrid/domain';
import { useFormat } from '@heliogrid/ui';
import { pointText } from './roof-marks-place';
import { StudioLengthLabel } from './StudioLengthLabel';

/**
 * The typed rectangle before it is placed (`T-M05-002`, part c), in the top view: dashed, in the
 * error colour where it cannot stand, its lengths along its edges and its area on it. The marks
 * layer places each point on the map.
 */
export function StudioSizePreview({
  card,
  units,
}: {
  card: SizeCardView;
  units: MeasurementSystem;
}) {
  const format = useFormat();
  const { preview } = card;
  if (preview === null) return null;
  const { corners, lengths } = preview;
  const pts = corners.map(pointText).join(';');
  const inside = pointText(preview.middle);
  return (
    <>
      <svg className="hg-roof-lines" aria-hidden="true">
        <path className="hg-roof-halo" data-pts={pts} data-closed="true" />
        <path
          className="hg-roof-line hg-size-line"
          data-pts={pts}
          data-closed="true"
          data-bad={card.previewBad}
        />
      </svg>
      <div className="hg-roof-on">
        {corners.map((from, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: an edge is its place in the rectangle
            key={i}
            className="hg-roof-at"
            data-edge={`${pointText(from)}|${pointText(corners[(i + 1) % corners.length] ?? from)}|${inside}`}
          >
            <StudioLengthLabel
              text={format.roofLength(lengths[i] ?? 0, units, preview.about[i] ?? false)}
              kind={preview.about[i] ? 'assumed' : 'typed'}
            />
          </span>
        ))}
        {/* The area is spoken with the card's numbers; on the map it is a mark to read at a glance. */}
        <span className="hg-roof-at" data-at={inside} aria-hidden="true">
          <span className="hg-roof-tag hg-size-area">{format.area(preview.area, units)}</span>
        </span>
      </div>
    </>
  );
}
