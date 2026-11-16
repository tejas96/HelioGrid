import type { TranslatedText } from '@heliogrid/contracts';
import type { ProposalStep, StepStanding } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { BuilderStep } from './ProposalBuilder.types';

/** The glyph each of the eleven steps wears on the list of every step (`T-M06-002`). */
export const PROPOSAL_STEP_GLYPH: Readonly<Record<ProposalStep, ShellGlyphName>> = {
  company: 'building',
  achievements: 'star',
  system: 'solar-panel',
  performance: 'sun',
  financials: 'trend-up',
  timeline: 'calendar-clock',
  payment: 'wallet',
  components: 'package',
  terms: 'document',
  client: 'user',
  bank: 'credit-card',
};

/** One step as the view model states it: its key, how it stands, and whether Quick mode hides it. */
export interface BuilderStepFact {
  readonly step: ProposalStep;
  readonly standing: StepStanding;
  readonly quiet: boolean;
}

/** The steps as the frame draws them: each fact with its two names and the glyph it wears. */
export function builderStepsOf(
  facts: readonly BuilderStepFact[],
  names: Readonly<Record<ProposalStep, { title: TranslatedText; heading: TranslatedText }>>,
): BuilderStep[] {
  return facts.map((fact) => ({
    key: fact.step,
    title: names[fact.step].title,
    heading: names[fact.step].heading,
    glyph: PROPOSAL_STEP_GLYPH[fact.step],
    standing: fact.standing,
    quiet: fact.quiet,
  }));
}

/** Where the step in view sits among the steps presented. */
export interface BuilderPlace {
  /** Zero-based; the first step when the key names none. */
  readonly index: number;
  readonly total: number;
  readonly step: BuilderStep | undefined;
  readonly previous: BuilderStep | undefined;
  readonly next: BuilderStep | undefined;
  readonly first: boolean;
  readonly last: boolean;
}

export function builderPlace(steps: readonly BuilderStep[], current: string): BuilderPlace {
  const found = steps.findIndex((step) => step.key === current);
  const index = found < 0 ? 0 : found;
  return {
    index,
    total: steps.length,
    step: steps[index],
    previous: steps[index - 1],
    next: steps[index + 1],
    first: index === 0,
    last: index === steps.length - 1,
  };
}

/** A track segment: behind the step in view, on it, or ahead of it. */
export type TrackAt = 'done' | 'now' | 'ahead';

export function trackAt(index: number, at: number): TrackAt {
  if (index < at) return 'done';
  return index === at ? 'now' : 'ahead';
}

/**
 * How wide the document page is drawn in each place the builder shows it, px: the desktop stage
 * (the cover a little narrower, as it has no margin to lose), the phone's peek and preview, the
 * check's summary and the screen after Generate.
 */
export const BUILDER_PAGE_WIDTH = {
  cover: 468,
  page: 600,
  peek: 310,
  preview: 326,
  summary: 92,
  ready: 360,
  readyPhone: 210,
} as const;

/**
 * The room, px, the desktop form needs: one labelled rail of all eleven steps without cutting a
 * label, and a stage beside the step's 560 card. Below it the frame takes its phone form — the
 * rail's labels would be cut to `Comp…` and the page clipped (`T-M06-002`). Measured on the
 * frame's own room, never the window's.
 */
export const BUILDER_DESKTOP_ROOM = 1200;

/* `BuilderDesktop.css`: the body's side padding (2 × sp-8), its gap (sp-6), the card's width and
   the stage's own inset around the page. Change one there and change it here. */
const DESKTOP_CHROME = 2 * 32 + 24 + 560 + 48;

/** How wide the stage draws its page in a room this wide: its full width, or less where room is short. */
export function builderStagePageWidth(room: number, cover: boolean): number {
  const full = cover ? BUILDER_PAGE_WIDTH.cover : BUILDER_PAGE_WIDTH.page;
  return Math.max(0, Math.min(full, room - DESKTOP_CHROME));
}
