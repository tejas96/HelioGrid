import type { TranslatedText } from '@heliogrid/contracts';
import {
  DEFAULTS_PART_PAGE,
  DEFAULTS_PARTS,
  PROPOSAL_PAGES,
  type ProposalPage,
  proposalSheetsOf,
  sheetNumber,
} from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { BuilderStep } from '../ProposalBuilder/ProposalBuilder.types';
import type { ProposalStepWords } from '../ProposalSteps/ProposalSteps.words.types';
import { paymentControls } from '../ProposalSteps/payment-controls';
import type { StepControl } from '../ProposalSteps/step-controls';
import type {
  DefaultsPartName,
  DefaultsPaymentView,
  DefaultsSample,
  ProposalDefaultsWords,
} from './ProposalTemplateSettings.types';

/**
 * Proposal defaults' own measures and pure answers (`SCR-M01-19`, `T-M01-030`), which both halves
 * read: the parts as the builder's frame takes them, the page each feeds, and where a page stands
 * among the pages that print.
 */

/** The widths a page is fitted to, px or dp, as the approved design draws each place. */
export const DEFAULTS_PAGE_WIDTH = {
  /** The desktop stage: the cover stands narrower so the whole page shows. */
  stageCover: 468,
  stage: 600,
  /** The phone's peek and its preview sheet. */
  peek: 310,
  preview: 326,
  /** The wall of every page: on the desktop stage, and in the phone's preview sheet. */
  wall: 118,
  wallPhone: 100,
  /** How many pages a row of the wall holds: five on the desktop stage, three in the phone's sheet. */
  wallColumns: 5,
  wallColumnsPhone: 3,
  /** A page's thumbnail on its row in *Pages*. */
  row: 54,
} as const;

/** The glyph each part wears on the rail and in the phone's row. */
export const DEFAULTS_PART_GLYPH: Readonly<Record<DefaultsPartName, ShellGlyphName>> = {
  look: 'palette',
  record: 'star',
  pages: 'layers',
  timeline: 'calendar-clock',
  payment: 'wallet',
  terms: 'file-text',
  bank: 'credit-card',
};

/** The seven parts as the frame's steps. A part has no standing: it always holds a default. */
export function defaultsSteps(words: ProposalDefaultsWords): BuilderStep[] {
  return DEFAULTS_PARTS.map((part) => ({
    key: part,
    title: words.parts[part].title,
    heading: words.parts[part].heading,
    glyph: DEFAULTS_PART_GLYPH[part],
    standing: 'default',
  }));
}

/** The part a frame key names; the first part for a key that names none. */
export function defaultsPartOf(key: string): DefaultsPartName {
  return DEFAULTS_PARTS.find((part) => part === key) ?? DEFAULTS_PARTS[0];
}

/** The page a part's stage shows, or `null` for *Pages*, whose stage is the wall. */
export function defaultsPageOf(part: DefaultsPartName): ProposalPage | null {
  return DEFAULTS_PART_PAGE[part];
}

/** One page on the wall: whether it prints, and its number among the pages that do. */
export interface WallPage {
  readonly page: ProposalPage;
  readonly on: boolean;
  /** One-based among the pages that print; `null` for a page left out. */
  readonly at: number | null;
}

/**
 * Every page in document order, each with its place among the sheets the sample prints — the
 * domain's page plan, so a page after terms that run to two sheets is numbered as it prints.
 */
export function wallPages(sample: DefaultsSample): WallPage[] {
  const sheets = proposalSheetsOf(sample.snapshot.pages, sample.snapshot.fields);
  return PROPOSAL_PAGES.map((page) => {
    const at = sheetNumber(sheets, page, 0);
    return { page, on: at > 0, at: at > 0 ? at : null };
  });
}

/** The line under a wall page: *3 · About us*, or *Off · About us*. */
export function wallLine(words: ProposalDefaultsWords, wall: WallPage): TranslatedText {
  const name = words.pageName[wall.page];
  return wall.at === null ? words.pageOff(name) : words.pageAt(wall.at, name);
}

/** What the stage's caption says of the page in view: its name, or how many pages print. */
export function stagePageLine(
  words: ProposalDefaultsWords,
  part: DefaultsPartName,
  sample: DefaultsSample,
): TranslatedText {
  const page = defaultsPageOf(part);
  return page === null
    ? words.pagesPrint(sample.snapshot.pages.length, PROPOSAL_PAGES.length)
    : words.pageName[page];
}

/**
 * The sample as a page left out still draws: the wall and a part's stage show every page, so a
 * page that is off is drawn as it would print, and marked off beside it.
 */
export function sampleWith(sample: DefaultsSample, page: ProposalPage): DefaultsSample {
  if (sample.snapshot.pages.includes(page)) return sample;
  const pages = PROPOSAL_PAGES.filter(
    (each) => each === page || sample.snapshot.pages.includes(each),
  );
  return { ...sample, snapshot: { ...sample.snapshot, pages } };
}

/** *Payment*'s controls: step 7's own, over the default plan; a plan that did not save says so first. */
export function defaultsPaymentControls(
  view: DefaultsPaymentView,
  shared: ProposalStepWords,
): StepControl[] {
  const failed: StepControl[] = view.failed
    ? [
        {
          kind: 'note',
          key: 'failed',
          notice: view.words.planFailed,
          tone: 'danger',
          glyph: 'alert-circle',
        },
      ]
    : [];
  const steady = {
    ...view,
    /* While a plan is being made the default, a second pick waits for it. */
    onPlan: (id: string) => {
      if (!view.changing && id !== view.planId) view.onPlan(id);
    },
  };
  return [...failed, ...paymentControls(steady, shared)];
}
