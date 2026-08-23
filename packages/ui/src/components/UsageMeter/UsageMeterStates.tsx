import type { CSSProperties } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote';
import type { UsageMeterProps } from './UsageMeter.types';

type ShimmerVars = CSSProperties & Record<`--${string}`, string>;

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

function Head({ label, period }: { label: string; period?: string }) {
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
  label,
  period,
  errorMessage,
  onRetry,
}: Pick<UsageMeterProps, 'label' | 'period' | 'onRetry'> & { errorMessage: string }) {
  return (
    <section className="hg-usage-meter">
      <Head label={label} period={period} />
      <p className="hg-usage-meter-error">{errorMessage}</p>
      {onRetry !== undefined ? (
        <div className="hg-usage-meter-retry">
          <Pressable className="hg-usage-meter-pill" onPress={onRetry}>
            Try again
          </Pressable>
        </div>
      ) : null}
    </section>
  );
}

/** This meter does not apply to this plan: no bar, no figure, NO RETRY. */
export function UsageMeterUnavailable({
  label,
  period,
  unavailableTitle,
  unavailableMessage,
}: Pick<UsageMeterProps, 'label' | 'period' | 'unavailableMessage'> & {
  unavailableTitle: string;
}) {
  return (
    <section className="hg-usage-meter">
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
  label,
  period,
  loadingNote,
  trackHeight,
}: Pick<UsageMeterProps, 'label' | 'period'> & { loadingNote: string; trackHeight: string }) {
  const words = [loadingNote, period].filter((part) => part !== undefined).join(' · ');
  return (
    <section
      role="status"
      aria-label={`${label}${period === undefined ? '' : `, ${period}`}, not resolved yet`}
      className="hg-usage-meter"
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
