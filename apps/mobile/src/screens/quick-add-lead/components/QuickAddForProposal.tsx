import { useQuickAddScreen } from '@heliogrid/data/react';
import type { DealSegment } from '@heliogrid/domain';
import { formLeaveWords, proposalQuickAddWords, quickAddWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  EditorSurface,
  LeaveConfirm,
  QuickAddForm,
  quickAddFormPropsOf,
  quickAddLeaveOf,
  quickAddSurfaceOf,
  useFormat,
} from '@heliogrid/ui';
import { openInside } from '../../shared/open-inside';
import { QuickAddDuplicateSheet } from './QuickAddDuplicateSheet';

/**
 * *New proposal*'s "Who is it for?" on the phone (`T-M06-001`, `M06-05`): the capture quick add
 * uses, as a sheet over the proposals list, so every proposal hangs on a lead. The number comes
 * first; one that is already a lead the person reaches shows that lead and *Use {name}*, and no
 * second lead is made. Closing it makes neither a lead nor a proposal; a number on a lead out of
 * the person's reach offers only the duplicate sheet's own answers.
 */
export function QuickAddForProposal({
  onLeft,
  onLead,
}: {
  /** The capture closed with no lead to go on with. */
  onLeft: () => void;
  /** The lead the proposal starts on — the one just saved, or the existing one picked. */
  onLead: (leadId: string, segment: DealSegment | null) => void;
}) {
  const t = useTranslate();
  const format = useFormat();
  const screen = useQuickAddScreen({
    pack: format.pack,
    referredBy: null,
    ownedByCapturer: true,
    onClosed: onLeft,
    onOpenLead: openInside,
    onDone: (done) => {
      if (done.kind === 'saved') onLead(done.leadId, screen.draft.segment);
      else if (done.kind === 'enquiry_logged') onLead(done.leadId, null);
      else onLeft();
    },
  });
  const match = screen.check.kind === 'known' ? screen.check.match : null;
  const known = match !== null && match.kind === 'visible' ? match : null;
  const own = proposalQuickAddWords(t, known?.name ?? null);
  const shared = quickAddWords(t, {
    check: screen.check,
    phoneRefusal: screen.phoneRefusal,
    saveFailure: screen.saveFailure,
    referrer: null,
  });
  const words = { ...shared, title: own.title, form: { ...shared.form, save: own.save } };
  const useKnown =
    known === null ? null : { ...own.known, onUse: () => onLead(known.leadId, null) };
  return (
    <>
      <EditorSurface {...quickAddSurfaceOf(screen, words)}>
        <QuickAddForm
          {...quickAddFormPropsOf(screen, words)}
          saveNote={own.saveNote}
          knownLead={useKnown}
        />
      </EditorSurface>
      <LeaveConfirm {...quickAddLeaveOf(screen, formLeaveWords(t))} />
      <QuickAddDuplicateSheet screen={screen} />
    </>
  );
}
