'use client';
import { type PaymentTermsPage, useSession, useTrancheTemplates } from '@heliogrid/data/react';
import { opensSettingsRow } from '@heliogrid/domain';
import {
  type PaymentTermsWords,
  paymentTermsEditorSaid,
  paymentTermsFailureWords,
  paymentTermsSavedLine,
  paymentTermsWords,
  SHELL,
  stageWords,
  type Translator,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  brandingDocumentOf,
  LeaveConfirm,
  PaymentTermsEditorCard,
  PaymentTermsList,
  type TermsEditorView,
  ToastHost,
  termsCardsOf,
  termsContextOf,
  termsEditorViewOf,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { notFound } from 'next/navigation';
import { useState } from 'react';
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
 * What is read, edited and saved is `useTrancheTemplates`'s; this holds the web's own parts — where
 * the editor and its stage picker stand, the archive confirm, the leave ask and the act's toast.
 * Only a person whose presets open the row reaches it (`F7-48`).
 */
export function PaymentTermsScreen() {
  const { user } = useSession();
  if (!opensSettingsRow(user?.tenant?.roles ?? [], 'payment_terms')) notFound();
  return <PaymentTermsIn />;
}

function PaymentTermsIn() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const page = useTrancheTemplates(locale);
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= TERMS_WIDE_FROM;
  const [archived, setArchived] = useState(false);
  const [picking, setPicking] = useState<number | null>(null);
  const [archiveAsked, setArchiveAsked] = useState(false);
  const [leaveAsked, setLeaveAsked] = useState<(() => void) | null>(null);
  const editor = page.editor;
  const changed = editor?.changed ?? false;
  useLeaveGuard(changed, (leave) => setLeaveAsked(() => leave));

  const words = paymentTermsWords(t);
  const closeLabel = t(SHELL.close);
  const context = termsContextOf(words, stageWords(t), locale, format);

  // A held change asks first; `then` runs once the person chose to drop it, or at once.
  const leaveEditor = (then: () => void) => {
    if (changed) {
      setLeaveAsked(() => then);
      return;
    }
    setPicking(null);
    then();
  };
  const discardAndLeave = () => {
    const move = leaveAsked;
    setLeaveAsked(null);
    setPicking(null);
    page.close();
    move?.();
  };
  const openCard = (id: string) => {
    if (id !== editor?.draft.id) leaveEditor(() => page.open(id));
  };

  const view =
    editor === null
      ? null
      : termsEditorViewOf({
          editor,
          context,
          letterhead: letterheadOf(page, format.pack.taxIdLabel),
          said: paymentTermsEditorSaid(t, editor),
          picking,
          acting: page.acting === 'restore' ? null : page.acting,
          acts: {
            edit: page.edit,
            save: page.save,
            makeDefault: (id) => page.act(id, 'make-default'),
            pickStage: setPicking,
            askArchive: () => setArchiveAsked(true),
            cancel: () => leaveEditor(page.close),
          },
        });
  const archiveId = archiveAsked ? (editor?.draft.id ?? null) : null;

  return (
    <div className="hg-shell-page" ref={room}>
      <PaymentTermsList
        words={words}
        state={page.status}
        title={words.title}
        savedLine={savedLineOf(t, page, format.date)}
        teaching={page.seededOnly}
        archived={archived}
        archivedCount={page.cards.archived.length}
        cards={termsCardsOf(
          archived ? page.cards.archived : page.cards.inUse,
          editor?.draft.id ?? null,
          context,
        )}
        columns={wide ? 2 : 1}
        onOpen={openCard}
        onAdd={() => leaveEditor(page.openNew)}
        onToggleArchived={() => setArchived((was) => !was)}
        onRestore={(id) => page.act(id, 'restore')}
        {...asideOf(wide ? view : null, words, () => setPicking(null))}
      />
      <TermsEditorSheet
        view={wide ? null : view}
        words={words}
        closeLabel={closeLabel}
        onClose={() => leaveEditor(page.close)}
        onDonePicking={() => setPicking(null)}
      />
      <TermsArchiveConfirm
        name={archiveId === null ? null : (view?.title ?? '')}
        words={words}
        closeLabel={closeLabel}
        onKeep={() => setArchiveAsked(false)}
        onArchive={() => {
          setArchiveAsked(false);
          if (archiveId !== null) page.act(archiveId, 'archive');
        }}
      />
      <LeaveConfirm
        open={leaveAsked !== null}
        title={words.leaveTitle}
        body={words.leaveBody}
        discard={words.leaveConfirm}
        keep={words.keepEditing}
        onKeep={() => setLeaveAsked(null)}
        onLeave={discardAndLeave}
      />
      <ToastHost toasts={toastsOf(t, page)} onDismiss={page.dismissActFailure} />
    </div>
  );
}

/** The saved line, once the list is read: who saved and when, or that nothing changed since. */
function savedLineOf(
  t: ReturnType<typeof useI18n>['t'],
  page: PaymentTermsPage,
  date: (value: Date) => string,
): string | undefined {
  if (page.standing === null) return undefined;
  return paymentTermsSavedLine(t, page.standing, { date: (epochMs) => date(new Date(epochMs)) });
}

/** The preview's letterhead: the company's branding as Proposal template draws it, once it is read. */
function letterheadOf(page: PaymentTermsPage, taxIdLabel: string) {
  return page.cover === null
    ? null
    : { facts: brandingDocumentOf(page.cover, taxIdLabel), colour: page.brandColour };
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
