import { useUsageScreen } from '@heliogrid/data/react';
import { BILLING_HOME, usagePageWords, usageViewWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type UsageInput,
  UsagePage,
  usageLedgerViewOf,
  usagePageViewOf,
  usageWaitingView,
  useFormat,
} from '@heliogrid/ui';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { useUsageAdapter } from './hooks/use-usage-adapter';

/**
 * Usage behind `More` on the phone (`SCR-M12-04`, the 375 frames): the page's bar with its way back
 * to Billing, then the body in one column; a meter's events rise as a sheet. What is read is
 * `useUsageScreen`'s and what is drawn `usagePageViewOf`'s, the web's too; the phone's own parts are
 * the plans route and the way back (`useUsageAdapter`).
 */
export function UsageScreen() {
  const drillDown = useSettingsDrillDown('usage');
  const { t, locale } = useI18n();
  const format = useFormat();
  const adapter = useUsageAdapter();
  const screen = useUsageScreen(adapter);
  const viewWords = usageViewWords(t, locale);
  const input: UsageInput = {
    words: viewWords,
    format,
    marketName: viewWords.packText(format.pack.name),
    now: Date.now(),
  };
  const usage =
    screen.read.kind === 'ready' && screen.read.value.kind === 'owner'
      ? screen.read.value.usage
      : null;
  const read =
    screen.read.kind === 'ready'
      ? { kind: 'ready' as const, value: usagePageViewOf(screen.read.value, input) }
      : screen.read;
  const ledger = screen.ledger;
  return (
    <ShellPage
      inView="more"
      drillDown={{ ...drillDown, back: t(BILLING_HOME.backToBilling), onBack: adapter.toBilling }}
    >
      <UsagePage
        words={usagePageWords(t)}
        read={read}
        waiting={usageWaitingView(input, screen.owner)}
        layout="column"
        ledger={
          ledger === null
            ? null
            : {
                meter: ledger.meter,
                view: usageLedgerViewOf(ledger.meter, usage, ledger.read, ledger.more, input),
              }
        }
        acts={{
          onPlans: screen.toPlans,
          onLedger: screen.openLedger,
          onCloseLedger: screen.closeLedger,
          onMoreEvents: screen.moreEvents,
        }}
      />
    </ShellPage>
  );
}
