import type { TranslatedText } from '@heliogrid/contracts';
import { type PhaseOpen, type ProposalTemplatePage, usePhaseEditor } from '@heliogrid/data/react';
import { type ProposalTemplateWords, phaseEditorWords, templateLanguages } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  LeaveConfirm,
  phaseEditorFieldsOf,
  type TemplateDocument,
  TemplatePhaseDelete,
  TemplatePhaseEditor,
} from '@heliogrid/ui';
import { TemplateFullSize } from './TemplateFullSize';

/** What the page opens over itself: a phase's editor, the full-size reader and the two asks. */
export interface TemplateOverlayState {
  readonly phaseOpen: PhaseOpen | null;
  readonly deleteAsked: { readonly key: number; readonly title: string } | null;
  readonly fullSizeOpen: boolean;
  closePhase(): void;
  closeDelete(): void;
  closeFullSize(): void;
}

/**
 * The page's overlays (`SCR-M01-19` m19-g, m19-h, m19-n7, m19-n10). Every act lands in the page's draft only — nothing
 * reaches the server before *Save template*.
 */
export function TemplateOverlays({
  page,
  words,
  closeLabel,
  document,
  state,
  leave,
}: {
  page: ProposalTemplatePage;
  words: ProposalTemplateWords;
  closeLabel: TranslatedText;
  document: TemplateDocument;
  state: TemplateOverlayState;
  leave: { asking: boolean; stay: () => void; discardAndLeave: () => void };
}) {
  const { t, locale } = useI18n();
  const phases = page.draft?.phases ?? [];
  const open = state.phaseOpen;
  const editor = usePhaseEditor(open, (key, edited) => {
    page.edit({ kind: 'phase', key, phase: edited });
    state.closePhase();
  });
  const said = phaseEditorWords(
    t,
    {
      adding: open?.key === null,
      name: editor.phase.name,
      position: phases.findIndex((phase) => phase.key === open?.key) + 1,
      count: phases.length,
      shown: editor.shown,
    },
    locale,
  );
  return (
    <>
      <TemplatePhaseEditor
        open={open !== null}
        title={said.title}
        subtitle={said.subtitle}
        closeLabel={closeLabel}
        words={{ ...words, act: said.act }}
        fields={phaseEditorFieldsOf(editor, templateLanguages(), said)}
        onClose={state.closePhase}
        onSave={editor.save}
      />
      <TemplateFullSize
        open={state.fullSizeOpen}
        words={words}
        closeLabel={closeLabel}
        document={document}
        onClose={state.closeFullSize}
      />
      <TemplatePhaseDelete
        phase={state.deleteAsked?.title ?? null}
        closeLabel={closeLabel}
        words={words}
        onKeep={state.closeDelete}
        onDelete={() => {
          if (state.deleteAsked !== null) page.edit({ kind: 'delete', key: state.deleteAsked.key });
          state.closeDelete();
        }}
      />
      <LeaveConfirm
        open={leave.asking}
        title={words.leaveTitle}
        body={words.leaveBody}
        discard={words.leaveConfirm}
        keep={words.keepEditing}
        onKeep={leave.stay}
        onLeave={leave.discardAndLeave}
      />
    </>
  );
}
