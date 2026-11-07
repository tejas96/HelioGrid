'use client';
import { useUsageScreen } from '@heliogrid/data/react';
import { settingsRowName, usagePageWords, usageViewWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  LargeTitle,
  UsagePage,
  usageLedgerViewOf,
  usagePageViewOf,
  usageWaitingView,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { useUsageAdapter } from './hooks/use-usage-adapter';

/**
 * The room from which the body stands as the board's 1536 pair — the tiles' lane and the 300px
 * standing column: below it the lane would squeeze the tiles, so the page is the one column.
 */
const USAGE_LANES_FROM = theme.layout['bp-desktop'];

/**
 * Usage behind `More` on the web (`SCR-M12-04`): this cycle's meters against the company's limits,
 * what needs the Owner, and one meter's events. Every person may open it (`M12-56`); a person who
 * is not the Owner sees which meter is at its cap and whose screen this is. What is read is
 * `useUsageScreen`'s and what is drawn `usagePageViewOf`'s, the phone's too; this holds the web's
 * own part — the room's layout.
 */
export function UsageScreen() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = useUsageScreen(useUsageAdapter());
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const words = usageViewWords(t, locale);
  const input = {
    words,
    format,
    marketName: words.packText(format.pack.name),
    now: Date.now(),
  };
  const { read, ledger } = screen;
  const usage = read.kind === 'ready' && read.value.kind === 'owner' ? read.value.usage : null;
  return (
    <div ref={room} className="hg-shell-page">
      <LargeTitle title={settingsRowName(t, 'usage')} />
      <UsagePage
        words={usagePageWords(t)}
        read={
          read.kind === 'ready'
            ? { kind: 'ready', value: usagePageViewOf(read.value, input) }
            : read
        }
        waiting={usageWaitingView(input, screen.owner)}
        layout={width !== null && width >= USAGE_LANES_FROM ? 'columns' : 'column'}
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
    </div>
  );
}
