import { proposalSheetsOf, sheetNumber } from '@heliogrid/domain';
import { proposalCheckStateOf } from '../ProposalCheck/ProposalCheck.logic';
import type { ProposalCheckSheetProps } from '../ProposalCheck/ProposalCheck.types';
import { partPickerOptionsOf } from '../ProposalPartSheets/ProposalPartSheets.logic';
import type {
  ProposalPartAddProps,
  ProposalPartEditProps,
  ProposalPartPickerProps,
  ProposalPaymentPartSheetProps,
  ProposalPhaseSheetProps,
} from '../ProposalPartSheets/ProposalPartSheets.types';
import type { ProposalReadyProps } from '../ProposalReady/ProposalReady.types';
import type { ProposalStepProps } from '../ProposalSteps/ProposalSteps.types';
import { proposalStepViewOf } from '../ProposalSteps/step-view';
import type { ProposalStepModel } from '../ProposalSteps/step-view.types';
import { type BuilderDrawn, builderDrawnOf } from './builder-drawn';
import { BUILDER_PAGE_WIDTH, builderStagePageWidth } from './ProposalBuilder.logic';
import type {
  ProposalBuilderProps,
  ProposalPreviewSheetProps,
  ProposalStepListProps,
} from './ProposalBuilder.types';
import type { ProposalBuilderViewProps } from './ProposalBuilderView.types';

/** Every part the builder draws, its props joined ONCE for both halves; each half only renders them. */
export interface BuilderViewParts {
  /** The screen after Generate, in the builder's place; `null` before a version is made. */
  readonly ready: ProposalReadyProps | null;
  readonly frame: Omit<ProposalBuilderProps, 'children'>;
  readonly step: ProposalStepProps;
  readonly sheets: BuilderSheetsParts;
}

export interface BuilderSheetsParts {
  readonly list: ProposalStepListProps;
  readonly preview: ProposalPreviewSheetProps;
  readonly picker: ProposalPartPickerProps;
  readonly edit: ProposalPartEditProps;
  /** The small sheet for a cable, electrical or structure part; `null` where the catalog's own form opens. */
  readonly add: ProposalPartAddProps | null;
  readonly phase: ProposalPhaseSheetProps;
  readonly payment: ProposalPaymentPartSheetProps;
  readonly check: ProposalCheckSheetProps;
}

export function builderViewPartsOf<Step extends ProposalStepModel>(
  props: ProposalBuilderViewProps<Step>,
  areas: Parameters<typeof builderDrawnOf>[0]['areas'],
): BuilderViewParts {
  const { screen, said, wide, room } = props;
  const { frame, step } = props.ready;
  const drawn = builderDrawnOf({
    frame,
    facts: screen.pageFacts,
    bank: screen.detail?.document.company.bankDetails ?? null,
    said,
    areas,
  });
  const { words } = said;
  const quick = { on: frame.quick, onChange: screen.toggleQuick };
  /* A page is drawn as wide as the design draws it, or as the room allows. */
  const peek =
    step.step === 'company' && !wide
      ? {
          page: drawn.paper('cover', Math.min(BUILDER_PAGE_WIDTH.peek, room)),
          onOpen: screen.openPreview,
        }
      : undefined;
  const estimate = step.step === 'terms' ? drawn.termsEstimate(step.terms) : undefined;
  const view = proposalStepViewOf(step, said.saidOf(step, estimate), drawn.partsOf(peek));
  const { moved } = screen;
  return {
    ready: readyOf(props, drawn),
    frame: {
      wide,
      words,
      steps: drawn.steps,
      current: frame.current,
      title: words.title,
      status: words.status,
      customerLine: said.screenWords.customerLine,
      save: frame.save,
      quick,
      ...(said.payable === null ? {} : { payable: said.payable }),
      toFix: frame.toFix,
      ...(wide
        ? {
            stage: {
              caption: words.whatSees,
              pageLine: said.pageLine,
              page: drawn.paper(frame.page, builderStagePageWidth(room, frame.page === 'cover')),
              waits: words.pageWaits,
              pageKey: frame.page,
              ...stageSheetsOf(frame),
            },
          }
        : {}),
      ...(props.safe === undefined ? {} : { safe: props.safe }),
      titleRef: props.titleRef,
      onStep: screen.goStepByKey,
      onClose: screen.close,
      onGenerate: screen.openCheck,
      onOpenSteps: screen.openSteps,
      onPreview: screen.openPreview,
    },
    step: {
      wide,
      words: said.shared,
      read: view === null ? { kind: 'loading' } : { kind: 'ready', value: view },
      focusAfter: props.titleRef,
      marks: said.marks,
      ...(frame.recomputing ? { updating: words.updating } : {}),
      ...(moved === null
        ? {}
        : {
            moved: {
              ...said.shared.moved(moved.to?.name ?? ''),
              act: { label: said.screenWords.reload, onPress: moved.reload },
            },
          }),
    },
    sheets: sheetsOf(props, drawn),
  };
}

/** The stage's dots: one per sheet that prints (`proposalSheetsOf`), as every "N pages" line counts. */
function stageSheetsOf(frame: ProposalBuilderViewProps['ready']['frame']): {
  readonly pages: number;
  readonly at: number | null;
} {
  const sheets = proposalSheetsOf(frame.pages, frame.fieldSet);
  const at = sheetNumber(sheets, frame.page, 0);
  return { pages: sheets.length, at: frame.pageAt === null || at === 0 ? null : at - 1 };
}

function readyOf(props: ProposalBuilderViewProps, drawn: BuilderDrawn): ProposalReadyProps | null {
  const { screen, said, wide } = props;
  const ready = screen.ready;
  if (ready === null || said.ready === null) return null;
  const { file } = ready.pdf;
  return {
    wide,
    words: said.ready,
    cover: drawn.paper('cover', wide ? BUILDER_PAGE_WIDTH.ready : BUILDER_PAGE_WIDTH.readyPhone),
    onShare: ready.share,
    onDownload: () => ready.pdf.get(props.onOpenFile),
    downloading: file.kind === 'making',
    onBack: ready.back,
    ...(props.safe === undefined ? {} : { safe: props.safe }),
  };
}

/**
 * The page the step feeds, in the sheet the bar's eye opens. Before a price only the cover can be
 * drawn, so the eye shows it on every step (`M06-51`).
 */
function previewOf(
  props: ProposalBuilderViewProps,
  drawn: BuilderDrawn,
): ProposalPreviewSheetProps {
  const { screen, said } = props;
  const width = Math.min(BUILDER_PAGE_WIDTH.preview, props.room);
  const stepPage = drawn.paper(props.ready.frame.page, width);
  const page = stepPage ?? drawn.paper('cover', width);
  return {
    open: screen.previewOpen && page !== null,
    onClose: screen.closePreview,
    closeLabel: said.list.closeLabel,
    title: said.words.whatSees,
    page,
    pageLine: stepPage === null ? said.coverLine : (said.pageLine ?? said.words.whatSees),
  };
}

/** Why an add was not taken: at the fields the server named, else one line in its own words. */
function addRefusalOf({
  screen,
  said,
}: ProposalBuilderViewProps): Pick<ProposalPartAddProps, 'refused' | 'failure'> {
  const refusal = screen.parts.addRefusal;
  if (refusal === null) return {};
  const refused = refusal.fields.flatMap((field): ('brand' | 'specification')[] =>
    field === 'brand' || field === 'specification' ? [field] : [],
  );
  if (refused.length > 0) return { refused };
  const { failure } = refusal;
  const line = failure.kind === 'duplicate' ? said.sheets.add.duplicate : said.refusal(failure);
  return { failure: line ?? said.shared.failedMessage };
}

function sheetsOf(props: ProposalBuilderViewProps, drawn: BuilderDrawn): BuilderSheetsParts {
  const { screen, said } = props;
  const { frame } = props.ready;
  const { parts, phase, check } = screen;
  const { sheets, list } = said;
  const paymentPart = screen.paymentPart;
  const stages = paymentPart?.stages ?? [];
  const mayPlan = screen.detail?.rights.managesBilling === true;
  const addsParts = screen.detail?.rights.addsParts === true;
  return {
    list: {
      open: screen.stepsOpen,
      onClose: screen.closeSteps,
      words: list,
      steps: drawn.allSteps,
      current: frame.current,
      onStep: screen.goStepByKey,
      quick: { on: frame.quick, onChange: screen.toggleQuick },
      onGenerate: screen.openCheck,
    },
    preview: previewOf(props, drawn),
    picker: {
      open: parts.category !== null && !parts.adding && parts.editing === null,
      onClose: parts.close,
      words: sheets.picker,
      options: partPickerOptionsOf(parts.choices.kind === 'ready' ? parts.choices.value : null),
      search: parts.search,
      onSearch: parts.setSearch,
      full: parts.full,
      onToggle: parts.toggle,
      onEdit: parts.edit,
      ...(addsParts ? { onAdd: parts.openAdd } : {}),
      refusal: partsRefusalOf(props),
      ...(parts.hasMore ? { more: { loading: parts.loadingMore, onMore: parts.loadMore } } : {}),
    },
    edit: {
      open: parts.editing !== null,
      onClose: parts.closeEdit,
      words: sheets.edit,
      line: parts.editing,
      onDone: parts.saveEdit,
    },
    add:
      parts.catalogKind !== null
        ? null
        : {
            open: parts.adding,
            onClose: parts.closeAdd,
            words: sheets.add,
            category: parts.category ?? 'panel',
            saving: parts.addPending,
            ...addRefusalOf(props),
            onSave: parts.add,
          },
    phase: {
      open: phase !== null,
      onClose: () => phase?.close(),
      words: sheets.phase,
      phase: phase?.phase ?? null,
      onDone: (next) => phase?.done({ ...next, durationDays: next.durationDays ?? null }),
    },
    payment: {
      open: paymentPart !== null,
      onClose: () => paymentPart?.close(),
      words: sheets.payment,
      part: paymentPart?.part ?? null,
      /* Each stage in the words the document prints for it; only the stages the model offers. */
      stages: stages.map((stage) => ({ value: stage, label: said.blocks.split.due(stage) })),
      onDone: (next) => {
        const stage = stages.find((one) => one === next.dueOnStage);
        if (stage !== undefined) paymentPart?.done({ label: next.label, dueOnStage: stage });
      },
    },
    check: {
      open: check.open,
      onClose: check.close,
      words: said.check.words,
      state: proposalCheckStateOf(said.check, {
        fix: (step) => check.fix(step),
        cover: drawn.paper('cover', BUILDER_PAGE_WIDTH.summary),
        name: frame.customerName,
        generating: check.generating,
        onGenerate: check.generate,
        ...(mayPlan ? { onPlans: props.onPlans } : {}),
        changeNote: check.changeNote,
      }),
    },
  };
}

/** Why the server refused the parts' last commit — said in the picker too, where the pick was made. */
function partsRefusalOf<Step extends ProposalStepModel>(props: ProposalBuilderViewProps<Step>) {
  const { step } = props.ready;
  const save = step.step === 'components' ? step.saves?.components : undefined;
  return save?.kind === 'refused' ? props.said.refusal(save.failure) : null;
}
