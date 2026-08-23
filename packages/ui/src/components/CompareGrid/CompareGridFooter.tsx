import { Icon } from '../../primitives/Icon';
import { positionReadout } from './CompareGrid.logic';

function Chevron({ back }: { back?: boolean }) {
  return (
    <Icon size="md">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={back === true ? { transform: 'rotate(180deg)' } : undefined}
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Icon>
  );
}

export interface CompareGridFooterProps {
  scrollable: boolean;
  first: number;
  last: number;
  count: number;
  note?: string;
  onStep: (direction: number) => void;
}

/**
 * **Where the reader is on the option axis, and how they move along it without a touch screen.**
 *
 * The readout and the previous/next controls answer the same question, so they are one component:
 * both appear only while the axis actually overflows — on a wide screen four columns fit and
 * neither belongs — and the footer stays for a caller's `note` alone.
 */
export function CompareGridFooter({
  scrollable,
  first,
  last,
  count,
  note,
  onStep,
}: CompareGridFooterProps) {
  if (!scrollable && !note) return null;
  return (
    <div className="hg-compare-foot">
      <span className="hg-compare-readout">
        {positionReadout({ scrollable, first, last, count, note })}
      </span>
      {scrollable ? (
        <span className="hg-compare-steps">
          <button
            type="button"
            className="hg-compare-step"
            aria-label="Previous option"
            onClick={() => onStep(-1)}
            disabled={first <= 1}
          >
            <Chevron back />
          </button>
          <button
            type="button"
            className="hg-compare-step"
            aria-label="Next option"
            onClick={() => onStep(1)}
            disabled={last >= count}
          >
            <Chevron />
          </button>
        </span>
      ) : null}
    </div>
  );
}
