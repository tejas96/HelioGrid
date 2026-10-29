import type {
  PaymentTermsEditor,
  PaymentTermsPage,
  PaymentTermsScreen,
} from '@heliogrid/data/react';
import {
  type PaymentTermsWords,
  paymentTermsEditorSaid,
  SHELL,
  type Translator,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  closeKeyboard,
  type PaymentTermsContext,
  type PaymentTermsLetterhead,
  type TermsEditorActs,
  termsEditorViewOf,
} from '@heliogrid/ui';
import { TermsArchiveConfirm, TermsLeaveAsk } from './TermsAsks';
import { TermsEditorSheet } from './TermsEditorSheet';
import { TermsStageSheet } from './TermsStageSheet';

/**
 * The open editor's surfaces and asks on the phone (`SCR-M01-20` m20-c … m20-n9): the sheet, the
 * stage picker chained above it, *Archive {name}?* and *Leave without saving?*. Mounted only while
 * a template is open; which picker or ask is open is `usePaymentTermsScreen`'s, and none outlives
 * its template.
 */
export function TermsEditing({
  screen,
  editor,
  words,
  context,
  letterhead,
}: {
  screen: PaymentTermsScreen;
  editor: PaymentTermsEditor;
  words: PaymentTermsWords;
  context: PaymentTermsContext;
  letterhead: PaymentTermsLetterhead;
}) {
  const { t } = useI18n();
  const { page } = screen;
  const closeLabel = t(SHELL.close);
  // The editor's ✕, *Cancel*, drag and the system Back ask first only when something changed.
  const view = editorViewOf(
    t,
    { page, editor, context, letterhead, picking: screen.picking },
    {
      edit: page.edit,
      // The keyboard closes on the act, so the refusal or the failed save's banner is in view.
      save: () => {
        closeKeyboard();
        page.save();
      },
      makeDefault: (templateId) => page.act(templateId, 'make-default'),
      pickStage: screen.pickStage,
      askArchive: screen.askArchive,
      cancel: screen.closeEditor,
    },
  );
  return (
    <>
      <TermsEditorSheet view={view} closeLabel={closeLabel} onClose={screen.closeEditor} />
      <TermsStageSheet
        picker={view.picker}
        words={words}
        closeLabel={closeLabel}
        onClose={screen.donePicking}
      />
      <TermsArchiveConfirm
        name={screen.archiveAsked ? editor.draft.name.shown : null}
        words={words}
        closeLabel={closeLabel}
        onKeep={screen.keepTemplate}
        onArchive={screen.archive}
      />
      {/* One ask for both ways out: the page's (held by the screen) and the editor's own (`closeEditor`). */}
      <TermsLeaveAsk
        open={screen.leaveAsked}
        words={words}
        onKeep={screen.keepEditing}
        onLeave={screen.discardAndLeave}
      />
    </>
  );
}

/** The editor's view, with the foot's words off the verdict and a conflict's words when the save met one. */
function editorViewOf(
  t: Translator['t'],
  open: {
    page: PaymentTermsPage;
    editor: PaymentTermsEditor;
    context: PaymentTermsContext;
    letterhead: PaymentTermsLetterhead;
    picking: number | null;
  },
  acts: TermsEditorActs,
) {
  const { page, editor } = open;
  return termsEditorViewOf({
    editor,
    context: open.context,
    letterhead: open.letterhead,
    said: paymentTermsEditorSaid(t, editor),
    picking: open.picking,
    acting: page.acting === 'restore' ? null : page.acting,
    acts,
  });
}
