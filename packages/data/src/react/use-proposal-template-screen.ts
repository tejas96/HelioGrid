'use client';
import {
  opensSettingsRow,
  type TemplatePart,
  type TimelinePhase,
  type UiLanguage,
} from '@heliogrid/domain';
import { useState } from 'react';
import { type ProposalTemplateView, templateViewOf } from './proposal-template-view';
import { type LeaveAsk, useLeaveAsk } from './use-leave-ask';
import type { PhaseOpen } from './use-phase-editor';
import { type ProposalTemplatePage, useProposalTemplate } from './use-proposal-template';
import { useSession } from './use-session';

/**
 * What the page opens over itself (`SCR-M01-19` m19-g, m19-h, m19-n7): a phase's editor, the
 * full-size reader and the delete ask. Every act lands in the page's draft only — nothing reaches
 * the server before *Save template*.
 */
export interface TemplateOverlayState {
  readonly phaseOpen: PhaseOpen | null;
  readonly deleteAsked: { readonly key: number; readonly title: string } | null;
  readonly fullSizeOpen: boolean;
  editPhase(key: number, phase: TimelinePhase): void;
  addPhase(): void;
  /** The phase editor's *Save phase*: the phase lands in the draft and the editor closes. */
  savePhase(key: number | null, phase: TimelinePhase): void;
  closePhase(): void;
  askDeletePhase(key: number, title: string): void;
  /** *Delete phase*: the asked phase leaves the draft and the ask closes. */
  confirmDelete(): void;
  closeDelete(): void;
  openFullSize(): void;
  closeFullSize(): void;
}

/**
 * The Proposal template (`SCR-M01-19`, `M01-51`, `M01-52`) as both screens draw it, assembled once
 * (Law 11, `F7-30`): the page as read, edited and saved, its view in the chosen languages, which
 * part is open, the overlays and the ask before leaving a held change.
 */
export interface ProposalTemplateScreen {
  /** The person's presets open the Proposal template row (`F7-48`); the web answers not found without. */
  readonly allowed: boolean;
  readonly page: ProposalTemplatePage;
  /** The page in the languages chosen on the Cover and Terms strips, phases in the reader's own. */
  readonly view: ProposalTemplateView;
  readonly part: TemplatePart;
  readonly coverLanguage: UiLanguage;
  readonly termsLanguage: UiLanguage;
  /** Either record differs from what is saved: the act bar shows, and a way out asks first. */
  readonly held: boolean;
  readonly overlays: TemplateOverlayState;
  readonly leave: LeaveAsk;
  choosePart(next: TemplatePart): void;
  chooseCoverLanguage(next: UiLanguage): void;
  chooseTermsLanguage(next: UiLanguage): void;
  /** *Save template*; a refused save first opens the part whose field says why, so the reason is in view. */
  save(): void;
}

/** `reader` is the person's own language (`useI18n().locale`), which a phase shows in (`F3-10`). */
export function useProposalTemplateScreen(reader: UiLanguage): ProposalTemplateScreen {
  const { user } = useSession();
  const page = useProposalTemplate();
  const [part, setPart] = useState<TemplatePart>('cover');
  const [coverLanguage, setCoverLanguage] = useState<UiLanguage>('en');
  const [termsLanguage, setTermsLanguage] = useState<UiLanguage>('en');
  const overlays = useTemplateOverlays(page);
  const leave = useLeaveAsk(page.discard);
  return {
    allowed: opensSettingsRow(user?.tenant?.roles ?? [], 'proposal_templates'),
    page,
    view: templateViewOf(page.draft, { cover: coverLanguage, terms: termsLanguage }, reader),
    part,
    coverLanguage,
    termsLanguage,
    held: page.changed.template || page.changed.timeline,
    overlays,
    leave,
    choosePart: setPart,
    chooseCoverLanguage: setCoverLanguage,
    chooseTermsLanguage: setTermsLanguage,
    save: () => {
      if (page.refusedPart !== null) setPart(page.refusedPart);
      page.save();
    },
  };
}

function useTemplateOverlays(page: ProposalTemplatePage): TemplateOverlayState {
  const [phaseOpen, setPhaseOpen] = useState<PhaseOpen | null>(null);
  const [deleteAsked, setDeleteAsked] = useState<{ key: number; title: string } | null>(null);
  const [fullSizeOpen, setFullSizeOpen] = useState(false);
  return {
    phaseOpen,
    deleteAsked,
    fullSizeOpen,
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
    openFullSize: () => setFullSizeOpen(true),
    closeFullSize: () => setFullSizeOpen(false),
  };
}
