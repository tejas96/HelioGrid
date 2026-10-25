'use client';
import {
  EMPTY_PHASE,
  type PhaseRefusals,
  phaseRefusals,
  phaseWithText,
  type TimelinePhase,
  type UiLanguage,
} from '@heliogrid/domain';
import { useState } from 'react';

/** Which phase the editor holds: one of the list's by its key, or a new one (`key` null). */
export type PhaseOpen =
  | { readonly key: number; readonly phase: TimelinePhase }
  | { readonly key: null };

export interface PhaseEditor {
  readonly phase: TimelinePhase;
  readonly language: UiLanguage;
  chooseLanguage(language: UiLanguage): void;
  /** The field refusals, said only once the person tried to save the phase. */
  readonly shown: PhaseRefusals;
  editName(text: string): void;
  editWhat(text: string): void;
  /** Hands the phase on when no field refuses; otherwise shows the refusals and keeps it open. */
  save(): void;
}

const NONE: PhaseRefusals = { name: null, description: null };

/** What one opening of the editor holds; a new opening starts again from its own phase. */
interface Held {
  readonly open: PhaseOpen | null;
  readonly phase: TimelinePhase;
  readonly language: UiLanguage;
  readonly tried: boolean;
}

function freshFor(open: PhaseOpen | null): Held {
  const phase = open === null || open.key === null ? EMPTY_PHASE : open.phase;
  return { open, phase, language: 'en', tried: false };
}

/**
 * The phase editor's one flow for both screens (`SCR-M01-19` m19-g, m19-l): each opening starts
 * from the phase it holds (or an empty one), in English, on its very first frame — the held state
 * belongs to the opening it was made for, so a new opening never shows the last one's fields, nor
 * an empty frame before its own; typing changes one language of one field; *Save phase* hands the
 * phase to the page's draft only when its English name and sentence are written.
 */
export function usePhaseEditor(
  open: PhaseOpen | null,
  onSave: (key: number | null, phase: TimelinePhase) => void,
): PhaseEditor {
  const [stored, setStored] = useState<Held>(() => freshFor(open));
  const held = stored.open === open ? stored : freshFor(open);
  // From the latest held state, never this render's: two edits can land before the next render.
  const change = (next: (was: Held) => Partial<Held>) =>
    setStored((was) => {
      const current = was.open === open ? was : freshFor(open);
      return { ...current, ...next(current) };
    });
  const refusals = phaseRefusals(held.phase);
  return {
    phase: held.phase,
    language: held.language,
    chooseLanguage: (language) => change(() => ({ language })),
    shown: held.tried ? refusals : NONE,
    editName: (text) =>
      change((was) => ({ phase: phaseWithText(was.phase, 'name', was.language, text) })),
    editWhat: (text) =>
      change((was) => ({ phase: phaseWithText(was.phase, 'description', was.language, text) })),
    save: () => {
      change(() => ({ tried: true }));
      if (open === null || refusals.name !== null || refusals.description !== null) return;
      onSave(open.key, held.phase);
    },
  };
}
