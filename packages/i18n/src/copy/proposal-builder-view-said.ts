import type { TranslatedText } from '@heliogrid/contracts';
import { type ComponentCategory, PROPOSAL_LIMITS, type Read } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import {
  type BuilderCheckInput,
  type BuilderCheckRow,
  planCountsOf,
  proposalBuilderCheckSaid,
} from './proposal-builder-check-said';
import { isMissingCompanyFact } from './proposal-builder-flow';
import {
  type BuilderSaidFormat,
  type BuilderSaidFrame,
  type BuilderSaidInput,
  builderSheets,
  proposalBuilderSaid,
} from './proposal-builder-said';
import {
  proposalPartAddWords,
  proposalPartEditWords,
  proposalPartPickerWords,
  proposalPaymentPartWords,
  proposalPhaseSheetWords,
} from './proposal-builder-sheets';
import { proposalReadyWords } from './proposal-ready-words';

type T = Translator['t'];

/** The builder's view model as `packages/data` assembles it, by shape — this package reads no `data`. */
export interface BuilderViewFacts {
  readonly read: Read<{ readonly frame: BuilderSaidFrame & { readonly current: string } }>;
  readonly detail: {
    readonly document: NonNullable<BuilderSaidInput['document']>;
    readonly rights: {
      readonly writesCompanyFacts: boolean;
      readonly addsParts: boolean;
      readonly managesBilling: boolean;
    };
    readonly companyFactsBy?: { readonly name: string } | null;
    readonly versions: readonly unknown[];
    readonly missingCompanyFacts?: readonly string[];
  } | null;
  readonly check: BuilderCheckInput['check'];
  readonly plan: { readonly used: number; readonly limit: number | null } | null;
  readonly parts: {
    readonly category: ComponentCategory | null;
    readonly choices: Read<readonly { readonly picked: boolean }[]>;
    readonly editing: { readonly brand: string } | null;
  };
  readonly phase: { readonly number: number } | null;
  readonly paymentPart: { readonly number: number; readonly isNew: boolean } | null;
  readonly ready: { readonly made: { readonly number: string; readonly version: number } } | null;
}

/** The sheets a step opens over the builder, in words: chosen by which part, phase or brand is open. */
function sheetsSaid(t: T, facts: BuilderViewFacts) {
  const category = facts.parts.category ?? 'panel';
  const { choices } = facts.parts;
  return {
    picker: proposalPartPickerWords(t, {
      category,
      picked: choices.kind === 'ready' ? choices.value.filter((one) => one.picked).length : 0,
      max: PROPOSAL_LIMITS.brandsPerCategory,
      canAdd: facts.detail?.rights.addsParts === true,
    }),
    edit: proposalPartEditWords(t, { brand: facts.parts.editing?.brand ?? '', category }),
    add: proposalPartAddWords(t, { category }),
    phase: proposalPhaseSheetWords(t, { number: facts.phase?.number ?? 1 }),
    payment: proposalPaymentPartWords(t, {
      number: facts.paymentPart?.number ?? 1,
      isNew: facts.paymentPart?.isNew ?? false,
    }),
  };
}

/**
 * The fields the step in view marks once Generate was asked for (`T-M06-022` DONE WHEN 2): each
 * block's field, by its path, with the block's own words — the row the Check sheet opened it from.
 */
function marksOf(
  blocks: readonly BuilderCheckRow[],
  current: string,
): Readonly<Record<string, { readonly title: TranslatedText; readonly line: TranslatedText }>> {
  const marks: Record<string, { title: TranslatedText; line: TranslatedText }> = {};
  for (const block of blocks) {
    if (block.step !== current) continue;
    for (const field of block.fields) marks[field] ??= { title: block.title, line: block.line };
  }
  return marks;
}

/**
 * Everything the builder says once its draft is read (`SCR-M06-02`…`SCR-M06-13`), the web's and
 * the phone's alike: the frame and the step in view (`proposalBuilderSaid`), the sheets, the check
 * before Generate and the screen after it. `null` while the draft is not read.
 */
export function proposalBuilderViewSaid(t: T, facts: BuilderViewFacts, format: BuilderSaidFormat) {
  if (facts.read.kind !== 'ready') return null;
  const { frame } = facts.read.value;
  const { detail } = facts;
  const said = proposalBuilderSaid(t, {
    frame,
    document: detail?.document ?? null,
    rights: detail,
    format,
  });
  /* Who can change the plan or the company's facts is named only to a viewer who cannot. */
  const owner = detail?.companyFactsBy?.name;
  const mayPlan = detail?.rights.managesBilling === true;
  const check = proposalBuilderCheckSaid(t, {
    check: facts.check,
    frame,
    said,
    format,
    versionsMade: detail?.versions.length ?? 0,
    ...planCountsOf(facts.plan, facts.check.failure),
    ...(mayPlan || owner === undefined ? {} : { planOwner: owner }),
    missing: (detail?.missingCompanyFacts ?? []).filter(isMissingCompanyFact),
    ...(owner === undefined ? {} : { factsOwner: owner }),
  });
  const made = facts.ready?.made ?? null;
  return {
    ...said,
    sheets: sheetsSaid(t, facts),
    check,
    marks: facts.check.asked === true ? marksOf(check.blocks, frame.current) : {},
    ready:
      made === null
        ? null
        : proposalReadyWords(t, {
            name: said.name,
            number: made.number,
            version: made.version,
            amount: frame.payableText ?? '',
            pages: builderSheets(frame).count,
          }),
  };
}

export type ProposalBuilderViewSaid = NonNullable<ReturnType<typeof proposalBuilderViewSaid>>;
