/**
 * The words of the second setup step (`SCR-M01-04`, `M01-23`): the two questions, each one's
 * refusal, the size's source, and what a failed save says — authored once for both platforms
 * (Law 11). The component picks no word by state; it draws what this returns.
 */
import {
  type ExplainerPagerWords,
  TENANT_SEGMENTS,
  type TenantSegment,
  type WhatYouSellQuestion,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { type ExplainerWords, explainerPagerWords } from './explainer';
import { SETUP_LANGUAGE } from './setup-language';
import { SIGN_IN } from './sign-in';

export const SETUP_WHAT_YOU_SELL = {
  title: /*i18n*/ { id: 'What do you sell?' },
  askLabel: /*i18n*/ { id: 'About these questions' },
  askTitle: /*i18n*/ { id: 'Why we ask' },
  askStartingPoint: /*i18n*/ {
    id: 'Your answers set the starting point for every proposal HelioGrid builds.',
  },
  askChangeLater: /*i18n*/ {
    id: 'You can change both later in your company profile, the next step. Proposals you have already sent never change.',
  },
  group: /*i18n*/ { id: 'Who you sell to' },
  pickOne: /*i18n*/ { id: 'Pick the one that describes your work.' },
  sizeHelper: /*i18n*/ { id: 'Your most common job, not your biggest.' },
  sizeLabel: /*i18n*/ { id: 'Typical system size' },
  declaredByYou: /*i18n*/ { id: 'Declared by you' },
  addSize: /*i18n*/ { id: 'Add the size you sell most often.' },
  savesBoth: /*i18n*/ { id: 'Saves both; you can change them in your company profile.' },
  stillChecking: /*i18n*/ { id: 'Still checking whether you have answered this.' },
  notSavedTitle: /*i18n*/ { id: 'Your answers did not save' },
  notSavedBody: /*i18n*/ { id: 'Try again, or finish this in your company profile.' },
  errorAskLabel: /*i18n*/ { id: 'About this error' },
  errorAskTitle: /*i18n*/ { id: 'Nothing was lost' },
  errorAskKept: /*i18n*/ {
    id: 'Your answers are still on this screen, and nothing about your account changed.',
  },
  errorAskFinishLater: /*i18n*/ {
    id: 'Finish later takes you to your company profile, the next step. You can finish both answers there.',
  },
  finishLater: /*i18n*/ { id: 'Finish later' },
  untilYouFinish: /*i18n*/ { id: 'Until you finish, proposals start without your answers.' },
};

/**
 * What an EPC sells, as a person reads it. A closed vocabulary: no translation may give two kinds
 * one word (`F3-12`) — held by the registry in `closed-vocabularies.ts`.
 */
export const TENANT_SEGMENT_WORD: Record<TenantSegment, MessageRef> = {
  residential: /*i18n*/ { id: 'Residential' },
  ci: /*i18n*/ { id: 'Commercial & industrial (C&I)' },
  both: /*i18n*/ { id: 'Both' },
};

/** Each kind's card line: the business it describes, never the defaults it seeds. */
const TENANT_SEGMENT_DESCRIPTION: Record<TenantSegment, MessageRef> = {
  residential: /*i18n*/ {
    id: 'Homes and individual rooftops, sold to the owner living under the system.',
  },
  ci: /*i18n*/ {
    id: 'Factories, warehouses and offices — bigger rooftops, sold to a business.',
  },
  both: /*i18n*/ {
    id: 'You sell to homes and businesses, and pick which one each proposal is for.',
  },
};

/** A unit is a quantity, not a word: it is outside the catalogs so no translation can change it. */
export const KWP = 'kWp';

export interface SetupWhatYouSellOption {
  readonly value: TenantSegment;
  readonly title: string;
  readonly description: string;
}

export interface SetupWhatYouSellWords {
  /** The question; after a failed save, what went wrong. */
  readonly title: string;
  /** Why the step asks; after a failed save, what was kept and where the second way leads. */
  readonly explainer: ExplainerWords & ExplainerPagerWords;
  /** What fixes a failed save. */
  readonly failure: string | null;
  readonly group: string;
  readonly options: readonly SetupWhatYouSellOption[];
  readonly groupError: string | null;
  /** What to type, read before the field. */
  readonly sizeHelper: string;
  readonly sizeLabel: string;
  readonly unit: string;
  /** Where the size comes from — beside its tier. */
  readonly sizeSource: string;
  readonly sizeError: string | null;
  /** Saves both answers: `Continue`, and `Try again` after a failed save. */
  readonly primary: string;
  /** Why the primary cannot be pressed yet. */
  readonly waiting: string | null;
  /** Leaves the step for later, after a failed save alone. */
  readonly secondary: string | null;
  /** The one line at the act; none while the primary waits or a question is refused. */
  readonly actLine: string | null;
}

/**
 * `checking` — the company's stored answers are still being read. `refused` — the questions
 * `Continue` was refused at and that are still owed. `failed` — the save failed.
 */
export interface SetupWhatYouSellFacts {
  readonly checking: boolean;
  readonly refused: readonly WhatYouSellQuestion[];
  readonly failed: boolean;
}

export function setupWhatYouSellWords(
  translate: Translator['t'],
  facts: SetupWhatYouSellFacts,
): SetupWhatYouSellWords {
  const { checking, refused, failed } = facts;
  return {
    title: translate(failed ? SETUP_WHAT_YOU_SELL.notSavedTitle : SETUP_WHAT_YOU_SELL.title),
    explainer: {
      ...(failed
        ? {
            label: translate(SETUP_WHAT_YOU_SELL.errorAskLabel),
            title: translate(SETUP_WHAT_YOU_SELL.errorAskTitle),
            pages: [
              translate(SETUP_WHAT_YOU_SELL.errorAskKept),
              translate(SETUP_WHAT_YOU_SELL.errorAskFinishLater),
            ],
          }
        : {
            label: translate(SETUP_WHAT_YOU_SELL.askLabel),
            title: translate(SETUP_WHAT_YOU_SELL.askTitle),
            pages: [
              translate(SETUP_WHAT_YOU_SELL.askStartingPoint),
              translate(SETUP_WHAT_YOU_SELL.askChangeLater),
            ],
          }),
      ...explainerPagerWords(translate),
    },
    failure: failed ? translate(SETUP_WHAT_YOU_SELL.notSavedBody) : null,
    group: translate(SETUP_WHAT_YOU_SELL.group),
    options: TENANT_SEGMENTS.map((segment) => ({
      value: segment,
      title: translate(TENANT_SEGMENT_WORD[segment]),
      description: translate(TENANT_SEGMENT_DESCRIPTION[segment]),
    })),
    groupError: refused.includes('segment') ? translate(SETUP_WHAT_YOU_SELL.pickOne) : null,
    sizeHelper: translate(SETUP_WHAT_YOU_SELL.sizeHelper),
    sizeLabel: translate(SETUP_WHAT_YOU_SELL.sizeLabel),
    unit: KWP,
    sizeSource: translate(SETUP_WHAT_YOU_SELL.declaredByYou),
    sizeError: refused.includes('size') ? translate(SETUP_WHAT_YOU_SELL.addSize) : null,
    primary: translate(failed ? SIGN_IN.tryAgain : SETUP_LANGUAGE.continue),
    waiting: checking ? translate(SETUP_WHAT_YOU_SELL.stillChecking) : null,
    secondary: failed ? translate(SETUP_WHAT_YOU_SELL.finishLater) : null,
    actLine: actLine(translate, facts),
  };
}

function actLine(translate: Translator['t'], facts: SetupWhatYouSellFacts): string | null {
  if (facts.failed) return translate(SETUP_WHAT_YOU_SELL.untilYouFinish);
  if (facts.checking || facts.refused.length > 0) return null;
  return translate(SETUP_WHAT_YOU_SELL.savesBoth);
}
