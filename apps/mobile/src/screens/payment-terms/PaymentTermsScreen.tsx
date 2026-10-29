import { usePaymentTermsScreen } from '@heliogrid/data/react';
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
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { TermsActToast } from './components/TermsActToast';
import { TermsEditing } from './components/TermsEditing';

/**
 * Payment terms behind `More` on the phone (`SCR-M01-20`, the 375 frames): the settings page's bar
 * holds the title and the way back, the cards stand in one column, and a template opens in a full
 * sheet with the stage picker chained above it (`TermsEditing`). What is read, edited, saved and
 * acted on, the cards in view, the stage picker and the two asks are `usePaymentTermsScreen`'s,
 * the web's too; the phone's own part is the way back and the system Back, held while a change is
 * and handed to the screen's leave ask.
 */
export function PaymentTermsScreen() {
  const drillDown = useSettingsDrillDown('payment_terms');
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = usePaymentTermsScreen(locale);
  const { page } = screen;
  const editor = page.editor;
  const navigation = useNavigation();
  usePreventRemove(editor?.changed ?? false, ({ data }) =>
    screen.askLeave(() => navigation.dispatch(data.action)),
  );
  const words = paymentTermsWords(t);
  const context = termsContextOf(words, stageWords(t), locale, format);
  /* A closed toast hands the screen reader back to the list the act was refused on. */
  const list = useRef<View>(null);
  return (
    <ShellPage inView="more" drillDown={drillDown}>
      <View ref={list}>
        <PaymentTermsList
          words={words}
          read={page.read}
          {...(page.standing === null
            ? {}
            : {
                savedLine: paymentTermsSavedLine(t, page.standing, {
                  date: (epochMs) => format.date(new Date(epochMs)),
                }),
              })}
          teaching={page.seededOnly}
          archived={screen.archived}
          archivedCount={page.cards.archived.length}
          cards={termsCardsOf(screen.cards, editor?.draft.id ?? null, context)}
          columns={1}
          onOpen={screen.openCard}
          onAdd={screen.add}
          onToggleArchived={screen.toggleArchived}
          onRestore={(id) => page.act(id, 'restore')}
        />
      </View>
      {editor === null ? null : (
        <TermsEditing
          screen={screen}
          editor={editor}
          words={words}
          context={context}
          letterhead={termsLetterheadOf(page.cover, page.brandColour, format.pack.taxIdLabel)}
        />
      )}
      <TermsActToast
        failure={page.actFailure === null ? null : paymentTermsFailureWords(t, page.actFailure)}
        onDismiss={page.dismissActFailure}
        focusAfter={list}
      />
    </ShellPage>
  );
}
