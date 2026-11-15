'use client';
import { useQuickAddScreen } from '@heliogrid/data/react';
import type { DealSegment } from '@heliogrid/domain';
import { proposalQuickAddWords, quickAddWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  EditorSurface,
  QuickAddForm,
  quickAddFormPropsOf,
  quickAddSurfaceOf,
  useFormat,
} from '@heliogrid/ui';
import { QuickAddDuplicateSheet } from './QuickAddDuplicateSheet';

/**
 * *New proposal*'s "Who is it for?" (`T-M06-001`, `M06-05`): the same capture as quick add, so every
 * proposal hangs on a lead. The number is asked first; one that is already a lead the person
 * reaches shows that lead and *Use {name}*, so no second lead is made. Closing it creates neither
 * a lead nor a proposal. A number on a lead out of the person's reach offers only the duplicate
 * sheet's own answers, and starts no proposal.
 */
export function QuickAddForProposal({
  onLeft,
  onLead,
  onOpenLead,
}: {
  /** The capture closed with no lead to go on with. */
  onLeft: () => void;
  /** The lead the proposal starts on — the one just saved, or the existing one picked. */
  onLead: (leadId: string, segment: DealSegment | null) => void;
  onOpenLead: (address: string) => void;
}) {
  const t = useTranslate();
  const format = useFormat();
  const screen = useQuickAddScreen({
    pack: format.pack,
    referredBy: null,
    ownedByCapturer: true,
    onClosed: onLeft,
    onOpenLead,
    onDone: (done) => {
      if (done.kind === 'saved') onLead(done.leadId, screen.draft.segment);
      else if (done.kind === 'enquiry_logged') onLead(done.leadId, null);
      else onLeft();
    },
  });
  const { check } = screen;
  const known = check.kind === 'known' && check.match.kind === 'visible' ? check.match : null;
  const base = quickAddWords(t, {
    check,
    phoneRefusal: screen.phoneRefusal,
    saveFailure: screen.saveFailure,
    referrer: null,
  });
  const own = proposalQuickAddWords(t, known?.name ?? null);
  const words = { ...base, title: own.title, form: { ...base.form, save: own.save } };
  return (
    <>
      <EditorSurface {...quickAddSurfaceOf(screen, words)}>
        <QuickAddForm
          {...quickAddFormPropsOf(screen, words)}
          saveNote={own.saveNote}
          knownLead={
            known === null ? null : { ...own.known, onUse: () => onLead(known.leadId, null) }
          }
        />
      </EditorSurface>
      <QuickAddDuplicateSheet screen={screen} />
    </>
  );
}
