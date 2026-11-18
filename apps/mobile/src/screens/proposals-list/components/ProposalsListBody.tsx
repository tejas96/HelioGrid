import type { ProposalRow } from '@heliogrid/contracts';
import type { ProposalListScreen } from '@heliogrid/data/react';
import {
  pickLeadLine,
  pickLeadWords,
  proposalActFailureWords,
  proposalListPageWords,
  proposalListWords,
  proposalStartSheetSaid,
} from '@heliogrid/i18n';
import {
  Button,
  type FocusHandle,
  LargeTitle,
  PickLeadSheet,
  ProposalList,
  ProposalStartSheet,
  proposalStartSheetPropsOf,
  ShellGlyph,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import { QuickAddForProposal } from '../../quick-add-lead';
import { useProposalFormats } from '../../shared/use-proposal-formats';
import { styles } from '../styles';

/**
 * The page: its large title with what waits on a customer, *New proposal* in thumb reach under it,
 * the chips, then one card per proposal (`ProposalList`, the web's too). *Try again* lands the
 * screen reader on the title, which stays while the list reads again. *New proposal* asks who it
 * is for first; a card's copy asks which lead.
 */
export function ProposalsListBody({
  screen,
  onNewVersion,
}: {
  screen: ProposalListScreen;
  /** The builder, for a new version of a row that is not current (`F8-18`). */
  onNewVersion: (row: ProposalRow) => void;
}) {
  const title = useRef<FocusHandle>(null);
  const { t, format, formats } = useProposalFormats();
  const { flow, waiting } = screen;
  const page = proposalListPageWords(t, formats, {
    waiting: waiting?.count ?? 0,
    waitingValue: waiting?.value ?? '0',
  });
  const { leads } = flow.picker;
  const named = (lead: { name: string | null; phoneE164: string }) =>
    lead.name ?? format.phone(lead.phoneE164);
  return (
    <View style={styles.page}>
      <LargeTitle
        title={page.title}
        summary={waiting === null ? undefined : page.summary}
        titleRef={title}
      />
      {screen.canStart ? (
        <Button
          size="lg"
          fullWidth
          icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
          onClick={flow.openNew}
        >
          {page.newProposal}
        </Button>
      ) : null}
      <ProposalList
        read={screen.read}
        room="narrow"
        filter={screen.filter}
        onFilter={screen.setFilter}
        words={proposalListWords(t, formats, screen.readerId)}
        onOpen={screen.open}
        {...(screen.canStart ? { onCopy: flow.openCopy, onNewVersion } : {})}
        {...(screen.hasMore ? { onMore: screen.showMore } : {})}
        loadingMore={screen.loadingMore}
        focusAfter={title}
      />
      {flow.stage === 'capture' ? (
        <QuickAddForProposal onLeft={flow.close} onLead={flow.startOn} />
      ) : null}
      <ProposalStartSheet
        {...proposalStartSheetPropsOf(
          flow.start,
          proposalStartSheetSaid(t, formats, {
            name: flow.customerName ?? '',
            segment: flow.customerSegment,
            ...flow.start,
          }),
        )}
      />
      <PickLeadSheet
        open={flow.stage === 'pick'}
        onClose={flow.close}
        words={pickLeadWords(t)}
        query={flow.picker.query}
        onQuery={flow.picker.setQuery}
        leads={
          leads.kind === 'ready'
            ? {
                ...leads,
                value: leads.value.map((lead) => ({
                  id: lead.id,
                  name: named(lead),
                  line: pickLeadLine({ city: lead.city, phone: format.phone(lead.phoneE164) }),
                })),
              }
            : leads
        }
        pendingId={flow.picker.pendingId}
        failure={flow.stage === 'pick' ? proposalActFailureWords(t, flow.failure) : null}
        onPick={flow.picker.pick}
        onNewCustomer={flow.picker.newCustomer}
        focusAfter={title}
      />
    </View>
  );
}
