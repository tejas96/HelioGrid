import { useLeadInboxScreen } from '@heliogrid/data/react';
import { leadInboxSummary, leadInboxWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { LeadInbox, useFormat } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { ShellNotFoundState } from '../shell/components/ShellNotFoundState';
import { ShellPage } from '../shell/components/ShellPage';
import { InboxBulkToast } from './components/InboxBulkToast';

/**
 * The Lead Inbox on the phone (`SCR-M02-02`, the 375 frames): the owner's morning triage, often
 * outdoors and one-handed. The newest lead fills the deck with the team's faces under it — one tap
 * gives, one tap bins — and Up next waits below; the picker is a sheet. What is read, acted on,
 * selected and given is `useLeadInboxScreen`'s and what it draws `LeadInbox`'s, the web's too; the
 * phone's own parts are the way back and its moves to quick add, the import and a lead.
 */
export function LeadInboxScreen() {
  const screen = useLeadInboxScreen();
  const { t } = useI18n();
  const format = useFormat();
  const navigation = useNavigation();
  const words = leadInboxWords(t);
  /* Where the screen reader goes once a returned act's line or the bulk line is cleared. */
  const page = useRef<View>(null);
  const { read, view } = screen;
  if (!screen.allowed) {
    return (
      <ShellPage inView="leads">
        <ShellNotFoundState />
      </ShellPage>
    );
  }
  const summary =
    read.kind === 'ready'
      ? leadInboxSummary(t, { waiting: view.waiting, pastDay: view.pastDay, oldest: null })
      : read.kind === 'empty'
        ? words.nothingWaiting
        : undefined;
  /* A referral is added through quick add, where the person picks who sent them; a file has its own door. */
  const quickAdd = () => navigation.navigate('QuickAddLead');
  return (
    <ShellPage
      inView="leads"
      drillDown={{
        title: words.title,
        back: words.backToLeads,
        onBack: () => navigation.navigate('Leads'),
        ...(summary === undefined ? {} : { summary }),
      }}
    >
      <View ref={page}>
        <LeadInbox
          screen={screen}
          layout="deck"
          words={words}
          money={format.money}
          onAdd={quickAdd}
          onWay={(way) => (way === 'import' ? navigation.navigate('LeadImport') : quickAdd())}
          onOpen={(leadId) => navigation.navigate('LeadDetail', { leadId })}
          focusAfter={page}
        />
      </View>
      <InboxBulkToast
        report={screen.bulkReport}
        onDismiss={screen.dismissBulkReport}
        focusAfter={page}
      />
    </ShellPage>
  );
}
