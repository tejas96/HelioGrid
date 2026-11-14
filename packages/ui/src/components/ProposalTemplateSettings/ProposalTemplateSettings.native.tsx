import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import { FieldCommitsProvider } from '../../primitives/FieldCommits';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { FormActionBar } from '../FormActionBar/FormActionBar.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { ProposalBuilder } from '../ProposalBuilder/ProposalBuilder.native';
import { ProposalPreviewSheet } from '../ProposalBuilder/ProposalPreviewSheet.native';
import { ScaledProposalPage } from '../ProposalPages/ProposalPages.native';
import { BankStep } from '../ProposalSteps/BankStep.native';
import { StepControls } from '../ProposalSteps/StepControls.native';
import { stepLayout } from '../ProposalSteps/StepParts.native';
import { TermsStep } from '../ProposalSteps/TermsStep.native';
import { TrackRecordStep } from '../ProposalSteps/TrackRecordStep.native';
import { timelineControls } from '../ProposalSteps/timeline-controls';
import { DefaultsLook, DefaultsPages, DefaultsWall } from './DefaultsParts.native';
import {
  DEFAULTS_PAGE_WIDTH,
  defaultsPageOf,
  defaultsPartOf,
  defaultsPaymentControls,
  defaultsSteps,
  sampleWith,
  stagePageLine,
} from './ProposalTemplateSettings.logic';
import type {
  DefaultsSample,
  ProposalTemplateSettingsProps,
} from './ProposalTemplateSettings.types';

/** The part in view: the builder step's own controls, over the company's defaults. */
function Editor(props: ProposalTemplateSettingsProps) {
  const { part, shared, words } = props;
  switch (part) {
    case 'look':
      return <DefaultsLook view={props.look} words={words} />;
    case 'record':
      return <TrackRecordStep view={{ ...props.record, step: 'achievements' }} shared={shared} />;
    case 'pages':
      return <DefaultsPages view={props.pages} sample={props.sample} words={words} />;
    case 'timeline':
      return (
        <StepControls
          column
          controls={timelineControls({ ...props.timeline, step: 'timeline' })}
          shared={shared}
          focusAfter={props.focusAfter}
        />
      );
    case 'payment':
      return (
        <StepControls
          column
          controls={defaultsPaymentControls(props.payment, shared)}
          shared={shared}
          focusAfter={props.focusAfter}
        />
      );
    case 'terms':
      return <TermsStep view={{ ...props.terms, step: 'terms' }} shared={shared} />;
    case 'bank':
      return <BankStep view={{ ...props.bank, step: 'bank' }} wide={false} shared={shared} />;
  }
}

/** The page the part feeds, or the wall of every page for *Pages*. */
function pageOrWall(props: ProposalTemplateSettingsProps, sample: DefaultsSample): ReactNode {
  const page = defaultsPageOf(props.part);
  if (page === null) {
    return (
      <DefaultsWall sample={sample} words={props.words} width={DEFAULTS_PAGE_WIDTH.wallPhone} />
    );
  }
  return (
    <ScaledProposalPage
      {...sampleWith(sample, page)}
      page={page}
      width={DEFAULTS_PAGE_WIDTH.preview}
    />
  );
}

/** The peek of the page the part feeds; pressed, it opens the whole page. */
function Peek({ props, sample }: { props: ProposalTemplateSettingsProps; sample: DefaultsSample }) {
  const page = defaultsPageOf(props.part);
  if (page === null) return null;
  return (
    <Pressable
      style={styles.peek}
      accessibilityLabel={props.words.peek}
      onPress={() => props.onPreview(true)}
    >
      <ScaledProposalPage
        {...sampleWith(sample, page)}
        page={page}
        width={DEFAULTS_PAGE_WIDTH.peek}
        still
      />
      <View style={styles.peekTag}>
        <ShellGlyph name="eye" size="sm" />
        <Text variant="caption" bold>
          {props.words.peek}
        </Text>
      </View>
    </Pressable>
  );
}

/** *Save* and *Discard* while a change is held, with the failed save's banner over them. */
function HeldAct(props: ProposalTemplateSettingsProps) {
  const { act, words } = props;
  if (act === undefined) return null;
  return (
    <View style={stepLayout.column}>
      {props.refusal === undefined ? null : (
        <Banner kind="validation" density="functional" title={props.refusal} />
      )}
      {props.saveFailed ? (
        <Banner kind="validation" density="functional" title={words.saveFailed}>
          {words.saveFailedBody}
        </Banner>
      ) : null}
      <FormActionBar
        placement="footer"
        consequence={words.consequence}
        saveLabel={words.save}
        discardLabel={words.discard}
        saving={act.saving}
        onSave={act.onSave}
        onDiscard={act.onDiscard}
        focusAfter={props.focusAfter}
      />
    </View>
  );
}

function Body(props: ProposalTemplateSettingsProps) {
  const { read, words, sample } = props;
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.unread}
        message={words.unreadLine}
        retryLabel={words.tryAgain}
        onRetry={read.retry}
        focusAfter={props.focusAfter}
      />
    );
  }
  if (read.kind !== 'ready' || sample === null) {
    return <LoadingBars label={words.loading} bars={['panel', 'row', 'row']} />;
  }
  return (
    <View style={stepLayout.column}>
      <Peek props={props} sample={sample} />
      <Editor {...props} />
      <HeldAct {...props} />
    </View>
  );
}

/**
 * Proposal defaults on the phone (`SCR-M01-19`, `T-M01-030`): the builder's own frame over seven
 * parts — back, the page's name, the eye; the parts as one row; the part's title with what is in
 * force; a peek of the page it feeds; the builder step's own controls; and the dock.
 */
export function ProposalTemplateSettings(props: ProposalTemplateSettingsProps) {
  const { words, part, sample } = props;
  return (
    <>
      <ProposalBuilder
        wide={false}
        words={words.frame}
        steps={defaultsSteps(words)}
        current={part}
        title={words.title}
        status={props.standing}
        customerLine={props.standing}
        save={null}
        parts={{ trail: props.trail, note: words.note }}
        onStep={(key) => props.onPart(defaultsPartOf(key))}
        onClose={props.onDone}
        onGenerate={props.onDone}
        onOpenSteps={props.onDone}
        {...(sample === null ? {} : { onPreview: () => props.onPreview(true) })}
        {...(props.safe === undefined ? {} : { safe: props.safe })}
        {...(props.titleRef === undefined ? {} : { titleRef: props.titleRef })}
      >
        {/* One *Save* sends the page: every field hands its edit up as typed. */}
        <FieldCommitsProvider value="as-typed">
          <Body {...props} />
        </FieldCommitsProvider>
      </ProposalBuilder>
      <ProposalPreviewSheet
        open={props.previewOpen && sample !== null}
        onClose={() => props.onPreview(false)}
        closeLabel={words.closeLabel}
        title={words.peek}
        pageLine={sample === null ? words.peek : stagePageLine(words, part, sample)}
        page={sample === null ? null : pageOrWall(props, sample)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  peek: {
    height: 236,
    paddingTop: theme.spacing['sp-3'],
    alignItems: 'center',
    /* The page shows from its top, as the builder's peek does; `Pressable` centres what it holds. */
    justifyContent: 'flex-start',
    overflow: 'hidden',
    borderRadius: theme.radius['r-lg'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    backgroundColor: colors['canvas-sunken'],
  },
  peekTag: {
    position: 'absolute',
    bottom: theme.spacing['sp-3'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    // biome-ignore lint/plugin/raw-white: a tag lying over the picture it names — the card colour, as a tile is
    backgroundColor: colors.surface,
  },
});
