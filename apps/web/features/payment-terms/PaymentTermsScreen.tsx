'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import {
  type PaymentTermsPage,
  type PaymentTermsScreen as PaymentTermsScreenView,
  usePaymentTermsScreen,
} from '@heliogrid/data/react';
import {
  type PaymentTermsWords,
  paymentTermsEditorSaid,
  paymentTermsFailureWords,
  paymentTermsSavedLine,
  paymentTermsWords,
  SHELL,
  stageWords,
  type Translator,
  toastHostWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  LeaveConfirm,
  PaymentTermsEditorCard,
  PaymentTermsList,
  type TermsEditorView,
  ToastHost,
  termsCardsOf,
  termsContextOf,
  termsEditorViewOf,
  termsLetterheadOf,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { notFound } from 'next/navigation';
import { useLeaveGuard } from '../../lib/leave-guard';
import { TermsArchiveConfirm } from './components/TermsArchiveConfirm';
import { TermsEditorSheet } from './components/TermsEditorSheet';

/** The editor card at width (`SCR-M01-20` m20-g): 440 wide, beside the cards. */
const EDITOR_CARD_WIDTH = 440;

/**
 * The room from which the page stands as the board's 1536 pair: the cards' column at least as wide
 * as the editor card, the `--sp-8` gap, then the card. Below it the cards would stand too narrow
 * for their split, so the page is the 375 column and the editor a sheet.
 */
const TERMS_WIDE_FROM = EDITOR_CARD_WIDTH * 2 + theme.spacing['sp-8'];

/**
 * Payment terms behind `More` on the web (`SCR-M01-20`, `M01-54`): each template as a card that
 * shows its split, and the one being edited — a sheet below width, a card beside the cards at it.
 * What is read, edited and saved, the cards in view, the stage picker and the two asks are
 * `usePaymentTermsScreen`'s, the phone's too; this holds the web's own parts — where the editor and
 * its stage picker stand, the in-app moves the leave ask holds, and the act's toast. Only a person
 * whose presets open the row reaches it (`F7-48`).
 */
export function PaymentTermsScreen() {
  const { locale } = useI18n();
  const screen = usePaymentTermsScreen(locale);
  if (!screen.allowed) notFound();
  return <PaymentTermsIn screen={screen} />;
}

function PaymentTermsIn({ screen }: { screen: PaymentTermsScreenView }) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const { page } = screen;
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= TERMS_WIDE_FROM;
  const editor = page.editor;
  useLeaveGuard(editor?.changed ?? false, screen.askLeave);

  const words = paymentTermsWords(t);
  const closeLabel = t(SHELL.close);
  const context = termsContextOf(words, stageWords(t), locale, format);

  const view =
    editor === null
      ? null
      : termsEditorViewOf({
          editor,
          context,
          letterhead: termsLetterheadOf(page.cover, page.brandColour, format.pack.taxIdLabel),
          said: paymentTermsEditorSaid(t, editor),
          picking: screen.picking,
          acting: page.acting === 'restore' ? null : page.acting,
          acts: {
            edit: page.edit,
            save: page.save,
            makeDefault: (id) => page.act(id, 'make-default'),
            pickStage: screen.pickStage,
            askArchive: screen.askArchive,
            cancel: screen.closeEditor,
          },
        });

  return (
    /* A closed toast hands the keyboard back to the page it spoke about. */
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target">
      <PaymentTermsList
        words={words}
        read={page.read}
        title={words.title}
        savedLine={savedLineOf(t, page, format.date)}
        teaching={page.seededOnly}
        archived={screen.archived}
        archivedCount={page.cards.archived.length}
        cards={termsCardsOf(screen.cards, editor?.draft.id ?? null, context)}
        columns={wide ? 2 : 1}
        onOpen={screen.openCard}
        onAdd={screen.add}
        onToggleArchived={screen.toggleArchived}
        onRestore={(id) => page.act(id, 'restore')}
        {...asideOf(wide ? view : null, words, screen.donePicking)}
      />
      <TermsEditorSheet
        view={wide ? null : view}
        words={words}
        closeLabel={closeLabel}
        onClose={screen.closeEditor}
        onDonePicking={screen.donePicking}
      />
      <TermsArchiveConfirm
        name={screen.archiveAsked ? (view?.title ?? '') : null}
        words={words}
        closeLabel={closeLabel}
        onKeep={screen.keepTemplate}
        onArchive={screen.archive}
      />
      <LeaveConfirm
        open={screen.leaveAsked}
        title={words.leaveTitle}
        body={words.leaveBody}
        discard={words.leaveConfirm}
        keep={words.keepEditing}
        onKeep={screen.keepEditing}
        onLeave={screen.discardAndLeave}
      />
      <ToastHost
        toasts={toastsOf(t, page)}
        onDismiss={page.dismissActFailure}
        {...toastHostWords(t)}
        focusAfter={room}
      />
    </div>
  );
}

/** The saved line, once the list is read: who saved and when, or that nothing changed since. */
function savedLineOf(
  t: ReturnType<typeof useI18n>['t'],
  page: PaymentTermsPage,
  date: (value: Date) => string,
): TranslatedText | undefined {
  if (page.standing === null) return undefined;
  return paymentTermsSavedLine(t, page.standing, { date: (epochMs) => date(new Date(epochMs)) });
}

/** At width the editor stands beside the cards, as the list's `aside`; below it, a sheet. */
function asideOf(
  view: TermsEditorView | null,
  words: PaymentTermsWords,
  onDonePicking: () => void,
) {
  return view === null
    ? {}
    : { aside: <PaymentTermsEditorCard view={view} words={words} onDonePicking={onDonePicking} /> };
}

/** A refused act's toast, in the api's words; nothing else on the page changes. */
function toastsOf(t: Translator['t'], page: PaymentTermsPage) {
  return page.actFailure === null
    ? []
    : [
        {
          id: 'act-refused',
          tone: 'danger' as const,
          title: paymentTermsFailureWords(t, page.actFailure),
        },
      ];
}
