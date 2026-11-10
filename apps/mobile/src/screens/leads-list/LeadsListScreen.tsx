import { useLeadsListScreen } from '@heliogrid/data/react';
import { leadsListWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';
import { ShellNotFoundState } from '../shell/components/ShellNotFoundState';
import { ShellPage } from '../shell/components/ShellPage';
import { LeadsListBody } from './components/LeadsListBody';
import { useLeadsListMoves } from './hooks/use-leads-list-moves';

/**
 * The Leads list on the phone (`SCR-M02-03`, the 375 frames): a rep between calls, often outdoors
 * on a slow network, finds one lead fast and sees where each deal stands; the owner pulls up the
 * quiet ones. What is read, filtered and counted is `useLeadsListScreen`'s, the web's too.
 */
export function LeadsListScreen() {
  return (
    <ShellPage inView="leads">
      <LeadsListPage />
    </ShellPage>
  );
}

/**
 * The page inside the shell — what quick add stands over too, so the list is there behind the
 * sheet and takes the new lead when it lands. A person whose shell offers no Leads meets not found.
 * Under quick add, `onAdd` reopens the capture in place: navigating to the screen already shown
 * does nothing, so the first run's *Add a lead* would open nothing there.
 */
export function LeadsListPage({ onAdd }: { onAdd?: () => void }) {
  const screen = useLeadsListScreen();
  const { t, locale } = useI18n();
  const format = useFormat();
  const moves = useLeadsListMoves();
  if (!screen.allowed) return <ShellNotFoundState />;
  const words = leadsListWords(t, { pack: format.pack, language: locale, now: Date.now() });
  return (
    <LeadsListBody screen={screen} words={words} moves={{ ...moves, add: onAdd ?? moves.add }} />
  );
}
