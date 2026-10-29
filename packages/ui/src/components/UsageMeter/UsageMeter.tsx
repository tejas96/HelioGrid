import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider/market-context';
import { Provenance } from '../Provenance/Provenance';
import type { UsageMeterProps } from './UsageMeter.types';
import { UsageMeterMetered } from './UsageMeterMetered';
import { UsageMeterError, UsageMeterLoading, UsageMeterUnavailable } from './UsageMeterStates';
import { unmeteredStatusLine, usageMeterShape, usageTrackHeight } from './usage-meter-model';

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
  words,
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
  noLimitNote = words.noLimit,
  loadingNote = words.loading,
  errorMessage = words.error,
  onRetry,
  retryLabel,
  unavailableTitle = words.unavailable,
  unavailableMessage,
  density = 'expressive',
  className,
  style,
}: WebUsageMeterProps) {
  /* Every state draws its own frame, and each takes this one ref: after Try again leaves, focus
     lands on the meter's frame in whatever state it reloads into. */
  const frame = useRef<HTMLElement>(null);
  const format = useFormat().number;
  const trackHeight = `${usageTrackHeight(density)}px`;
  const shape = usageMeterShape(state, value, limit);

  if (shape.draws === 'error') {
    return (
      <UsageMeterError
        frame={frame}
        label={label}
        period={period}
        errorMessage={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
      />
    );
  }

  if (shape.draws === 'unavailable') {
    return (
      <UsageMeterUnavailable
        frame={frame}
        label={label}
        period={period}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
      />
    );
  }

  if (shape.draws === 'loading') {
    return (
      <UsageMeterLoading
        frame={frame}
        label={label}
        period={period}
        loadingNote={loadingNote}
        spokenName={words.unresolvedName(label, period)}
        trackHeight={trackHeight}
      />
    );
  }

  /* Period, tier and bundle are the three things BM-27 requires beside the number, and they render
     as one persistent line rather than three loose spans. */
  const prov = (
    <Provenance tier={provenance} standing={standing} source={period} note={bundleName} size={12} />
  );

  if (shape.draws === 'unmetered') {
    const line = unmeteredStatusLine(shape.billing, graceDaysLeft, words);
    return (
      <section
        ref={frame}
        tabIndex={-1}
        className={classNames('hg-usage-meter', 'hg-focus-target', className)}
        style={style}
      >
        <div className="hg-usage-meter-head">
          <span className="hg-usage-meter-label">{label}</span>
          <span className="hg-usage-meter-figure">
            <strong>{format(shape.value)}</strong>
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
      frame={frame}
      words={words}
      label={label}
      value={shape.value}
      limit={shape.limit}
      unit={unit}
      period={period}
      bundleName={bundleName}
      billing={shape.billing}
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
