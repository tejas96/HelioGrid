import { type PhaseOpen, templateViewOf, useProposalTemplate } from '@heliogrid/data/react';
import type { UiLanguage } from '@heliogrid/domain';
import {
  proposalTemplatePageWords,
  proposalTemplateWords,
  SHELL,
  sectionWords,
  templateFieldRefusals,
  templateLanguages,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  Button,
  EmptyState,
  ProposalTemplateSettings,
  type TemplatePartName,
  templateDocumentOf,
  templateSettingsParts,
  useFormat,
} from '@heliogrid/ui';
import { useState } from 'react';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { useLeaveAsk } from '../shared/use-leave-ask';
import { ShellPage } from '../shell/components/ShellPage';
import { TemplateActBar } from './components/TemplateActBar';
import { TemplateOverlays } from './components/TemplateOverlays';
import { useTemplateActs } from './hooks/use-template-acts';

/**
 * The Proposal template behind `More` on the phone (`SCR-M01-19`, the 375 frames): the settings
 * page's bar holds the title and the way back, the shared page draws the stage and the editor, and
 * while a change is held the act bar stands in the nav's place (m19-n5). What is read, edited and
 * saved is `useProposalTemplate`'s; this screen holds which part, which language and which
 * overlay is open.
 */
export function ProposalTemplateScreen() {
  const drillDown = useSettingsDrillDown('proposal_templates');
  const { t } = useI18n();
  const page = useProposalTemplate();
  const words = proposalTemplateWords(t);
  if (page.read.kind === 'failed') {
    return (
      <ShellPage inView="more" drillDown={drillDown}>
        <EmptyState
          title={words.unread}
          action={
            <Button variant="primary" size="lg" onClick={page.read.retry}>
              {words.tryAgain}
            </Button>
          }
        />
      </ShellPage>
    );
  }
  return <TemplatePage page={page} drillDown={drillDown} />;
}

function TemplatePage({
  page,
  drillDown,
}: {
  page: ReturnType<typeof useProposalTemplate>;
  drillDown: ReturnType<typeof useSettingsDrillDown>;
}) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const acts = useTemplateActs(page);
  const [part, setPart] = useState<TemplatePartName>('cover');
  const [coverLanguage, setCoverLanguage] = useState<UiLanguage>('en');
  const [termsLanguage, setTermsLanguage] = useState<UiLanguage>('en');
  const [phaseOpen, setPhaseOpen] = useState<PhaseOpen | null>(null);
  const [deleteAsked, setDeleteAsked] = useState<{ key: number; title: string } | null>(null);
  const [fullSizeOpen, setFullSizeOpen] = useState(false);
  const changed = page.changed.template || page.changed.timeline;
  const leave = useLeaveAsk(changed);

  const words = proposalTemplateWords(t);
  const said = proposalTemplatePageWords(t, page, {
    date: (epochMs) => format.date(new Date(epochMs)),
  });
  const draft = page.draft;
  const languages = { cover: coverLanguage, terms: termsLanguage };
  const view = templateViewOf(draft, languages, locale);
  const sectionWord = sectionWords(t, draft?.phases.length ?? 0);
  const document = templateDocumentOf(
    view,
    {
      cover: page.cover,
      taxIdLabel: format.pack.taxIdLabel,
      colour: page.brandColour,
      docDate: format.date(new Date()),
    },
    sectionWord,
  );
  const act = changed ? (
    <TemplateActBar
      words={words}
      saving={page.saving}
      saveFailed={page.saveFailure !== null}
      onSave={() => {
        // A refused save opens the part whose field says why, so the reason is in view.
        if (page.refusedPart !== null) setPart(page.refusedPart);
        acts.save();
      }}
      onDiscard={page.discard}
    />
  ) : undefined;

  return (
    <ShellPage inView="more" drillDown={drillDown} foot={act}>
      <ProposalTemplateSettings
        {...bodyProps({ page, words, said, document, acts })}
        part={part}
        onPart={setPart}
        {...templateSettingsParts(view, {
          languages: templateLanguages(),
          coverLanguage,
          termsLanguage,
          onCoverLanguage: setCoverLanguage,
          onTermsLanguage: setTermsLanguage,
          sectionWord,
          ...templateFieldRefusals(t, page.refusals),
          edit: page.edit,
          onEditPhase: (key, phase) => setPhaseOpen({ key, phase }),
          onDeletePhase: (key, title) => setDeleteAsked({ key, title }),
          onAddPhase: () => setPhaseOpen({ key: null }),
        })}
        onOpenFullSize={() => setFullSizeOpen(true)}
      />
      <TemplateOverlays
        page={page}
        words={words}
        closeLabel={t(SHELL.close)}
        document={document}
        state={{
          phaseOpen,
          deleteAsked,
          fullSizeOpen,
          closePhase: () => setPhaseOpen(null),
          closeDelete: () => setDeleteAsked(null),
          closeFullSize: () => setFullSizeOpen(false),
        }}
        leave={{
          asking: leave.asking,
          stay: leave.stay,
          discardAndLeave: () => leave.leave(page.discard),
        }}
      />
    </ShellPage>
  );
}

type Page = ReturnType<typeof useProposalTemplate>;

/** The page body's props that follow from the page alone: its words, state and the two rows. */
function bodyProps({
  page,
  words,
  said,
  document,
  acts,
}: {
  page: Page;
  words: ReturnType<typeof proposalTemplateWords>;
  said: ReturnType<typeof proposalTemplatePageWords>;
  document: ReturnType<typeof templateDocumentOf>;
  acts: ReturnType<typeof useTemplateActs>;
}) {
  return {
    words,
    read: page.read,
    ...(said.standing === undefined ? {} : { standing: said.standing }),
    document,
    unsaved: page.changed.template,
    held: page.changed.template || page.changed.timeline,
    teaching: page.teaching,
    onWriteOwn: (part: TemplatePartName) => page.edit({ kind: 'writeOwn', part }),
    bankLine: words.bankFrom(page.bankName),
    onOpenBranding: acts.openBranding,
    onOpenProfile: acts.openProfile,
    saveFailed: page.saveFailure !== null,
  };
}
