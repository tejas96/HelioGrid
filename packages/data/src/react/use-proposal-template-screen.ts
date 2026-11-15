'use client';
import type { TrancheLine as TrancheLineWire } from '@heliogrid/contracts';
import {
  DEFAULT_COVER_PICTURE,
  DEFAULTS_PART_OF,
  type DefaultsPart,
  type FormatPack,
  opensSettingsRow,
  type ProposalVersionSnapshot,
  percentToBasisPoints,
  type TemplateDefaults,
  type TemplateSampleInput,
  type TimelinePhase,
  type TrancheTemplateDefault,
  templateSampleSnapshot,
  termsValidityDays,
  UI_SOURCE_LOCALE,
} from '@heliogrid/domain';
import { useState } from 'react';
import { type ProposalTemplateView, templateViewOf } from './proposal-template-view';
import { type CoverPhoto, useCoverPhoto } from './use-cover-photo';
import { type DefaultsPlan, useDefaultsPlan } from './use-defaults-plan';
import { type LeaveAsk, useLeaveAsk } from './use-leave-ask';
import { type PaymentTermsScreen, usePaymentTermsScreen } from './use-payment-terms-screen';
import { useProposalMarketNames } from './use-proposal-market-names';
import { type ProposalTemplatePage, useProposalTemplate } from './use-proposal-template';
import { useSession } from './use-session';
import { useTenantId } from './use-tenant-id';

/** Which phase the builder's phase sheet holds: one of the list's by its key, or a new one (`key` null). */
export type PhaseOpen =
  | { readonly key: number; readonly phase: TimelinePhase }
  | { readonly key: null };

/**
 * What the page opens over itself (`SCR-M01-19` m19-g, m19-n7, `T-M01-030`): a phase's editor, the
 * delete ask and the phone's sheet of the page. Every act lands in the page's draft only — nothing
 * reaches the server before *Save*.
 */
export interface TemplateOverlayState {
  readonly phaseOpen: PhaseOpen | null;
  /** The open phase's place, one-based, as the sheet's title counts it; a new one is the next. */
  readonly phaseNumber: number;
  readonly deleteAsked: { readonly key: number; readonly title: string } | null;
  /** The phone's sheet of the page the part feeds. */
  readonly previewOpen: boolean;
  editPhase(key: number, phase: TimelinePhase): void;
  addPhase(): void;
  /** The phase editor's *Save phase*: the phase lands in the draft and the editor closes. */
  savePhase(key: number | null, phase: TimelinePhase): void;
  closePhase(): void;
  askDeletePhase(key: number, title: string): void;
  /** *Delete phase*: the asked phase leaves the draft and the ask closes. */
  confirmDelete(): void;
  closeDelete(): void;
  setPreview(open: boolean): void;
}

/** What the screen says in the reader's words and the market's formats, for the sample document. */
export interface TemplateSampleWords {
  readonly formats: FormatPack;
  /** A new part's name in the reader's words — `Part 5`. */
  readonly newPart: (number: number) => string;
  /** The sample customer and their place. */
  readonly customer: {
    readonly name: string;
    readonly siteAddress: string;
    readonly area: string;
    readonly district: string;
  };
}

/**
 * Proposal defaults (`SCR-M01-19`, `M01-51`, `M01-52`, `T-M01-030`) as both screens draw it,
 * assembled once (Law 11, `F7-30`): the page as read, edited and saved, its view, which of the
 * seven parts is open, the sample document the stage draws, the company's payment plans, the
 * cover photo, the overlays and the ask before leaving a held change.
 */
export interface ProposalTemplateScreen {
  /** The person's presets open the Proposal defaults row (`F7-48`); the web answers not found without. */
  readonly allowed: boolean;
  readonly page: ProposalTemplatePage;
  readonly view: ProposalTemplateView;
  readonly part: DefaultsPart;
  /** Any record differs from what is saved: the act bar shows, and a way out asks first. */
  readonly held: boolean;
  /** The company's defaults over the sample deal; `null` until the page and Branding are read. */
  readonly sample: ProposalVersionSnapshot | null;
  /** The company's payment plans and the one editor that changes them (`SCR-M01-20`). */
  readonly plans: PaymentTermsScreen;
  /** The default plan edited inline with step 7's rows, sent by the page's one *Save*. */
  readonly plan: DefaultsPlan;
  readonly coverPhoto: CoverPhoto;
  readonly overlays: TemplateOverlayState;
  readonly leave: LeaveAsk;
  choosePart(next: DefaultsPart): void;
  /** *Save*; a refused save first opens the part whose field says why, so the reason is in view. */
  save(): void;
}

/** The company's defaults over the sample deal; `null` until the page and Branding are read. */
function sampleOf(
  page: ProposalTemplatePage,
  plan: { readonly lines: readonly TrancheLineWire[] } | null,
  said: TemplateSampleWords,
  facts: Pick<TemplateSampleInput, 'incentiveScheme' | 'preparedBy' | 'language'>,
  platformTerms: TemplateDefaults['terms'],
): ProposalVersionSnapshot | null {
  const { draft, company } = page;
  if (draft === null || company === null) return null;
  const { template } = draft;
  return templateSampleSnapshot({
    ...facts,
    formats: said.formats,
    company: {
      name: company.companyName,
      phoneE164: null,
      email: null,
      website: null,
      address: company.addressLine.trim() === '' ? null : company.addressLine,
      logoFileId: null,
      /* The sample states the tax number alone: which kind it is, the market's label says. */
      taxRegistration:
        company.registration === null
          ? null
          : { registrationType: said.formats.taxIdLabel, value: company.registration.value },
      bankDetails: page.bank.held ? page.bank.details : null,
      brandColour: page.brandColour,
    },
    cover: template.cover,
    coverPicture: template.coverPicture ?? DEFAULT_COVER_PICTURE,
    sectionsIncluded: template.sectionsIncluded,
    terms: template.defaultTerms,
    /* This page fills its terms in the reader's words, so the reader's defaults are the fill's. */
    validityDays: termsValidityDays(template.defaultTerms, [platformTerms]),
    phases: draft.phases,
    tranches: (plan?.lines ?? []).map((line) => ({
      label: line.label,
      share: percentToBasisPoints(line.percent),
      dueOnStage: line.dueOnStage,
    })),
    customer: said.customer,
  });
}

/**
 * `defaults` are the platform's terms and phases and `standard` its payment split, in the reader's
 * words (`documentDefaults(t)`); `said` carries the sample customer and the market's formats.
 */
export function useProposalTemplateScreen(
  defaults: TemplateDefaults,
  standard: TrancheTemplateDefault,
  said: TemplateSampleWords,
): ProposalTemplateScreen {
  const { user } = useSession();
  const tenantId = useTenantId();
  const page = useProposalTemplate(defaults);
  const plans = usePaymentTermsScreen(standard);
  const [part, setPart] = useState<DefaultsPart>('look');
  const overlays = useTemplateOverlays(page);
  const card = plans.page.cards.inUse.find((each) => each.isDefault) ?? null;
  const plan = useDefaultsPlan(card, said.newPart);
  const leave = useLeaveAsk(() => {
    page.discard();
    plan.reset();
  });
  const { incentiveScheme } = useProposalMarketNames();
  const template = page.draft?.template;
  const coverPhoto = useCoverPhoto(
    tenantId,
    { picture: template?.coverPicture, url: page.coverPhotoUrl },
    (picture) => page.edit({ kind: 'coverPicture', picture }),
  );
  return {
    allowed: opensSettingsRow(user?.tenant?.roles ?? [], 'proposal_templates'),
    page,
    view: templateViewOf(page.draft),
    part,
    held: page.changed.template || page.changed.timeline || page.changed.bank || plan.changed,
    sample: sampleOf(
      page,
      plan.lines === null ? null : { lines: plan.lines },
      said,
      {
        incentiveScheme,
        preparedBy: { name: user?.name ?? '', phoneE164: user?.phoneE164 ?? null },
        language: user?.interfaceLanguage ?? UI_SOURCE_LOCALE,
      },
      defaults.terms,
    ),
    plans,
    plan,
    coverPhoto,
    overlays,
    leave,
    choosePart: setPart,
    /* One *Save* for the page and its plan: each says where it failed and keeps what was typed. */
    save: () => {
      if (page.refusedPart !== null) setPart(DEFAULTS_PART_OF[page.refusedPart]);
      if (page.changed.template || page.changed.timeline || page.changed.bank) page.save();
      plan.save();
    },
  };
}

function useTemplateOverlays(page: ProposalTemplatePage): TemplateOverlayState {
  const [phaseOpen, setPhaseOpen] = useState<PhaseOpen | null>(null);
  const [deleteAsked, setDeleteAsked] = useState<{ key: number; title: string } | null>(null);
  const [previewOpen, setPreview] = useState(false);
  const phases = page.draft?.phases ?? [];
  const at = phaseOpen?.key === null ? -1 : phases.findIndex((one) => one.key === phaseOpen?.key);
  return {
    phaseOpen,
    phaseNumber: at === -1 ? phases.length + 1 : at + 1,
    deleteAsked,
    previewOpen,
    editPhase: (key, phase) => setPhaseOpen({ key, phase }),
    addPhase: () => setPhaseOpen({ key: null }),
    savePhase: (key, phase) => {
      page.edit({ kind: 'phase', key, phase });
      setPhaseOpen(null);
    },
    closePhase: () => setPhaseOpen(null),
    askDeletePhase: (key, title) => setDeleteAsked({ key, title }),
    confirmDelete: () => {
      if (deleteAsked !== null) page.edit({ kind: 'delete', key: deleteAsked.key });
      setDeleteAsked(null);
    },
    closeDelete: () => setDeleteAsked(null),
    setPreview,
  };
}
