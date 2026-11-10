import type { UsageEventMeter } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { type RefObject, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { landFocusOn } from '../../primitives/FocusAfter';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { Text } from '../../primitives/Text/Text.native';
import { figure } from '../BillingHome/BillingHome.values';
import { BillingStatusChip } from '../BillingHome/BillingNeeds.native';
import { BillingQuiet } from '../BillingHome/BillingQuiet.native';
import { BillingValueText, valueRuns } from '../BillingStrip/BillingValue.native';
import { Block } from '../Block/Block.native';
import { ListRow } from '../ListRow/ListRow.native';
import { ScopeNote } from '../ScopeNote/ScopeNote.native';
import { UsageLedger } from './UsageLedger.native';
import type { UsagePageProps, UsagePageView } from './UsagePage.types';
import { type UsageOpeners, UsagePlansRow, UsageRegion } from './UsageRegion.native';

/**
 * The usage screen's body on the phone (`SCR-M12-04`, the 375 frames): the cycle line and its one
 * chip, `Nothing used yet` or `Needs you`, the two cards, whose screen it is, and the way to a
 * bigger plan; a meter's events rise as a sheet. The phone has one column whatever `layout` says.
 * The shell draws the bar, its way back and the billing strip.
 */
export function UsagePage(props: UsagePageProps) {
  const { words, read, acts } = props;
  const firstCard = useRef<View>(null);
  const openers: UsageOpeners = {
    voice_minutes: useRef<View>(null),
    otp_delivery: useRef<View>(null),
  };
  const retried = useRef(false);
  /* `Try again` has gone with its block: the reader lands on the first card's heading once drawn. */
  useEffect(() => {
    /* Only once the read is ready: a retry passes through loading first, whose cards may not stay. */
    if (!retried.current || read.kind !== 'ready') return;
    retried.current = false;
    landFocusOn(firstCard);
  }, [read.kind]);
  const shown = useRef(props.ledger);
  if (props.ledger !== null) shown.current = props.ledger;
  const closeLedger = () => {
    const meter: UsageEventMeter | undefined = shown.current?.meter;
    acts.onCloseLedger();
    if (meter !== undefined) landFocusOn(openers[meter]);
  };

  if (read.kind === 'failed') {
    return (
      <View style={styles.page}>
        <Block
          style={styles.flushRegion}
          density="expressive"
          read={{
            kind: 'failed',
            retry: () => {
              retried.current = true;
              read.retry();
            },
          }}
          loadingLabel={words.loading}
          errorTitle={words.errorTitle}
          errorMessage={words.errorMessage}
          retryLabel={words.tryAgain}
        />
        {props.waiting.plans === null ? null : (
          <UsagePlansRow plans={props.waiting.plans} onPlans={acts.onPlans} />
        )}
      </View>
    );
  }
  if (read.kind === 'empty' || (read.kind === 'loading' && props.waiting.limits === null)) {
    /* No subscription; or a person who is not the Owner, who waits on no card of the Owner's. */
    return (
      <View style={styles.page}>
        <Block density="expressive" read={{ kind: read.kind }} loadingLabel={words.loading} />
      </View>
    );
  }
  const view = read.kind === 'ready' ? read.value : props.waiting;
  return (
    <>
      <UsageBody {...props} view={view} firstCard={firstCard} openers={openers} />
      <UsageLedger
        open={props.ledger !== null}
        view={shown.current?.view ?? null}
        words={words}
        onClose={closeLedger}
        onMore={acts.onMoreEvents}
      />
    </>
  );
}

function UsageBody({
  view,
  words,
  acts,
  firstCard,
  openers,
}: UsagePageProps & {
  view: UsagePageView;
  firstCard: RefObject<View | null>;
  openers: UsageOpeners;
}) {
  const regions = [view.limits, view.included].flatMap((region) =>
    region === null ? [] : [region],
  );
  return (
    <View style={styles.page}>
      {view.cycleLine === null && view.chip === null ? null : (
        <View style={styles.cycle}>
          {view.cycleLine === null ? null : (
            <Text variant="body-sm" color="secondary">
              {view.cycleLine}
            </Text>
          )}
          {view.chip === null ? null : <BillingStatusChip chip={view.chip} />}
        </View>
      )}
      {view.teaching === null ? null : (
        <BillingQuiet art="none-yet" title={view.teaching.title} message={view.teaching.body} />
      )}
      {view.needs === null ? null : (
        <Block style={styles.flushRegion} density="expressive" title={words.needsYou}>
          <View style={styles.needs}>
            {view.needs.map((row) => (
              <ListRow
                key={row.key}
                title={row.title}
                density="expressive"
                style={styles.needRow}
                marks={<BillingStatusChip chip={row.chip} />}
                subtitleWrap
                subtitleTone={row.tone}
                {...(row.figure === null
                  ? {}
                  : { trailing: <BillingValueText value={figure(row.figure)} variant="body" /> })}
                {...(row.line === null ? {} : { subtitle: <>{valueRuns(row.line)}</> })}
              />
            ))}
          </View>
        </Block>
      )}
      {regions.map((region, index) => (
        <View key={region.title} ref={index === 0 ? firstCard : undefined}>
          <UsageRegion
            region={region}
            extra={region === view.included ? view.extra : null}
            words={words}
            plans={view.plans}
            openers={openers}
            onLedger={acts.onLedger}
            onPlans={acts.onPlans}
          />
        </View>
      ))}
      {view.scope === null ? null : (
        /* With no card to land on — a person who is not the Owner — `Try again` lands here. */
        <View ref={regions.length === 0 ? firstCard : undefined} style={styles.scope}>
          <ScopeNote title={view.scope} variant="panel" />
        </View>
      )}
      {view.plans === null ? null : <UsagePlansRow plans={view.plans} onPlans={acts.onPlans} />}
    </View>
  );
}

const styles = StyleSheet.create({
  /* A region under the hero stands on the page's own edges, as the web's does. */
  flushRegion: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: theme.spacing['sp-2'] },
  /** The board's column: regions `sp-5` apart; the shell pads the sides and scrolls it. */
  page: { gap: theme.spacing['sp-5'] },
  /** The cycle line and the one chip share a 44 line, and wrap as one when the words are long. */
  cycle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: theme.spacing['sp-2'],
    columnGap: theme.spacing['sp-3'],
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: theme.spacing['sp-1'],
  },
  needs: { gap: theme.spacing['sp-5'] },
  /** The row sits on the card's own edges, so its figure ends on the card's right edge. */
  needRow: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 0,
    alignItems: 'flex-start',
  },
  scope: { flexDirection: 'row', paddingHorizontal: theme.spacing['sp-1'] },
});
