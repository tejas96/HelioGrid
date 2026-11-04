import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { landFocusOn } from '../../primitives/FocusAfter';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { ListRow } from '../ListRow/ListRow.native';
import { bodyActingOf, retryLandingOn } from './BillingHome.logic';
import type { BillingHomeProps } from './BillingHome.types';
import { BillingInvoices } from './BillingInvoiceRows.native';
import { BillingNeeds, BillingStrip } from './BillingNeeds.native';
import { BillingMethod, BillingPlan, BillingUsage } from './BillingPlan.native';
import { useNeedsFocus } from './use-needs-focus';

/**
 * The billing home's body on the phone (`SCR-M12-02`, the 375 frames): the strip, then one
 * column — what needs the Owner, the plan, the usage, the payment method, the latest invoices,
 * the two record rows and the quiet cancel. The phone has one column whatever `layout` says. The
 * shell's bar, the record sheets and the asks are the screen's.
 */
export function BillingHome(props: BillingHomeProps) {
  const { words, read } = props;
  const needsFrame = useRef<View>(null);
  const planFrame = useRef<View>(null);
  useNeedsFocus(
    props.ref,
    read.kind === 'ready' && props.needs !== null,
    () => landFocusOn(needsFrame),
    () => landFocusOn(planFrame),
  );
  if (read.kind === 'failed') {
    return (
      <View style={styles.page}>
        <Block
          density="expressive"
          read={retryLandingOn(read, () => landFocusOn(props.focusAfter))}
          loadingLabel={words.loading}
          errorTitle={words.failedTitle}
          errorMessage={words.failedMessage}
          retryLabel={words.tryAgain}
        />
      </View>
    );
  }
  if (read.kind === 'loading') return <BillingLoading {...props} />;
  return <BillingReady {...props} needsFrame={needsFrame} planFrame={planFrame} />;
}

/** Frame 4: each region's heading over its own loading, so nothing jumps when it arrives. */
function BillingLoading({ words }: BillingHomeProps) {
  return (
    <View style={styles.page}>
      {[words.yourPlan, words.usageThisCycle, words.invoices].map((title) => (
        <Block
          key={title}
          density="expressive"
          title={title}
          read={{ kind: 'loading' }}
          loadingLabel={words.loading}
        />
      ))}
    </View>
  );
}

function BillingReady({
  needsFrame,
  planFrame,
  ...props
}: BillingHomeProps & {
  needsFrame: RefObject<View | null>;
  planFrame: RefObject<View | null>;
}) {
  const { words, acts } = props;
  const pending = bodyActingOf(props);
  /* While an act's answer is out, or a PDF signs, every other way on waits (`F7-23` N5). */
  const free = pending === null;
  const when = (press: () => void) => (free ? press : undefined);
  return (
    <View style={styles.page}>
      {props.strip === null ? null : (
        <BillingStrip strip={props.strip} moreLabel={words.bannerMore} />
      )}
      {props.needs === null ? null : (
        /* A landed cancel or refund hands the screen reader here (`BillingHomeFocus`). */
        <View ref={needsFrame}>
          <BillingNeeds
            needs={props.needs}
            words={words}
            pending={pending}
            needFailure={props.needFailure}
            onAct={acts.onNeedAct}
          />
        </View>
      )}
      {props.plan === null ? null : (
        /* `Keep <plan> instead` hands the screen reader here once its need has gone. */
        <View ref={planFrame}>
          <BillingPlan plan={props.plan} words={words} onRoute={when(acts.onRoute)} />
        </View>
      )}
      {props.usage === null ? null : (
        <BillingUsage usage={props.usage} words={words} onAllUsage={when(acts.onAllUsage)} />
      )}
      {props.method === null ? null : (
        <BillingMethod
          method={props.method}
          words={words}
          pending={pending}
          onUpdate={acts.onUpdateMethod}
        />
      )}
      {props.invoices === null ? null : (
        <BillingInvoices
          invoices={props.invoices}
          words={words}
          pending={pending}
          pendingPdf={props.pendingPdf}
          onPdf={acts.onInvoicePdf}
          onAll={when(acts.onAllInvoices)}
        />
      )}
      {props.records ? (
        <View style={styles.records}>
          <RecordRow
            title={words.paymentReminders}
            line={words.paymentRemindersLine}
            onPress={when(acts.onReminders)}
          />
          <RecordRow
            title={words.planHistory}
            line={words.planHistoryLine}
            onPress={when(acts.onHistory)}
          />
        </View>
      ) : null}
      {props.cancellable ? (
        <View style={styles.start}>
          <Button variant="ghost" size="md" tone="danger" disabled={!free} onClick={acts.onCancel}>
            {words.cancelSubscription}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

/** A record list's row at rest on the page: a tile with its name, its line and the chevron. */
function RecordRow({
  title,
  line,
  onPress,
}: {
  title: BillingHomeProps['words']['planHistory'];
  line: BillingHomeProps['words']['planHistoryLine'];
  onPress: (() => void) | undefined;
}) {
  return (
    <ListRow
      title={title}
      subtitle={line}
      trailing={<ShellGlyph name="chevron-right" size="md" tone="secondary" />}
      density="expressive"
      style={styles.recordRow}
      {...(onPress === undefined ? {} : { onClick: onPress })}
    />
  );
}

const styles = StyleSheet.create({
  /** The board's column: regions `sp-5` apart; the shell pads the sides and scrolls it. */
  page: { gap: theme.spacing['sp-5'] },
  records: { gap: theme.layout['tile-gap'] },
  recordRow: { ...tileSurface, borderRadius: theme.radius['r-tile'] },
  start: { flexDirection: 'row' },
});
