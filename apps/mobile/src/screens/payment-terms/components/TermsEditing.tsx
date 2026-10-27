import type { PaymentTermsEditor, PaymentTermsPage } from '@heliogrid/data/react';
import {
  type PaymentTermsWords,
  paymentTermsEditorSaid,
  SHELL,
  type Translator,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type PaymentTermsContext,
  type PaymentTermsLetterhead,
  type TermsEditorActs,
  termsEditorViewOf,
} from '@heliogrid/ui';
import { useState } from 'react';
import { Keyboard } from 'react-native';
import { TermsArchiveConfirm, TermsLeaveAsk } from './TermsAsks';
import { TermsEditorSheet } from './TermsEditorSheet';
import { TermsStageSheet } from './TermsStageSheet';

/** The page's way out held while a change is (`useLeaveAsk`): its ask and its two answers. */
export interface TermsLeave {
  readonly asking: boolean;
  stay(): void;
  leave(discard: () => void): void;
}

/**
 * The open editor's surfaces and asks on the phone (`SCR-M01-20` m20-c … m20-n9): the sheet, the
 * stage picker chained above it, *Archive {name}?* and *Leave without saving?*. Mounted only while
 * a template is open, so which picker or ask was open never outlives the editor.
 */
export function TermsEditing({
  page,
  editor,
  words,
  context,
  letterhead,
  leave,
}: {
  page: PaymentTermsPage;
  editor: PaymentTermsEditor;
  words: PaymentTermsWords;
  context: PaymentTermsContext;
  letterhead: PaymentTermsLetterhead;
  leave: TermsLeave;
}) {
  const { t } = useI18n();
  const [picking, setPicking] = useState<number | null>(null);
  const [archiveAsked, setArchiveAsked] = useState(false);
  const [closeAsked, setCloseAsked] = useState(false);
  const closeLabel = t(SHELL.close);
  const id = editor.draft.id;
  // The editor's ✕, *Cancel*, drag and the system Back ask first only when something changed.
  const close = () => (editor.changed ? setCloseAsked(true) : page.close());
  const view = editorViewOf(
    t,
    { page, editor, context, letterhead, picking },
    {
      edit: page.edit,
      // The keyboard closes on the act, so the refusal or the failed save's banner is in view.
      save: () => {
        Keyboard.dismiss();
        page.save();
      },
      makeDefault: (templateId) => page.act(templateId, 'make-default'),
      pickStage: setPicking,
      askArchive: () => setArchiveAsked(true),
      cancel: close,
    },
  );
  return (
    <>
      <TermsEditorSheet view={view} closeLabel={closeLabel} onClose={close} />
      <TermsStageSheet
        picker={view.picker}
        words={words}
        closeLabel={closeLabel}
        onClose={() => setPicking(null)}
      />
      <TermsArchiveConfirm
        name={archiveAsked && id !== null ? editor.draft.name.shown : null}
        words={words}
        closeLabel={closeLabel}
        onKeep={() => setArchiveAsked(false)}
        onArchive={() => {
          setArchiveAsked(false);
          if (id !== null) page.act(id, 'archive');
        }}
      />
      <TermsLeaveAsk
        open={closeAsked || leave.asking}
        words={words}
        onKeep={() => {
          setCloseAsked(false);
          leave.stay();
        }}
        onLeave={() => {
          setCloseAsked(false);
          if (leave.asking) leave.leave(page.close);
          else page.close();
        }}
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
