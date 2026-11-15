import {
  type BankDetails,
  type ProposalPage as PageKey,
  type ProposalDraftValueSet,
  proposalSheetsOf,
  sheetKey,
  termsEstimate as termsPagePlan,
} from '@heliogrid/domain';
import { createElement, Fragment, type ReactNode } from 'react';
import { ScaledProposalPage } from '../ProposalPages/ProposalPages';
import type {
  ProposalCoverWords,
  ProposalPageFacts,
  ProposalPagesWords,
} from '../ProposalPages/ProposalPages.types';
import { stepAreasOf } from '../ProposalSteps/step-view';
import type { StepViewParts } from '../ProposalSteps/step-view.types';
import type { RichTextValue } from '../RichText/RichText.types';
import { type BuilderStepFact, builderStepsOf } from './ProposalBuilder.logic';
import type { BuilderStep } from './ProposalBuilder.types';

/**
 * What the builder DRAWS from the document, joined once for the web and the phone: the page a step
 * feeds at a width, the value set a step's own block reads, and the steps with their names and
 * glyphs. The words arrive from `packages/i18n`'s `proposalBuilderSaid`, the facts from the view
 * model — each by shape, since this package imports neither.
 */
export interface BuilderDrawnInput {
  readonly frame: {
    readonly steps: readonly BuilderStepFact[];
    readonly allSteps: readonly BuilderStepFact[];
    readonly snapshot: StepViewParts['snapshot'];
    /** The value set with its money absent until a price is typed: the cover draws it from step 1. */
    readonly valueSet: ProposalDraftValueSet;
    readonly fieldSet: StepViewParts['fields'];
  };
  /** The document's own facts beside its value set; `null` until the proposal is read. */
  readonly facts: ProposalPageFacts | null;
  readonly bank: BankDetails | null;
  readonly said: {
    readonly names: Parameters<typeof builderStepsOf>[1];
    readonly pageWords: ProposalPagesWords | null;
    readonly coverWords: ProposalCoverWords;
    readonly blocks: StepViewParts['blocks'];
    readonly partsWords: StepViewParts['parts'];
    readonly refusal: NonNullable<StepViewParts['refusal']>;
  };
  readonly areas: Parameters<typeof stepAreasOf>[0];
}

export interface BuilderDrawn {
  readonly steps: BuilderStep[];
  readonly allSteps: BuilderStep[];
  /**
   * The page a step feeds, at a width — every sheet it prints on, in order (`proposalSheetsOf`), as
   * the reader draws them. The cover draws from step 1; any other page waits for a price — a page
   * states no figure it lacks.
   */
  paper(page: PageKey, width: number): ReactNode;
  /** What a step's view is joined with (`proposalStepViewOf`). */
  partsOf(peek?: StepViewParts['peek']): StepViewParts;
  /**
   * Step 9's count and page estimate over the terms as they stand (`M06-15`): the pages the
   * document's own plan prints them on (`termsPagesOf`), so the estimate is the printed count.
   */
  termsEstimate(terms: RichTextValue): { readonly pages: number; readonly chars: number };
}

export function builderDrawnOf({
  frame,
  facts,
  bank,
  said,
  areas,
}: BuilderDrawnInput): BuilderDrawn {
  const { snapshot } = frame;
  const { pageWords } = said;
  return {
    steps: builderStepsOf(frame.steps, said.names),
    allSteps: builderStepsOf(frame.allSteps, said.names),
    paper: (page, width) => {
      if (facts === null) return null;
      if (page === 'cover') {
        return createElement(ScaledProposalPage, {
          page,
          width,
          snapshot: snapshot ?? frame.valueSet,
          facts,
          words: pageWords ?? said.coverWords,
          still: true,
        });
      }
      if (snapshot === null || pageWords === null) return null;
      const printed = proposalSheetsOf(snapshot.pages, snapshot.fields).filter(
        (sheet) => sheet.page === page,
      );
      /* A page the company leaves out still shows on its own step, as its first sheet. */
      const sheets = printed.length === 0 ? [{ page, part: 0 }] : printed;
      return createElement(
        Fragment,
        null,
        ...sheets.map((sheet) =>
          createElement(ScaledProposalPage, {
            key: sheetKey(sheet),
            page,
            part: sheet.part,
            width,
            snapshot,
            facts,
            words: pageWords,
            still: true,
          }),
        ),
      );
    },
    termsEstimate: (terms) => termsPagePlan(terms),
    partsOf: (peek) => ({
      snapshot,
      fields: frame.fieldSet,
      bank,
      blocks: said.blocks,
      parts: said.partsWords,
      generationTier: facts?.generationTier ?? 'estimated',
      ...(peek === undefined ? {} : { peek }),
      areas: stepAreasOf(areas),
      refusal: said.refusal,
    }),
  };
}
