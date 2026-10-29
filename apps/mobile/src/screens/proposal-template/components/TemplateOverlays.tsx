import type { TranslatedText } from '@heliogrid/contracts';
import {
  type LeaveAsk,
  type ProposalTemplatePage,
  type TemplateOverlayState,
  usePhaseEditor,
} from '@heliogrid/data/react';
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

/**
 * The page's overlays (`SCR-M01-19` m19-g, m19-h, m19-n7, m19-n10). Every act lands in the page's draft only — nothing
 * reaches the server before *Save template*.
 */
export function TemplateOverlays({
  page,
  words,
  closeLabel,
  document,
  overlays,
  leave,
}: {
  page: ProposalTemplatePage;
  words: ProposalTemplateWords;
  closeLabel: TranslatedText;
  document: TemplateDocument;
  overlays: TemplateOverlayState;
  leave: LeaveAsk;
}) {
  const { t, locale } = useI18n();
  const phases = page.draft?.phases ?? [];
  const open = overlays.phaseOpen;
  const editor = usePhaseEditor(open, overlays.savePhase);
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
        onClose={overlays.closePhase}
        onSave={editor.save}
      />
      <TemplateFullSize
        open={overlays.fullSizeOpen}
        words={words}
        closeLabel={closeLabel}
        document={document}
        onClose={overlays.closeFullSize}
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
        body={words.leaveBody}
        discard={words.leaveConfirm}
        keep={words.keepEditing}
        onKeep={leave.stay}
        onLeave={leave.leave}
      />
    </>
  );
}
