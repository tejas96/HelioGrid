import {
  type ProposalTemplateScreen as ProposalTemplate,
  useProposalTemplateScreen,
} from '@heliogrid/data/react';
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
import { useRef } from 'react';
import { View } from 'react-native';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { TemplateActBar } from './components/TemplateActBar';
import { TemplateOverlays } from './components/TemplateOverlays';
import { useTemplateActs } from './hooks/use-template-acts';

/**
 * The Proposal template behind `More` on the phone (`SCR-M01-19`, the 375 frames): the settings
 * page's bar holds the title and the way back, the shared page draws the stage and the editor, and
 * while a change is held the act bar stands in the nav's place (m19-n5). What it draws is
 * `useProposalTemplateScreen`'s, the web's too; the phone's own parts are the keyboard and the way
 * back.
 */
export function ProposalTemplateScreen() {
  const drillDown = useSettingsDrillDown('proposal_templates');
  const { t, locale } = useI18n();
  const screen = useProposalTemplateScreen(locale);
  const { page } = screen;
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
  return <TemplatePage screen={screen} drillDown={drillDown} />;
}

function TemplatePage({
  screen,
  drillDown,
}: {
  screen: ProposalTemplate;
  drillDown: ReturnType<typeof useSettingsDrillDown>;
}) {
  const { t } = useI18n();
  const format = useFormat();
  const acts = useTemplateActs(screen);
  const { page, view, overlays } = screen;
  /* A saved or discarded change takes the act bar away: the screen reader goes on to the page. */
  const body = useRef<View>(null);

  const words = proposalTemplateWords(t);
  const said = proposalTemplatePageWords(t, page, {
    date: (epochMs) => format.date(new Date(epochMs)),
  });
  const sectionWord = sectionWords(t, page.draft?.phases.length ?? 0);
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
  const act = screen.held ? (
    <TemplateActBar
      words={words}
      saving={page.saving}
      saveFailed={page.saveFailure !== null}
      onSave={acts.save}
      onDiscard={page.discard}
      focusAfter={body}
    />
  ) : undefined;

  return (
    <ShellPage inView="more" drillDown={drillDown} foot={act}>
      <View ref={body}>
        <ProposalTemplateSettings
          {...bodyProps({ screen, words, said, document, acts })}
          part={screen.part}
          onPart={screen.choosePart}
          {...templateSettingsParts(view, {
            languages: templateLanguages(),
            coverLanguage: screen.coverLanguage,
            termsLanguage: screen.termsLanguage,
            onCoverLanguage: screen.chooseCoverLanguage,
            onTermsLanguage: screen.chooseTermsLanguage,
            sectionWord,
            ...templateFieldRefusals(t, page.refusals),
            edit: page.edit,
            onEditPhase: overlays.editPhase,
            onDeletePhase: overlays.askDeletePhase,
            onAddPhase: overlays.addPhase,
          })}
          onOpenFullSize={overlays.openFullSize}
        />
      </View>
      <TemplateOverlays
        page={page}
        words={words}
        closeLabel={t(SHELL.close)}
        document={document}
        overlays={overlays}
        leave={screen.leave}
      />
    </ShellPage>
  );
}

/** The page body's props that follow from the page alone: its words, state and the two rows. */
function bodyProps({
  screen,
  words,
  said,
  document,
  acts,
}: {
  screen: ProposalTemplate;
  words: ReturnType<typeof proposalTemplateWords>;
  said: ReturnType<typeof proposalTemplatePageWords>;
  document: ReturnType<typeof templateDocumentOf>;
  acts: ReturnType<typeof useTemplateActs>;
}) {
  const { page } = screen;
  return {
    words,
    read: page.read,
    ...(said.standing === undefined ? {} : { standing: said.standing }),
    document,
    unsaved: page.changed.template,
    held: screen.held,
    teaching: page.teaching,
    onWriteOwn: (part: TemplatePartName) => page.edit({ kind: 'writeOwn', part }),
    bankLine: words.bankFrom(page.bankName),
    onOpenBranding: acts.openBranding,
    onOpenProfile: acts.openProfile,
    saveFailed: page.saveFailure !== null,
  };
}
