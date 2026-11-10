import { type RefObject, useEffect, useRef } from 'react';
import { BillingChipMark } from '../BillingHome/BillingNeeds';
import { BillingQuiet } from '../BillingHome/BillingQuiet';
import { Block } from '../Block';
import { ScopeNote } from '../ScopeNote';
import { UsageLedger } from './UsageLedger';
import type { UsagePageProps, UsagePageView } from './UsagePage.types';
import { UsageNeeds, UsagePlansRow, UsageRegion } from './UsageRegion';
import { UsageStanding } from './UsageStanding';

/**
 * The usage screen's body (`SCR-M12-04`). At 375 one column: the cycle line and its one chip, then
 * `Nothing used yet`, `Needs you`, the two regions' tiles, whose screen this is, and `Bigger plans`.
 * At width the tiles' lane and the standing column (decision 14); a state with no figure is ONE
 * lane. The events of one meter open over either (`UsageLedger`).
 */
export function UsagePage(props: UsagePageProps) {
  const { words, read } = props;
  /* `Try again` swaps the failed card for the cards: the keyboard lands on the first one's heading. */
  const firstCard = useRef<HTMLDivElement>(null);
  const landing = useRef(false);
  /* Only once the read is ready: a retry passes through loading first, whose cards may not stay. */
  useEffect(() => {
    if (!landing.current || read.kind !== 'ready' || firstCard.current === null) return;
    landing.current = false;
    firstCard.current.focus({ preventScroll: true });
  });
  if (read.kind === 'failed') {
    return (
      <div className="hg-usage">
        <Block
          density="expressive"
          read={{
            kind: 'failed',
            retry: () => {
              landing.current = true;
              read.retry();
            },
          }}
          loadingLabel={words.loading}
          errorTitle={words.errorTitle}
          errorMessage={words.errorMessage}
          retryLabel={words.tryAgain}
        />
        {/* Error closes the meter cards and keeps `Bigger plans` (decision 15, frames s3 / d5). */}
        {props.waiting.plans === null ? null : (
          <UsagePlansRow plans={props.waiting.plans} onPlans={props.acts.onPlans} />
        )}
      </div>
    );
  }
  if (read.kind === 'empty' || (read.kind === 'loading' && props.waiting.limits === null)) {
    /* No subscription; or a person who is not the Owner, who waits on no card of the Owner's. */
    return (
      <div className="hg-usage">
        <Block density="expressive" read={{ kind: read.kind }} loadingLabel={words.loading} />
      </div>
    );
  }
  const view = read.kind === 'ready' ? read.value : props.waiting;
  return (
    <div className="hg-usage">
      {props.layout === 'columns' && view.cycle !== null ? (
        <Lanes {...props} view={view} firstCard={firstCard} />
      ) : (
        <Column {...props} view={view} firstCard={firstCard} />
      )}
      <UsageLedger {...props} />
    </div>
  );
}

interface PartProps extends UsagePageProps {
  readonly view: UsagePageView;
  readonly firstCard: RefObject<HTMLDivElement | null>;
}

/**
 * 375, and any state with no table to draw — the figures loading, or a person who is not the Owner,
 * whom the 1536 board gives ONE lane: whose screen this is, then `Needs you` (decision 7).
 */
function Column({ view, words, acts, layout, firstCard }: PartProps) {
  const regions = [view.limits, view.included].filter((region) => region !== null);
  const scope =
    view.scope === null ? null : (
      <UsageScope title={view.scope} landing={regions.length === 0 ? firstCard : null} />
    );
  const wide = layout === 'columns';
  return (
    <>
      {wide ? scope : null}
      {wide ? null : <UsageHead view={view} />}
      {view.teaching === null ? null : (
        <BillingQuiet art="none-yet" title={view.teaching.title} message={view.teaching.body} />
      )}
      {view.needs === null ? null : <UsageNeeds title={words.needsYou} rows={view.needs} />}
      {regions.map((region, index) => (
        /* The first card is where `Try again` hands the keyboard; it stays while the figures load. */
        <div
          key={region.title}
          ref={index === 0 ? firstCard : undefined}
          tabIndex={index === 0 ? -1 : undefined}
          className={index === 0 ? 'hg-focus-target' : undefined}
        >
          <UsageRegion
            region={region}
            extra={region === view.included ? view.extra : null}
            words={words}
            plans={view.plans}
            acts={acts}
          />
        </div>
      ))}
      {wide ? null : scope}
      {view.plans === null ? null : <UsagePlansRow plans={view.plans} onPlans={acts.onPlans} />}
    </>
  );
}

/**
 * At width for the Owner (decision 14): the regions' tiles in the lane, and the standing column
 * holding still beside them. The extra charges stand in that column, so no region closes on them.
 */
function Lanes({ view, words, acts, firstCard }: PartProps) {
  const regions = [view.limits, view.included].filter((region) => region !== null);
  return (
    <div className="hg-usage-lanes" data-lanes="two">
      <div ref={firstCard} tabIndex={-1} className="hg-usage-lane hg-focus-target">
        {regions.map((region) => (
          <UsageRegion
            key={region.title}
            region={region}
            extra={null}
            words={words}
            plans={view.plans}
            acts={acts}
          />
        ))}
      </div>
      <div className="hg-usage-side">
        <UsageStanding
          view={view}
          words={words}
          needsTitle={words.needsYou}
          onPlans={acts.onPlans}
        />
      </div>
    </div>
  );
}

/** The cycle every count covers and its reset, with the one status chip (decision 2). */
function UsageHead({ view }: { view: UsagePageView }) {
  if (view.cycleLine === null && view.chip === null) return null;
  return (
    <div className="hg-usage-head">
      {view.cycleLine === null ? null : <span className="hg-usage-cycle">{view.cycleLine}</span>}
      {view.chip === null ? null : <BillingChipMark chip={view.chip} />}
    </div>
  );
}

/**
 * Whose screen this is, for a person who is not the Owner (`M12-56`). With no card to land on,
 * `Try again` lands here (`landing`).
 */
function UsageScope({
  title,
  landing,
}: {
  title: NonNullable<UsagePageView['scope']>;
  landing: RefObject<HTMLDivElement | null> | null;
}) {
  return (
    <div
      ref={landing ?? undefined}
      tabIndex={landing === null ? undefined : -1}
      className="hg-usage-scope hg-focus-target"
    >
      <ScopeNote title={title} variant="panel" />
    </div>
  );
}
