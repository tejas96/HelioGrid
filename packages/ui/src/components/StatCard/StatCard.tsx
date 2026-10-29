/* StatCard (web) — the one component whose whole purpose is a single headline number.

   THE ADJACENCY RULE, stated once so six blocks cannot answer it six ways:

       A tier renders in the component's own `provenance` slot — directly under the value it
       qualifies, above the delta and above `children`. It never goes in `children`.

   AN UNRESOLVED STAT NEVER RENDERS A NUMERAL. Not a zero, not a dash dressed as a value, not the
   last figure it happened to hold.

   DIRECTION AND SENTIMENT ARE TWO FACTS. `deltaDir` is the arrow; `deltaSentiment` is the tint AND
   a word, because F7-12 forbids a good/bad reading resting on colour alone. Sentiment defaults to
   `neutral` — a caller that states only a direction makes no good/bad claim at all. Both live in
   `StatCardDelta`; how the figure itself is written is `StatCard.format`, shared with the native
   half so the two print the same number. */

import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { renderBand } from '../BandedFigure';
import { useFormat } from '../MarketProvider';
import { renderGap } from '../NamedGap';
import { renderProvenance } from '../Provenance';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { formatStatValue } from './StatCard.format';
import type { StatCardProps } from './StatCard.types';
import { StatCardDelta } from './StatCardDelta';
import { DELTA_DEFAULTS } from './StatCardDelta.logic';
import { StatCardStates } from './StatCardStates';

interface WebStatCardProps extends StatCardProps {
  className?: string;
  style?: CSSProperties;
}

export function StatCard({
  label,
  words,
  value,
  unit,
  money = false,
  compact = false,
  gap,
  delta,
  deltaDir = DELTA_DEFAULTS.dir,
  deltaSentiment = DELTA_DEFAULTS.sentiment,
  sentimentLabel,
  band,
  provenance,
  onClick,
  ariaLabel,
  read,
  emptyMessage,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  className,
  style,
  children,
}: WebStatCardProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  /* The card's frame outlives its states, so focus lands on it once the retry has left. */
  const frame = useRef<HTMLDivElement>(null);
  const f = useFormat();
  const gapNode = renderGap(gap, { scale: 'headline' });
  const shown = formatStatValue(value, { money, compact, format: f });
  const prov = gapNode ? null : renderProvenance(provenance, { size: 12 });
  /* A BAND is a verdict on the FIGURE; deltaSentiment is a verdict on the CHANGE. Two axes, one
     pill, so a screen never invents a second way for a number to carry a verdict word. */
  const bandNode = gapNode ? null : renderBand(band, { size: 12 });
  const overline = <div className="hg-stat-card-overline">{label}</div>;

  /* Every non-ready state returns here, and none of them prints a figure. */
  if (state !== 'ready') {
    return (
      <div
        ref={frame}
        tabIndex={-1}
        className={classNames('hg-stat-card', 'hg-focus-target', className)}
        style={style}
      >
        {overline}
        <StatCardStates
          state={state}
          loadingLabel={words.loading(label)}
          emptyMessage={emptyMessage}
          errorMessage={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={frame}
          unavailableTitle={unavailableTitle}
          unavailableMessage={unavailableMessage}
        />
      </div>
    );
  }

  const body = (
    <>
      {overline}
      {/* An absent figure is named in the value's own footprint — never a dash, never a zero. */}
      {gapNode ? (
        <div className="hg-stat-card-gap">{gapNode}</div>
      ) : (
        <div className="hg-stat-card-value-row">
          <span className="hg-stat-card-value">{shown}</span>
          {unit ? <span className="hg-stat-card-unit">{unit}</span> : null}
          {bandNode ? <span className="hg-stat-card-band">{bandNode}</span> : null}
        </div>
      )}
      {/* The slot. Directly under the value, above everything else. Never beside a gap. */}
      {prov ? <div className="hg-stat-card-provenance">{prov}</div> : null}
      <StatCardDelta
        delta={delta}
        dir={deltaDir}
        sentiment={deltaSentiment}
        sentimentLabel={sentimentLabel}
        words={words}
        suppressed={Boolean(gapNode)}
      />
      {children}
    </>
  );

  /* Tappable preview counts (SCR-M02-05 / SCR-M01-17): the whole card is the target, so it clears
     44×44 many times over, and it is a real button rather than a div with a click handler. The
     web half's hover ring is a CSS :hover rule rather than the source's two JS handlers.

     The card IS the button here, so the caller's `style` frames the button exactly as it frames
     the div on the other two branches — the source spreads it into one shell, not into three. */
  if (onClick) {
    return (
      <Pressable
        className={classNames('hg-stat-card', 'hg-stat-card-button', className)}
        style={style}
        onPress={onClick}
        accessibilityLabel={ariaLabel}
      >
        {body}
      </Pressable>
    );
  }
  return (
    <div
      ref={frame}
      tabIndex={-1}
      className={classNames('hg-stat-card', 'hg-focus-target', className)}
      style={style}
    >
      {body}
    </div>
  );
}
