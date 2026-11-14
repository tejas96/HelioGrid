import { LeaveConfirm } from '../LeaveConfirm/LeaveConfirm';
import { ProposalPhaseSheet } from '../ProposalPartSheets/PhaseSheet';
import type { ProposalTemplateOverlaysProps } from './ProposalTemplateSettings.types';
import { TemplatePhaseDelete } from './TemplatePhaseDelete';

export function ProposalTemplateOverlays({
  overlays,
  phaseWords,
  words,
  leaveBody,
  closeLabel,
  leave,
}: ProposalTemplateOverlaysProps) {
  const open = overlays.phaseOpen;
  return (
    <>
      <ProposalPhaseSheet
        open={open !== null}
        onClose={overlays.closePhase}
        words={phaseWords}
        phase={open === null ? null : open.key === null ? EMPTY : open.phase}
        needsSentence
        onDone={({ name, description }) =>
          overlays.savePhase(open?.key ?? null, { name, description })
        }
      />
      <TemplatePhaseDelete
        phase={overlays.deleteAsked?.title ?? null}
        closeLabel={closeLabel}
        words={words}
        onKeep={overlays.closeDelete}
        onDelete={overlays.confirmDelete}
      />
      <LeaveConfirm
        open={leave.asking}
        title={words.leaveTitle}
        body={leaveBody}
        discard={words.leaveConfirm}
        keep={words.keepEditing}
        onKeep={leave.stay}
        onLeave={leave.leave}
      />
    </>
  );
}

/** A new phase: nothing typed yet, and — a template's step — no length to ask. */
const EMPTY = { name: '', description: '' } as const;
