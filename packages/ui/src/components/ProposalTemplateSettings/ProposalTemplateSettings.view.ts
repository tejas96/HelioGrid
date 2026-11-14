import type { TranslatedText } from '@heliogrid/contracts';
import {
  ABOUT_COMPANY_LIMIT,
  type BankDetails,
  type CoverPictureKey,
  type ProposalCover,
  type ProposalPage,
  sectionOfPage,
  type TemplateEdit,
  type TimelinePhase,
  type TrancheLineRead,
} from '@heliogrid/domain';
import type {
  BankStepWords,
  TermsStepWords,
  TimelineStepWords,
  TrackRecordStepWords,
} from '../ProposalSteps/ProposalSteps.words.types';
import type { RichTextValue } from '../RichText/RichText.types';
import type {
  BrandMark,
  DefaultsCoverChoice,
  DefaultsPaymentView,
  DefaultsSample,
  ProposalTemplateSettingsProps,
} from './ProposalTemplateSettings.types';

/**
 * The seven parts' props from what the page holds (`packages/data`'s `templateViewOf`, read here by
 * its shape) and what an app binds to it — its words and where each act goes. Both screens build
 * their parts here, so the web and the phone cannot assemble them two ways.
 */
export interface DefaultsViewShape {
  readonly look: { readonly chosen: CoverPictureKey | 'own' };
  readonly record: ProposalCover;
  readonly pages: {
    readonly rows: readonly {
      readonly page: ProposalPage;
      readonly on: boolean;
      readonly always: boolean;
    }[];
  };
  readonly terms: { readonly value: RichTextValue };
  readonly timeline: {
    readonly phases: readonly { readonly key: number; readonly phase: TimelinePhase }[];
  };
}

export interface DefaultsBinding {
  readonly words: {
    readonly record: TrackRecordStepWords;
    readonly timeline: TimelineStepWords;
    readonly payment: DefaultsPaymentView['words'];
    readonly terms: TermsStepWords;
    readonly bank: BankStepWords;
    /** *Brand colour and logo*, and where they come from. */
    readonly brand: TranslatedText;
    readonly brandFrom: TranslatedText;
    readonly ownPhotoRefused: TranslatedText;
  };
  readonly covers: readonly DefaultsCoverChoice[];
  /** The page's one draft: every part's edit lands there until *Save*. */
  edit(edit: TemplateEdit): void;
  /** The company's own cover photo as the page holds it, and the device's chooser. */
  readonly photo: {
    readonly picture: string | null;
    readonly held: { readonly kind: 'own'; readonly fileId: string } | null;
    readonly storing: boolean;
    readonly refused: boolean;
    onChoose(): void;
  };
  onOpenBranding(): void;
  /** HelioGrid's phases in the reader's words: what *Reset* goes back to. */
  readonly platformPhases: readonly TimelinePhase[];
  onEditPhase(key: number, phase: TimelinePhase): void;
  onDeletePhase(key: number, title: string): void;
  onAddPhase(): void;
  /** The company's plans in use, the default marked, and the plan editor's doors. */
  readonly plans: readonly {
    readonly id: string;
    readonly name: string;
    readonly isDefault: boolean;
  }[];
  readonly changingPlan: boolean;
  onPlan(id: string): void;
  onNewPlan(): void;
  /** The default plan as the page holds it, edited with step 7's rows (`useDefaultsPlan`, by shape). */
  readonly plan: {
    readonly lines: readonly TrancheLineRead[] | null;
    readonly failed: boolean;
    share(index: number, percent: number): void;
    remove(index: number): void;
    add(): void;
    reset(): void;
  };
  readonly bank: {
    readonly details: BankDetails;
    readonly held: boolean;
    edit(field: keyof BankDetails, value: string): void;
  };
  /** The sample document, whose words say the plan and the account as the customer reads them. */
  readonly sample: DefaultsSample | null;
}

type Parts = Pick<
  ProposalTemplateSettingsProps,
  'look' | 'record' | 'pages' | 'timeline' | 'payment' | 'terms' | 'bank'
>;

function lookOf(view: DefaultsViewShape, bound: DefaultsBinding): Parts['look'] {
  const { photo } = bound;
  const held = photo.held;
  return {
    covers: bound.covers,
    chosen: view.look.chosen,
    onCover: (key) => bound.edit({ kind: 'coverPicture', picture: { kind: 'platform', key } }),
    own: {
      ...(photo.picture === null ? {} : { src: photo.picture }),
      storing: photo.storing,
      ...(photo.refused ? { error: bound.words.ownPhotoRefused } : {}),
      onChoose: photo.onChoose,
      ...(held === null
        ? {}
        : { onUse: () => bound.edit({ kind: 'coverPicture', picture: held }) }),
    },
    brand: {
      key: 'brand',
      glyph: 'palette',
      label: bound.words.brand,
      value: bound.words.brandFrom,
      onOpen: bound.onOpenBranding,
      ...(bound.sample === null ? {} : { mark: markOf(bound.sample) }),
    },
  };
}

function markOf({ snapshot, facts }: DefaultsSample): BrandMark {
  return {
    name: snapshot.company.name,
    colour: snapshot.company.brandColour,
    ...(facts.logoSrc === undefined ? {} : { logo: facts.logoSrc }),
  };
}

function timelineOf(view: DefaultsViewShape, bound: DefaultsBinding): Parts['timeline'] {
  const { phases } = view.timeline;
  return {
    words: bound.words.timeline,
    phases: phases.map(({ phase }) => ({ ...phase, durationDays: null })),
    onMove: (index, by) => bound.edit({ kind: 'move', from: index, to: index + by }),
    onRemove: (index) => {
      const row = phases[index];
      if (row !== undefined) bound.onDeletePhase(row.key, row.phase.name);
    },
    onEdit: (index) => {
      const row = phases[index];
      if (row !== undefined) bound.onEditPhase(row.key, row.phase);
    },
    onAdd: bound.onAddPhase,
    onReset: () => bound.edit({ kind: 'phases', phases: bound.platformPhases }),
  };
}

function paymentOf(bound: DefaultsBinding): Parts['payment'] {
  const plan = bound.plans.find((each) => each.isDefault) ?? null;
  const { sample } = bound;
  return {
    words: bound.words.payment,
    plans: bound.plans.map(({ id, name }) => ({ id, name })),
    planId: plan?.id ?? null,
    onPlan: bound.onPlan,
    changing: bound.changingPlan,
    onNewPlan: bound.onNewPlan,
    /* Each part in the words the document prints for its stage; none until the sample's words are read. */
    parts:
      sample === null
        ? []
        : (bound.plan.lines ?? []).map((line, index) => ({
            key: `${index}`,
            label: line.label,
            due: sample.words.blocks.split.due(line.dueOnStage),
            percent: Number(line.percent),
          })),
    onShare: bound.plan.share,
    /* No remove: the design's parts take − / + only; a plan is reshaped or archived in Payment terms. */
    onAdd: bound.plan.add,
    onReset: bound.plan.reset,
    failed: bound.plan.failed,
  };
}

function bankOf(view: DefaultsViewShape, bound: DefaultsBinding): Parts['bank'] {
  const { bank, sample } = bound;
  const include = view.pages.rows.some((row) => row.page === 'bank' && row.on);
  return {
    words: bound.words.bank,
    bank:
      sample === null || !bank.held
        ? null
        : { bank: bank.details, notPrinted: !include, words: sample.words.blocks.bank },
    include,
    onInclude: (next) => {
      if (next !== include) bound.edit({ kind: 'section', section: 'bank_details' });
    },
    edit: { details: bank.details, onDetail: bank.edit },
  };
}

/** The seven parts as `ProposalTemplateSettings` takes them. */
export function defaultsPartsOf(view: DefaultsViewShape, bound: DefaultsBinding): Parts {
  return {
    look: lookOf(view, bound),
    record: {
      words: bound.words.record,
      record: view.record,
      onCount: (count, value) => bound.edit({ kind: 'count', count, value }),
      about: {
        max: ABOUT_COMPANY_LIMIT,
        onCommit: (text) => bound.edit({ kind: 'about', text }),
      },
    },
    pages: {
      rows: view.pages.rows,
      onToggle: (page) => {
        const section = sectionOfPage(page);
        if (section !== null) bound.edit({ kind: 'section', section });
      },
    },
    timeline: timelineOf(view, bound),
    payment: paymentOf(bound),
    terms: {
      words: bound.words.terms,
      terms: view.terms.value,
      onChange: (value) => bound.edit({ kind: 'terms', value }),
      onCommit: (value) => bound.edit({ kind: 'terms', value }),
    },
    bank: bankOf(view, bound),
  };
}
