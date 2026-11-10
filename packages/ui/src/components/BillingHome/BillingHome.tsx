import type { TranslatedText } from '@heliogrid/contracts';
import { type ReactNode, type RefObject, useRef } from 'react';
import { landFocusOn } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell';
import { BillingStrip } from '../BillingStrip';
import { Block } from '../Block';
import { Button } from '../Button';
import { ListRow } from '../ListRow';
import { bodyActingOf, retryLandingOn } from './BillingHome.logic';
import type { BillingBodyActing, BillingHomeProps } from './BillingHome.types';
import { BillingInvoiceRows, BillingInvoiceTable } from './BillingInvoiceRows';
import { BillingNeeds } from './BillingNeeds';
import { BillingMethod, BillingPlan } from './BillingPlan';
import { BillingQuiet } from './BillingQuiet';
import { BillingUsage } from './BillingUsage';
import { useNeedsFocus } from './use-needs-focus';

/**
 * The billing home's body (`SCR-M12-02`). At 375 one column: what needs the Owner, the plan, the
 * usage, the method, the invoices, the two records, the quiet cancel. At width two columns, 5fr /
 * 7fr — needs, plan and usage left; method, the invoice table, records and cancel right — the same
 * parts in the same order, so the column is the columns read top to bottom.
 */
export function BillingHome(props: BillingHomeProps) {
  const { words, read, layout, strip } = props;
  const needsFrame = useRef<HTMLDivElement>(null);
  const planFrame = useRef<HTMLDivElement>(null);
  useNeedsFocus(
    props.ref,
    read.kind === 'ready' && props.needs !== null,
    () => requestAnimationFrame(() => needsFrame.current?.focus()),
    () => requestAnimationFrame(() => planFrame.current?.focus()),
  );
  if (read.kind === 'failed') {
    return (
      <div className="hg-billing">
        <Block
          density="expressive"
          read={retryLandingOn(read, () => landFocusOn(props.focusAfter))}
          loadingLabel={words.loading}
          errorTitle={words.failedTitle}
          errorMessage={words.failedMessage}
          retryLabel={words.tryAgain}
        />
      </div>
    );
  }
  const { left, right } =
    read.kind === 'loading' ? loadingParts(props) : readyParts(props, needsFrame, planFrame);
  return (
    <div className="hg-billing">
      {strip === null || read.kind === 'loading' ? null : (
        <BillingStrip
          strip={strip}
          words={{
            howWorkedOut: words.howWorkedOut,
            derivationKinds: words.derivationKinds,
            moreLabel: words.bannerMore,
          }}
        />
      )}
      <div className="hg-billing-body" data-layout={layout}>
        <div className="hg-billing-side">{left}</div>
        <div className="hg-billing-side">{right}</div>
      </div>
    </div>
  );
}

/** Frame 4: each region's header with its own loading, in place of what it will hold. */
function loadingParts({ words }: BillingHomeProps): { left: ReactNode; right: ReactNode } {
  const loading = (title: TranslatedText, key: string) => (
    <Block
      key={key}
      title={title}
      density="expressive"
      read={{ kind: 'loading' }}
      loadingLabel={words.loading}
    />
  );
  return {
    left: [loading(words.yourPlan, 'plan'), loading(words.usageThisCycle, 'usage')],
    right: loading(words.invoices, 'invoices'),
  };
}

function readyParts(
  props: BillingHomeProps,
  needsFrame: RefObject<HTMLDivElement | null>,
  planFrame: RefObject<HTMLDivElement | null>,
): { left: ReactNode; right: ReactNode } {
  const { words, needs, plan, usage, method, records, cancellable, needFailure, acts } = props;
  const pending = bodyActingOf(props);
  /* While an act's answer is out, or a PDF signs, every other way on waits (`F7-23` N5). */
  const when = (press: () => void) => (pending === null ? press : undefined);
  const chevron = <ShellGlyph name="chevron-right" />;
  const left = (
    <>
      {needs === null ? null : (
        /* A landed cancel or refund hands the keyboard here (`BillingHomeFocus`). */
        <div ref={needsFrame} tabIndex={-1} className="hg-focus-target">
          <BillingNeeds
            needs={needs}
            words={words}
            pending={pending}
            failure={needFailure}
            onAct={acts.onNeedAct}
          />
        </div>
      )}
      {plan === null ? null : (
        /* `Keep <plan> instead` hands the keyboard here once its need has gone. */
        <div ref={planFrame} tabIndex={-1} className="hg-focus-target">
          <BillingPlan plan={plan} words={words} onRoute={when(acts.onRoute)} />
        </div>
      )}
      {usage === null ? null : (
        <BillingUsage usage={usage} words={words} onAllUsage={when(acts.onAllUsage)} />
      )}
    </>
  );
  const right = (
    <>
      {method === null ? null : (
        <BillingMethod
          method={method}
          words={words}
          pending={pending}
          onUpdate={acts.onUpdateMethod}
        />
      )}
      <InvoicesBlock {...props} pending={pending} />
      {records ? (
        <div className="hg-billing-stack" data-gap="tile">
          <ListRow
            className="hg-billing-record"
            density="expressive"
            title={words.paymentReminders}
            subtitle={words.paymentRemindersLine}
            trailing={chevron}
            onClick={when(acts.onReminders)}
          />
          <ListRow
            className="hg-billing-record"
            density="expressive"
            title={words.planHistory}
            subtitle={words.planHistoryLine}
            trailing={chevron}
            onClick={when(acts.onHistory)}
          />
        </div>
      ) : null}
      {cancellable ? (
        <div className="hg-billing-start">
          <Button
            variant="ghost"
            size="md"
            tone="danger"
            disabled={pending !== null}
            onClick={acts.onCancel}
          >
            {words.cancelSubscription}
          </Button>
        </div>
      ) : null}
    </>
  );
  return { left, right };
}

/** `Invoices`: the three latest — a list at 375, the table at width — `All N invoices`, the source. */
function InvoicesBlock({
  invoices,
  words,
  layout,
  acts,
  pending,
  pendingPdf,
}: Omit<BillingHomeProps, 'pending'> & { pending: BillingBodyActing }) {
  if (invoices === null) return null;
  if (invoices.empty !== null) {
    return (
      <Block title={words.invoices} density="expressive">
        <BillingQuiet
          art="none-yet"
          title={invoices.empty.title}
          message={invoices.empty.message}
        />
      </Block>
    );
  }
  const source = invoices.source === null ? undefined : { source: invoices.source };
  return (
    <Block title={words.invoices} density="expressive" provenance={source}>
      <div className="hg-billing-stack" data-gap={layout === 'columns' ? '3' : 'tile'}>
        {layout === 'columns' ? (
          <BillingInvoiceTable
            rows={invoices.rows}
            columns={words.invoiceColumns}
            words={words.table}
            pendingPdf={pendingPdf}
            waiting={pending !== null}
            onPdf={acts.onInvoicePdf}
          />
        ) : (
          <BillingInvoiceRows
            rows={invoices.rows}
            pendingPdf={pendingPdf}
            waiting={pending !== null}
            onPdf={acts.onInvoicePdf}
          />
        )}
        {invoices.all === null ? null : (
          <ListRow
            className="hg-billing-flush"
            density="functional"
            title={invoices.all}
            trailing={<ShellGlyph name="chevron-right" />}
            onClick={pending === null ? acts.onAllInvoices : undefined}
          />
        )}
      </div>
    </Block>
  );
}
