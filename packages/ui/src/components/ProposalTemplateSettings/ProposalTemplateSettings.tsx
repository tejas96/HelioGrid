import type { ProposalPage } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import { FieldCommitsProvider } from '../../primitives/FieldCommits';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner/Banner';
import { FailedRead } from '../EmptyState/FailedRead';
import { FormActionBar } from '../FormActionBar/FormActionBar';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { ProposalBuilder } from '../ProposalBuilder/ProposalBuilder';
import { ProposalPreviewSheet } from '../ProposalBuilder/ProposalPreviewSheet';
import { ScaledProposalPage } from '../ProposalPages/ProposalPages';
import { BankStep } from '../ProposalSteps/BankStep';
import { StepControls } from '../ProposalSteps/StepControls';
import { TermsStep } from '../ProposalSteps/TermsStep';
import { TrackRecordStep } from '../ProposalSteps/TrackRecordStep';
import { timelineControls } from '../ProposalSteps/timeline-controls';
import { DefaultsLook, DefaultsPages, DefaultsWall } from './DefaultsParts';
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
import '../ProposalSteps/ProposalSteps.css';
import '../ProposalSteps/StepKinds.css';
import '../ProposalSteps/StepRows.css';
import './ProposalTemplateSettings.css';

/** One page of the sample at a width; a page that is off is drawn as it would print. */
function SamplePage({
  sample,
  page,
  width,
}: {
  sample: DefaultsSample;
  page: ProposalPage;
  width: number;
}) {
  return <ScaledProposalPage {...sampleWith(sample, page)} page={page} width={width} />;
}

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
      return <BankStep view={{ ...props.bank, step: 'bank' }} wide={props.wide} shared={shared} />;
  }
}

/** The page the part feeds, or the wall of every page for *Pages*. */
function pageOrWall(
  props: ProposalTemplateSettingsProps,
  sample: DefaultsSample,
  widths: {
    readonly page: number;
    readonly cover: number;
    readonly wall: number;
    readonly wallColumns: number;
  },
): ReactNode {
  const page = defaultsPageOf(props.part);
  if (page === null)
    return (
      <DefaultsWall
        sample={sample}
        words={props.words}
        width={widths.wall}
        columns={widths.wallColumns}
      />
    );
  return (
    <SamplePage sample={sample} page={page} width={page === 'cover' ? widths.cover : widths.page} />
  );
}

/** The phone's peek of the page the part feeds; pressed, it opens the whole page. */
function Peek({ props, sample }: { props: ProposalTemplateSettingsProps; sample: DefaultsSample }) {
  const page = defaultsPageOf(props.part);
  if (page === null) return null;
  return (
    <Pressable
      className="hg-pdf-peek"
      accessibilityLabel={props.words.peek}
      onPress={() => props.onPreview(true)}
    >
      <span className="hg-pdf-peek-in hg-pdf-tile" key={page}>
        <SamplePage sample={sample} page={page} width={DEFAULTS_PAGE_WIDTH.peek} />
        <span className="hg-pdf-peek-tag">
          <ShellGlyph name="eye" size="sm" />
          {props.words.peek}
        </span>
      </span>
    </Pressable>
  );
}

/** *Save* and *Discard* while a change is held, with the failed save's banner over them. */
function HeldAct(props: ProposalTemplateSettingsProps) {
  const { act, words } = props;
  if (act === undefined) return null;
  return (
    <div className="hg-pdf-act">
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
    </div>
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
    <div className="hg-pdf-part" key={props.part}>
      {props.wide ? null : <Peek props={props} sample={sample} />}
      <Editor {...props} />
      <HeldAct {...props} />
    </div>
  );
}

/**
 * Proposal defaults (`SCR-M01-19`, `T-M01-030`): the builder's own frame over seven parts, the page
 * each feeds beside it, and the builder step's own controls as its editor.
 */
export function ProposalTemplateSettings(props: ProposalTemplateSettingsProps) {
  const { words, part, sample, wide } = props;
  const stage =
    !wide || sample === null
      ? undefined
      : {
          caption: words.stage,
          pageLine: stagePageLine(words, part, sample),
          page: pageOrWall(props, sample, {
            page: DEFAULTS_PAGE_WIDTH.stage,
            cover: DEFAULTS_PAGE_WIDTH.stageCover,
            wall: DEFAULTS_PAGE_WIDTH.wall,
            wallColumns: DEFAULTS_PAGE_WIDTH.wallColumns,
          }),
          pageKey: part,
          pages: 0,
          at: null,
        };
  return (
    <>
      <ProposalBuilder
        wide={wide}
        words={words.frame}
        steps={defaultsSteps(words)}
        current={part}
        title={words.title}
        status={props.standing}
        customerLine={props.standing}
        save={null}
        parts={{ trail: props.trail, note: words.note }}
        {...(stage === undefined ? {} : { stage })}
        onStep={(key) => props.onPart(defaultsPartOf(key))}
        onClose={props.onDone}
        onGenerate={props.onDone}
        onOpenSteps={props.onDone}
        {...(sample === null ? {} : { onPreview: () => props.onPreview(true) })}
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
        page={
          sample === null
            ? null
            : pageOrWall(props, sample, {
                page: DEFAULTS_PAGE_WIDTH.preview,
                cover: DEFAULTS_PAGE_WIDTH.preview,
                wall: DEFAULTS_PAGE_WIDTH.wallPhone,
                wallColumns: DEFAULTS_PAGE_WIDTH.wallColumnsPhone,
              })
        }
      />
    </>
  );
}
