import { useTrancheTemplates } from '@heliogrid/data/react';
import {
  paymentTermsFailureWords,
  paymentTermsSavedLine,
  paymentTermsWords,
  stageWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  PaymentTermsList,
  termsCardsOf,
  termsContextOf,
  termsLetterheadOf,
  useFormat,
} from '@heliogrid/ui';
import { useState } from 'react';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { useLeaveAsk } from '../shared/use-leave-ask';
import { ShellPage } from '../shell/components/ShellPage';
import { TermsActToast } from './components/TermsActToast';
import { TermsEditing } from './components/TermsEditing';

/**
 * Payment terms behind `More` on the phone (`SCR-M01-20`, the 375 frames): the settings page's bar
 * holds the title and the way back, the cards stand in one column, and a template opens in a full
 * sheet with the stage picker chained above it (`TermsEditing`). What is read, edited, saved and
 * acted on is `useTrancheTemplates`'s; this screen holds only which view of the cards is shown.
 */
export function PaymentTermsScreen() {
  const drillDown = useSettingsDrillDown('payment_terms');
  const { t, locale } = useI18n();
  const format = useFormat();
  const page = useTrancheTemplates(locale);
  const [archived, setArchived] = useState(false);
  const editor = page.editor;
  const leave = useLeaveAsk(editor?.changed ?? false);
  const words = paymentTermsWords(t);
  const context = termsContextOf(words, stageWords(t), locale, format);
  const shown = archived ? page.cards.archived : page.cards.inUse;
  return (
    <ShellPage inView="more" drillDown={drillDown}>
      <PaymentTermsList
        words={words}
        state={page.status}
        {...(page.standing === null
          ? {}
          : {
              savedLine: paymentTermsSavedLine(t, page.standing, {
                date: (epochMs) => format.date(new Date(epochMs)),
              }),
            })}
        teaching={page.seededOnly}
        archived={archived}
        archivedCount={page.cards.archived.length}
        cards={termsCardsOf(shown, editor?.draft.id ?? null, context)}
        columns={1}
        onOpen={page.open}
        onAdd={page.openNew}
        onToggleArchived={() => setArchived((was) => !was)}
        onRestore={(id) => page.act(id, 'restore')}
      />
      {editor === null ? null : (
        <TermsEditing
          page={page}
          editor={editor}
          words={words}
          context={context}
          letterhead={termsLetterheadOf(page.cover, page.brandColour, format.pack.taxIdLabel)}
          leave={leave}
        />
      )}
      <TermsActToast
        failure={page.actFailure === null ? null : paymentTermsFailureWords(t, page.actFailure)}
        onDismiss={page.dismissActFailure}
      />
    </ShellPage>
  );
}
