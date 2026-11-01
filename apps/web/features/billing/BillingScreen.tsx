'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import {
  type BillingHomeScreen,
  useBillingDocuments,
  useBillingHistory,
  useBillingHomeScreen,
  useBillingReminders,
} from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import {
  billingPageWords,
  billingRecordWords,
  billingSheetsWords,
  settingsRowName,
  type Translator,
  toastHostWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  BillingHome,
  type BillingHomeFocus,
  type BillingPage,
  BillingSheets,
  billingPageOf,
  billingSheetsViewOf,
  Text,
  ToastHost,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { settingsRowPath } from '../settings';
import { useBillingAdapter } from './hooks/use-billing-adapter';

/**
 * The room from which the body stands as the board's 1536 pair (5fr / 7fr): below it the left
 * column could not hold the 375 column's parts, so the page is the one column.
 */
const BILLING_COLUMNS_FROM = theme.layout['bp-desktop'];

/**
 * Billing behind `More` on the web (`SCR-M12-02`): what needs the Owner, the plan, the usage, the
 * method, the invoices and the records — the record lists as sheets or side panels and the two
 * asks. Every person may open it (`M12-56`); a person who is not the Owner reads the state and
 * whose act it is. What is read and acted on is `useBillingHomeScreen`'s and what is drawn
 * `billingPageOf`'s, the phone's too; this holds the web's own parts — the room's layout, the new
 * tab, the toasts and where focus lands.
 */
export function BillingScreen() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const router = useRouter();
  const adapter = useBillingAdapter();
  const screen = useBillingHomeScreen(adapter);
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const heading = useRef<HTMLDivElement>(null);
  const body = useRef<BillingHomeFocus>(null);
  const wide = width !== null && width >= BILLING_COLUMNS_FROM;
  const page = billingPageOf(screen, billingPageWords(t, locale), {
    format,
    now: Date.now(),
    onAllUsage: () => router.push(settingsRowPath(SETTINGS_SEGMENT.usage)),
  });
  /* Each record list reads only while it is open. */
  const lists = {
    invoices: useBillingDocuments(screen.sheet === 'invoices'),
    reminders: useBillingReminders(screen.sheet === 'reminders'),
    history: useBillingHistory(screen.sheet === 'history'),
  };

  /* A landed cancel or refund closed its ask and changed the page: the keyboard goes to its needs. */
  useEffect(() => {
    if (screen.done !== null) body.current?.focusNeeds();
  }, [screen.done]);

  return (
    /* A closed toast hands the keyboard back to the page it spoke about. */
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target">
      <div ref={heading} tabIndex={-1} className="hg-focus-target">
        <Text as="h1" variant="h2">
          {settingsRowName(t, 'billing')}
        </Text>
      </div>
      <BillingHome
        ref={body}
        {...page.body}
        layout={wide ? 'columns' : 'column'}
        focusAfter={heading}
      />
      <BillingSheets {...billingSheetsViewOf(screen, lists, page, billingSheetsWords(t))} />
      <ToastHost
        toasts={toastsOf(t, screen, page)}
        onDismiss={(id) => (id === 'pdf' ? screen.clearFailure() : screen.clearDone())}
        {...toastHostWords(t)}
        focusAfter={room}
      />
    </div>
  );
}

/** What a landed act says once, and a PDF that would not open (its row has no line of its own). */
function toastsOf(t: Translator['t'], screen: BillingHomeScreen, page: BillingPage) {
  const records = billingRecordWords(t);
  const toasts: { id: string; tone: 'success' | 'danger'; title: TranslatedText }[] = [];
  const { done } = screen;
  if (done?.kind === 'cancelled') {
    toasts.push({
      id: 'cancelled',
      tone: 'success',
      title: records.cancelledToast(page.input.format.date(done.runsUntil)),
    });
  }
  if (done?.kind === 'refunded') {
    toasts.push({
      id: 'refunded',
      tone: 'success',
      title: records.refundedToast(done.creditNoteNumber),
    });
  }
  const pdfFailure = page.failureOf('pdf');
  if (pdfFailure !== null) toasts.push({ id: 'pdf', tone: 'danger', title: pdfFailure });
  return toasts;
}
