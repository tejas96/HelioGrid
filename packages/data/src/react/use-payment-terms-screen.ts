'use client';
import { opensSettingsRow, type TrancheCard, type UiLanguage } from '@heliogrid/domain';
import { useState } from 'react';
import { useSession } from './use-session';
import { type PaymentTermsPage, useTrancheTemplates } from './use-tranche-templates';

/**
 * Payment terms (`SCR-M01-20`) as both screens draw it, assembled once (Law 11, `F7-30`): the
 * page, which cards are in view, and the open editor's stage picker and its two asks.
 */
export interface PaymentTermsScreen {
  /** The reader's presets open the Payment terms row (`F7-48`); the web answers anyone else with not found. */
  readonly allowed: boolean;
  readonly page: PaymentTermsPage;
  /** The archived templates are in view instead of those in use. */
  readonly archived: boolean;
  /** The cards in view. */
  readonly cards: readonly TrancheCard[];
  toggleArchived(): void;
  /** The line whose *When is it due?* is open; null while the picker is shut. */
  readonly picking: number | null;
  pickStage(line: number): void;
  donePicking(): void;
  /** *Archive {name}?* asks about the open template, which is saved. */
  readonly archiveAsked: boolean;
  askArchive(): void;
  /** The archive ask's *Keep it* and ✕. */
  keepTemplate(): void;
  /** The archive ask's *Archive*; its success closes the editor. */
  archive(): void;
  /** *Leave without saving?* asks: the open template holds a change and was told to leave. */
  readonly leaveAsked: boolean;
  /** Opens a card's template, asking first when the open one holds a change; its own card opens nothing. */
  openCard(id: string): void;
  /** *Add payment terms*, asking first when the open template holds a change. */
  add(): void;
  /** The editor's ✕ and *Cancel*, asking first when it holds a change. */
  closeEditor(): void;
  /** A move off the page while the open template holds a change: held until the ask is answered. */
  askLeave(move: () => void): void;
  /** The leave ask's *Keep editing*. */
  keepEditing(): void;
  /** The leave ask's *Leave*: the change is dropped, the editor closes and the held move goes. */
  discardAndLeave(): void;
}

/** Fills `PaymentTermsScreen`; the reader's language is its input, which names a new template's lines. */
export function usePaymentTermsScreen(language: UiLanguage): PaymentTermsScreen {
  const { user } = useSession();
  const page = useTrancheTemplates(language);
  const [archived, setArchived] = useState(false);
  const [picking, setPicking] = useState<number | null>(null);
  const [archiveAsked, setArchiveAsked] = useState(false);
  const [heldMove, setHeldMove] = useState<(() => void) | null>(null);
  const editor = page.editor;
  const openId = editor?.draft.id ?? null;

  /* A held change asks first and `then` waits for the answer. Nothing held: the picker and any ask
     belong to the editor that leaves, so they go with it — none outlives its template. */
  const leaveEditor = (then: () => void) => {
    if (editor?.changed) {
      setHeldMove(() => then);
      return;
    }
    setPicking(null);
    setArchiveAsked(false);
    setHeldMove(null);
    then();
  };

  return {
    allowed: opensSettingsRow(user?.tenant?.roles ?? [], 'payment_terms'),
    page,
    archived,
    cards: archived ? page.cards.archived : page.cards.inUse,
    toggleArchived: () => setArchived((was) => !was),
    picking: editor === null ? null : picking,
    pickStage: setPicking,
    donePicking: () => setPicking(null),
    archiveAsked: archiveAsked && openId !== null,
    askArchive: () => setArchiveAsked(true),
    keepTemplate: () => setArchiveAsked(false),
    archive: () => {
      setArchiveAsked(false);
      if (openId !== null) page.act(openId, 'archive');
    },
    leaveAsked: heldMove !== null,
    openCard: (id) => {
      if (id !== openId) leaveEditor(() => page.open(id));
    },
    add: () => leaveEditor(page.openNew),
    closeEditor: () => leaveEditor(page.close),
    askLeave: (move) => setHeldMove(() => move),
    keepEditing: () => setHeldMove(null),
    discardAndLeave: () => {
      const move = heldMove;
      setHeldMove(null);
      setPicking(null);
      page.close();
      move?.();
    },
  };
}
