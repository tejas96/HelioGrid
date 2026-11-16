import { ShellGlyph } from '../AppShell/ShellGlyph';
import { axisFootOf } from './CompareGrid.logic';
import type { CompareGridFooterProps } from './CompareGrid.types';

function Chevron({ back }: { back?: boolean }) {
  return (
    <ShellGlyph name={back === true ? 'chevron-left' : 'chevron-right'} size="md" tone="current" />
  );
}

/**
 * **Where the reader is on the option axis, and how they move along it without a touch screen.**
 *
 * The readout and the previous/next controls answer the same question, so they are one component:
 * both appear only while the axis actually overflows — on a wide screen four columns fit and
 * neither belongs — and the footer stays for a caller's `note` alone.
 */
export function CompareGridFooter({ onStep, words, ...position }: CompareGridFooterProps) {
  const foot = axisFootOf(position, words);
  if (foot === null) return null;
  return (
    <div className="hg-compare-foot">
      <span className="hg-compare-readout">{foot.readout}</span>
      {position.scrollable ? (
        <span className="hg-compare-steps">
          <button
            type="button"
            className="hg-compare-step"
            aria-label={words.previousOption}
            onClick={() => onStep(-1)}
            disabled={foot.atFirst}
          >
            <Chevron back />
          </button>
          <button
            type="button"
            className="hg-compare-step"
            aria-label={words.nextOption}
            onClick={() => onStep(1)}
            disabled={foot.atLast}
          >
            <Chevron />
          </button>
        </span>
      ) : null}
    </div>
  );
}
