import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider/market-context';
import { Provenance } from '../Provenance/Provenance';
import type { UsageMeterProps } from './UsageMeter.types';
import { UsageMeterMetered } from './UsageMeterMetered';
import { UsageMeterError, UsageMeterLoading, UsageMeterUnavailable } from './UsageMeterStates';
import {
  isMetered,
  isResolved,
  normaliseUsageState,
  unmeteredStatusLine,
} from './usage-meter-model';

interface WebUsageMeterProps extends UsageMeterProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A billing meter for `SCR-M12-04` Usage — the same numbers the product enforces and bills from,
 * with no smoothing (`BM-27`). Deliberately NOT a richer `ProgressBar`.
 *
 * THREE RULES RUN BEFORE ANY BILLING LOGIC: no figure without a resolved value, no denominator
 * without a rate, and an error shows no numbers. `error` and `unavailable` are tested BEFORE the
 * resolved-value guard — in both there is definitionally no value to wait for, and checked after
 * it they were unreachable without a dummy `value={0}`, the exact figure this component refuses to
 * print.
 *
 * NO SCARY METERS (`M12-36`). It reports and never alarms: 80% is amber, overage is info-blue
 * because it is expected billable behaviour rather than a fault, and a paused meter goes grey with
 * the severity in words.
 */
export function UsageMeter({
  label,
  value,
  limit = null,
  unit,
  period,
  provenance,
  standing,
  bundleName,
  state = 'ok',
  thresholdPercent = 80,
  graceDaysLeft,
  note,
  noLimitNote = 'No bundle on this plan to measure against — this is a count, not a rate.',
  loadingNote = "Not resolved yet — this period's rollup is still being read.",
  errorMessage = "Couldn't read this period's usage. Nothing is shown until it resolves, because this screen only ever shows the billed figures.",
  onRetry,
  unavailableTitle = 'Not metered on this plan',
  unavailableMessage,
  density = 'expressive',
  className,
  style,
}: WebUsageMeterProps) {
  const format = useFormat().number;
  const trackHeight = density === 'functional' ? '8px' : '10px';
  const billing = normaliseUsageState(state);

  if (billing === 'error') {
    return (
      <UsageMeterError
        label={label}
        period={period}
        errorMessage={errorMessage}
        onRetry={onRetry}
      />
    );
  }

  if (billing === 'unavailable') {
    return (
      <UsageMeterUnavailable
        label={label}
        period={period}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
      />
    );
  }

  if (billing === 'loading' || !isResolved(value)) {
    return (
      <UsageMeterLoading
        label={label}
        period={period}
        loadingNote={loadingNote}
        trackHeight={trackHeight}
      />
    );
  }

  /* Period, tier and bundle are the three things BM-27 requires beside the number, and they render
     as one persistent line rather than three loose spans. */
  const prov = (
    <Provenance tier={provenance} standing={standing} source={period} note={bundleName} size={12} />
  );

  if (!isMetered(limit)) {
    const line = unmeteredStatusLine(billing, graceDaysLeft);
    return (
      <section className={classNames('hg-usage-meter', className)} style={style}>
        <div className="hg-usage-meter-head">
          <span className="hg-usage-meter-label">{label}</span>
          <span className="hg-usage-meter-figure">
            <strong>{format(value)}</strong>
            {unit !== undefined ? <span className="hg-usage-meter-unit"> {unit}</span> : null}
          </span>
        </div>
        {prov}
        <p className="hg-usage-meter-note">{noLimitNote}</p>
        {line !== null ? (
          <p className="hg-usage-meter-status" data-tone={line.tone}>
            {line.words}
          </p>
        ) : null}
        {note !== undefined ? <p className="hg-usage-meter-note">{note}</p> : null}
      </section>
    );
  }

  return (
    <UsageMeterMetered
      label={label}
      value={value}
      limit={limit}
      unit={unit}
      period={period}
      bundleName={bundleName}
      billing={billing}
      thresholdPercent={thresholdPercent}
      graceDaysLeft={graceDaysLeft}
      note={note}
      trackHeight={trackHeight}
      format={format}
      provenance={prov}
      className={className}
      style={style}
    />
  );
}
