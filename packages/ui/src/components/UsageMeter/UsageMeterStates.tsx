import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties, RefObject } from 'react';
import { RetryButton } from '../Button/RetryButton';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote';
import type { UsageMeterProps } from './UsageMeter.types';
import { usageLoadingLine } from './usage-meter-model';

type ShimmerVars = CSSProperties & Record<`--${string}`, string>;

/** The meter's frame — where focus lands after a retry, whichever state it reloads into. */
type Frame = RefObject<HTMLElement | null>;

/** A shimmer in the figure's OWN footprint — never a numeral, never a dash dressed as a value. */
export function Shimmer({
  width,
  height,
  radius,
}: {
  width: string;
  height: string;
  radius: string;
}) {
  const vars: ShimmerVars = {
    '--hg-usage-meter-shimmer-w': width,
    '--hg-usage-meter-shimmer-h': height,
    '--hg-usage-meter-shimmer-r': radius,
  };
  return <span className="hg-usage-meter-shimmer" style={vars} />;
}

function Head({ label, period }: { label: TranslatedText; period?: string }) {
  return (
    <div className="hg-usage-meter-head">
      <span className="hg-usage-meter-label">{label}</span>
      {period !== undefined ? <span className="hg-usage-meter-period">{period}</span> : null}
    </div>
  );
}

/**
 * RULE 3 — AN ERROR SHOWS NO NUMBERS. Not the last good figure, not an approximation. It says the
 * rollup could not be read and offers the retry, because that is the only honest content.
 */
export function UsageMeterError({
  frame,
  label,
  period,
  errorMessage,
  onRetry,
  retryLabel,
}: Pick<UsageMeterProps, 'label' | 'period' | 'onRetry' | 'retryLabel'> & {
  frame: Frame;
  errorMessage: TranslatedText;
}) {
  return (
    <section ref={frame} tabIndex={-1} className="hg-usage-meter hg-focus-target">
      <Head label={label} period={period} />
      <p className="hg-usage-meter-error">{errorMessage}</p>
      {onRetry !== undefined && retryLabel !== undefined ? (
        <div className="hg-usage-meter-retry">
          <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={frame} />
        </div>
      ) : null}
    </section>
  );
}

/** This meter does not apply to this plan: no bar, no figure, NO RETRY. */
export function UsageMeterUnavailable({
  frame,
  label,
  period,
  unavailableTitle,
  unavailableMessage,
}: Pick<UsageMeterProps, 'label' | 'period' | 'unavailableMessage'> & {
  frame: Frame;
  unavailableTitle: TranslatedText;
}) {
  return (
    <section ref={frame} tabIndex={-1} className="hg-usage-meter hg-focus-target">
      <span className="hg-usage-meter-label">{label}</span>
      <UnavailableNote title={unavailableTitle} message={unavailableMessage} detail={period} />
    </section>
  );
}

/**
 * RULE 1 — NO FIGURE WITHOUT A RESOLVED VALUE. The label, a shimmer in the figure's footprint and
 * the period. No numeral, no zero, and no `role="progressbar"`: a bar with no value is a claim.
 */
export function UsageMeterLoading({
  frame,
  label,
  period,
  loadingNote,
  spokenName,
  trackHeight,
}: Pick<UsageMeterProps, 'label' | 'period'> & {
  frame: Frame;
  loadingNote: TranslatedText;
  /** The meter named as still being read — `words.unresolvedName`. */
  spokenName: TranslatedText;
  trackHeight: string;
}) {
  const words = usageLoadingLine(loadingNote, period);
  return (
    <section
      ref={frame}
      tabIndex={-1}
      role="status"
      aria-label={spokenName}
      className="hg-usage-meter hg-focus-target"
    >
      <div className="hg-usage-meter-head">
        <span className="hg-usage-meter-label">{label}</span>
        <Shimmer width="92px" height="13px" radius="var(--rf-md)" />
      </div>
      <Shimmer width="100%" height={trackHeight} radius="var(--r-pill)" />
      <p className="hg-usage-meter-note">{words}</p>
    </section>
  );
}
