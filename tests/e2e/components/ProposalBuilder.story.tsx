import {
  PROPOSAL_STEPS,
  type ProposalStep,
  QUICK_STEPS,
  type Read,
  STEP_PAGE,
} from '@heliogrid/domain';
import {
  createTranslator,
  proposalBuilderWords,
  proposalStepListWords,
  proposalStepWords,
  provenanceWords,
} from '@heliogrid/i18n';
import {
  type FocusHandle,
  ProposalBuilder,
  ProposalPreviewSheet,
  ProposalStep as ProposalStepBody,
  ProposalStepList,
  type ProposalStepView,
  ProvenanceWordsProvider,
  ScaledProposalPage,
} from '@heliogrid/ui';
import { useRef, useState } from 'react';
import {
  type BuilderCase,
  builderSteps,
  FIRST_NAME,
  stepView,
} from '../support/proposal-builder-sample';
import { CUSTOMER, DATE_TEXT, SNAPSHOT } from '../support/proposal-document-sample';
import { pageWordsOf } from '../support/proposal-document-words';
import { BuilderSheets, type StorySheet } from './ProposalBuilderSheets.story';

const READERS = { en: await createTranslator('en'), hi: await createTranslator('hi') };

export type StoryRead = 'ready' | 'loading' | 'failed';
export type StorySave = 'saved' | 'unsaved' | 'offline' | 'conflict';

export interface BuilderStoryProps {
  step?: ProposalStep;
  wide?: boolean;
  kase?: BuilderCase;
  quick?: boolean;
  read?: StoryRead;
  save?: StorySave;
  moved?: boolean;
  sheet?: StorySheet;
  lang?: keyof typeof READERS;
  /** A long title on the step in view, as a Marathi one runs. */
  longTitle?: string;
}

const SAVE = {
  saved: { kind: 'saved' },
  unsaved: { kind: 'unsaved', count: 1 },
  offline: { kind: 'offline' },
  conflict: { kind: 'conflict' },
} as const;

function readOf(
  read: StoryRead,
  view: ProposalStepView,
  retry: () => void,
): Read<ProposalStepView> {
  if (read === 'loading') return { kind: 'loading' };
  if (read === 'failed') return { kind: 'failed', failure: 'no_connection', retry };
  return { kind: 'ready', value: view };
}

/** The builder over the sample deal: the frame, the step in view, and the sheets it opens. */
export function BuilderStory({
  step: first = 'system',
  wide = false,
  kase = 'drawn',
  quick: quickFirst = false,
  read = 'ready',
  save = 'saved',
  moved = false,
  sheet: sheetFirst = null,
  lang = 'en',
  longTitle,
}: BuilderStoryProps) {
  const { t } = READERS[lang];
  const [step, setStep] = useState<ProposalStep>(first);
  const [quick, setQuick] = useState(quickFirst);
  const [sheet, setSheet] = useState<StorySheet>(sheetFirst);
  const [log, setLog] = useState('');
  const title = useRef<FocusHandle | null>(null);
  const words = proposalBuilderWords(t, { name: FIRST_NAME, fullName: CUSTOMER });
  const shared = proposalStepWords(t);
  const every = builderSteps(t, quick).map((item) =>
    longTitle !== undefined && item.key === step
      ? { ...item, title: longTitle as typeof item.title }
      : item,
  );
  const presented = every.filter((item) => item.quiet !== true);
  const pageWords = pageWordsOf(t, SNAPSHOT, true);
  const page = STEP_PAGE[step];
  const at = SNAPSHOT.pages.indexOf(page);
  const pageLine = words.pageLine(
    at < 0 ? null : at + 1,
    SNAPSHOT.pages.length,
    pageWords.titles[page],
  );
  const paper = (width: number) => (
    <ScaledProposalPage
      page={page}
      width={width}
      snapshot={SNAPSHOT}
      facts={{ dateText: DATE_TEXT, generationTier: 'estimated' }}
      words={pageWords}
      still
    />
  );
  const view = stepView(t, step, kase, {
    onPick: () => setSheet('picker'),
    onEditPhase: () => setSheet('phase'),
  });
  const withPeek: ProposalStepView =
    view.step === 'company' && !wide
      ? { ...view, peek: { page: paper(310), onOpen: () => setSheet('preview') } }
      : view;
  const stepRead = readOf(read, withPeek, () => setLog('retried'));
  const go = (key: string) => {
    const next = PROPOSAL_STEPS.find((candidate) => candidate === key);
    if (next === undefined) return;
    if (quick && !QUICK_STEPS.includes(next)) setQuick(false);
    setStep(next);
    setSheet(null);
  };
  return (
    <ProvenanceWordsProvider value={provenanceWords(t)}>
      <div data-testid="frame" style={{ height: wide ? 900 : 844, position: 'relative' }}>
        <ProposalBuilder
          wide={wide}
          words={words}
          steps={presented}
          current={step}
          title={words.title}
          status={words.status}
          customerLine={`${CUSTOMER} · Pune` as typeof words.title}
          save={read === 'ready' ? SAVE[save] : null}
          quick={{ on: quick, onChange: setQuick }}
          payable={{ label: words.pays, text: '₹1,90,575' }}
          toFix={2}
          {...(wide
            ? {
                stage: {
                  caption: words.whatSees,
                  pageLine,
                  page: paper(page === 'cover' ? 468 : 600),
                  pageKey: page,
                  pages: SNAPSHOT.pages.length,
                  at: at < 0 ? null : at,
                },
              }
            : {})}
          titleRef={title}
          onStep={go}
          onClose={() => setLog('closed')}
          onGenerate={() => setSheet('check')}
          onOpenSteps={() => setSheet('steps')}
          onPreview={() => setSheet('preview')}
        >
          <ProposalStepBody
            wide={wide}
            words={shared}
            read={stepRead}
            focusAfter={title}
            {...(moved ? { moved: shared.moved('Priya Kulkarni') } : {})}
          />
        </ProposalBuilder>
      </div>
      <output data-testid="log">{log}</output>
      <ProposalStepList
        open={sheet === 'steps'}
        onClose={() => setSheet(null)}
        words={proposalStepListWords(t, { quick })}
        steps={every}
        current={step}
        onStep={go}
        quick={{ on: quick, onChange: setQuick }}
        onGenerate={() => setSheet('check')}
      />
      <ProposalPreviewSheet
        open={sheet === 'preview'}
        onClose={() => setSheet(null)}
        closeLabel={proposalStepListWords(t, { quick }).closeLabel}
        title={words.whatSees}
        page={paper(326)}
        pageLine={pageLine}
      />
      <BuilderSheets
        t={t}
        sheet={sheet}
        onSheet={setSheet}
        kase={kase}
        quick={quick}
        onLog={setLog}
      />
    </ProvenanceWordsProvider>
  );
}
