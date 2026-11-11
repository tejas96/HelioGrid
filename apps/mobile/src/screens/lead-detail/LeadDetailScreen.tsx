import { useLeadDetailScreen } from '@heliogrid/data/react';
import {
  destinationLabel,
  leadAssignPickerWords,
  leadDetailPageWords,
  leadDetailSheetWords,
  leadTitleWords,
  leadWorkCardsWords,
  markWonWords,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  LeadAssignPicker,
  LeadDetailSheet,
  LeadDetailStates,
  LeadRecordMenu,
  MarkWonSheet,
  markWonSheetOf,
  useFormat,
} from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { ShellPage } from '../shell/components/ShellPage';
import { LeadDetailBody } from './components/LeadDetailBody';
import { useLeadDetailMoves } from './hooks/use-lead-detail-moves';
import { styles } from './styles';

/** A lead opens at `heliogrid://leads/<id>` — from a list, a search result or a notice (`F6-02`). */
type Props = StaticScreenProps<{ leadId: string }>;

/**
 * Lead Detail on the phone (`SCR-M02-04`, the 375 frames): a rep on a call or at the door, one hand
 * on the phone. Call, Message, Log, Visit and Design sit in thumb reach under the hero; the six
 * questions are answered inline as the customer talks; contacts and calling facts sit above the
 * history. Everything read, answered and sent is `useLeadDetailScreen`'s, the web's too; the
 * phone's own parts are the dialler, the share sheet, the file chooser and the ways back.
 */
export function LeadDetailScreen({ route }: Props) {
  const t = useTranslate();
  const format = useFormat();
  const screen = useLeadDetailScreen(route.params.leadId, format.pack.timeZone);
  const moves = useLeadDetailMoves(screen.files);
  const words = leadDetailPageWords(t);
  const { read } = screen;
  /* The page stays while a failed read is tried again: the screen reader lands on it. */
  const page = useRef<View>(null);
  const record = read.kind === 'ready' ? read.value.lead.lead : null;
  const heading =
    record === null
      ? { title: destinationLabel(t, 'leads') }
      : leadTitleWords(t, {
          name: record.name,
          phone: format.phone(record.phoneE164),
          city: record.city,
        });
  return (
    <ShellPage
      inView="leads"
      drillDown={{
        ...heading,
        back: words.backToList,
        onBack: moves.back,
        nameTitle: record !== null,
        stripless: true,
        searchless: true,
        actions:
          read.kind === 'ready' ? (
            <LeadRecordMenu
              screen={screen}
              lead={read.value.lead}
              view={read.value.view}
              onAddReferral={moves.addReferral}
              onMerge={moves.merge}
              onMarkWon={screen.won.open}
              words={leadWorkCardsWords(t, read.value.lead, read.value.view, format.date)}
            />
          ) : undefined,
      }}
    >
      <View ref={page} style={styles.page}>
        {read.kind === 'ready' ? (
          <LeadDetailBody screen={screen} shown={read.value} moves={moves} />
        ) : (
          <LeadDetailStates
            read={read}
            words={words}
            onBackToList={moves.toLeads}
            focusAfter={page}
          />
        )}
      </View>
      {read.kind === 'ready' ? (
        <>
          <LeadDetailSheet
            screen={screen}
            lead={read.value.lead}
            view={read.value.view}
            onHandOn={moves.share}
            onMerge={moves.merge}
            words={leadDetailSheetWords(t, 'share')}
          />
          <MarkWonSheet
            {...markWonSheetOf(screen.won, moves.openProject, screen.days.today)}
            words={markWonWords(
              t,
              read.value.lead.lead.name ?? format.phone(read.value.lead.lead.phoneE164),
            )}
          />
          <LeadAssignPicker
            assign={screen.assign}
            ownerId={read.value.lead.lead.owner?.userId ?? null}
            words={leadAssignPickerWords(t, read.value.lead.lead.name)}
          />
        </>
      ) : null}
    </ShellPage>
  );
}
