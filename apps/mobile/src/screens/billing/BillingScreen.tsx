import {
  useBillingDocuments,
  useBillingHistory,
  useBillingHomeScreen,
  useBillingReminders,
} from '@heliogrid/data/react';
import { billingPageWords, billingSheetsWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  BillingHome,
  type BillingHomeFocus,
  BillingSheets,
  billingPageOf,
  billingSheetsViewOf,
  type FocusHandle,
  useFormat,
} from '@heliogrid/ui';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { BillingToasts } from './components/BillingToasts';
import { useBillingAdapter } from './hooks/use-billing-adapter';

/**
 * Billing behind `More` on the phone (`SCR-M12-02`, the 375 frames): the settings page's bar with
 * its way back, then the body in one column; the record lists and the two asks rise as sheets.
 * What is read and acted on is `useBillingHomeScreen`'s and what is drawn `billingPageOf`'s, the
 * web's too; the phone's own parts are the system browser for a gateway page and the plans route
 * (`useBillingAdapter`), the toasts above the pill, and where the screen reader lands.
 */
export function BillingScreen() {
  const drillDown = useSettingsDrillDown('billing');
  const { t, locale } = useI18n();
  const format = useFormat();
  const adapter = useBillingAdapter();
  const screen = useBillingHomeScreen(adapter);
  const page = billingPageOf(screen, billingPageWords(t, locale), {
    format,
    now: Date.now(),
    onAllUsage: adapter.toUsage,
  });
  /* Each record list reads only while it is open. */
  const lists = {
    invoices: useBillingDocuments(screen.sheet === 'invoices'),
    reminders: useBillingReminders(screen.sheet === 'reminders'),
    history: useBillingHistory(screen.sheet === 'history'),
  };
  /* The bar's title: where `Try again` hands the screen reader once it has gone. */
  const heading = useRef<FocusHandle>(null);
  const body = useRef<BillingHomeFocus>(null);
  /* A closed toast hands the screen reader back to the page it spoke about. */
  const content = useRef<View>(null);

  /* A landed cancel or refund changed the page: the reader goes to its needs; a kept plan, to the plan. */
  useEffect(() => {
    if (screen.done?.kind === 'kept') body.current?.focusPlan();
    else if (screen.done !== null) body.current?.focusNeeds();
  }, [screen.done]);

  /* Arrived from the plans with a downgrade scheduled: the screen reader lands on `Needs you` (frame 16). */
  const { arrival, clearArrival } = screen;
  useEffect(() => {
    if (arrival !== 'needs') return;
    body.current?.focusNeeds();
    clearArrival();
  }, [arrival, clearArrival]);

  return (
    <ShellPage
      inView="more"
      drillDown={{ ...drillDown, titleRef: heading, summary: page.summary ?? undefined }}
    >
      <View ref={content}>
        <BillingHome ref={body} {...page.body} layout="column" focusAfter={heading} />
      </View>
      <BillingSheets {...billingSheetsViewOf(screen, lists, page, billingSheetsWords(t))} />
      <BillingToasts screen={screen} focusAfter={content} />
    </ShellPage>
  );
}
