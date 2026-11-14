import type { TranslatedText } from '@heliogrid/contracts';
import { type GenerateVerdict, LINK_TEXT_LIMIT, type ProposalStep } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import {
  proposalCheckBlockWords,
  proposalCheckSkippedWords,
  proposalCheckWarningWords,
} from './proposal-builder-findings';
import { type MissingCompanyFact, proposalCheckWords } from './proposal-builder-flow';
import { proposalFieldRefusalWords } from './proposal-builder-refusals';
import {
  type BuilderSaidFormat,
  type BuilderSaidFrame,
  builderSheets,
  type ProposalBuilderSaid,
} from './proposal-builder-said';
import { type ProposalActFailureLike, proposalActFailureWords } from './proposal-screens-words';

type T = Translator['t'];

/** Why Generate did not finish, as `packages/data` hands it out, by shape. */
export type BuilderCheckFailureLike =
  | { readonly kind: 'not_ready' }
  | { readonly kind: 'unsaved' }
  /** A typed value the server refused holds Generate back: the step it sits on, and why. */
  | {
      readonly kind: 'refused_field';
      readonly step: ProposalStep | null;
      readonly failure: ProposalActFailureLike;
    }
  | {
      readonly kind: 'billing';
      readonly blocked: {
        readonly reason: string;
        readonly resetsAt?: string | null;
        /** "40 of 40": the refusal's own count, for a reader the usage read is closed to. */
        readonly used?: number;
        readonly limit?: number;
      } | null;
    }
  | Exclude<ProposalActFailureLike, { readonly kind: 'billing' }>;

export interface BuilderCheckInput {
  readonly check: {
    readonly checking: boolean;
    readonly verdict: GenerateVerdict | null;
    readonly generating: boolean;
    readonly failure: BuilderCheckFailureLike | null;
    readonly noteMissing: boolean;
    /** Generate was asked for: a step marks the fields its blocks name. */
    readonly asked?: boolean;
  };
  readonly frame: Pick<
    BuilderSaidFrame,
    'quick' | 'pages' | 'page' | 'pageAt' | 'payableText' | 'fieldSet'
  >;
  readonly said: Pick<ProposalBuilderSaid, 'names' | 'partsWords' | 'screenWords' | 'shared'>;
  readonly format: BuilderSaidFormat;
  /** The versions this proposal already holds: the next one is this count plus one. */
  readonly versionsMade: number;
  /** The plan's count for the cycle, where the viewer may read it. */
  readonly planCounts?: { readonly used: number; readonly limit: number };
  /** Who can change the plan, for a viewer who cannot; absent for one who can. */
  readonly planOwner?: string;
  /** The company facts the document leaves out, and who can add them where the viewer cannot. */
  readonly missing?: readonly MissingCompanyFact[];
  readonly factsOwner?: string;
}

/**
 * The plan's count as the check prints it (`T-M06-028`): the refusal's own count where it carries
 * one — every reader gets it — else the usage read's; a plan with no limit, or none read, prints none.
 */
export function planCountsOf(
  plan: { readonly used: number; readonly limit: number | null } | null,
  failure: BuilderCheckFailureLike | null = null,
): Pick<BuilderCheckInput, 'planCounts'> {
  const blocked = failure?.kind === 'billing' ? failure.blocked : null;
  if (blocked?.used !== undefined && blocked.limit !== undefined) {
    return { planCounts: { used: blocked.used, limit: blocked.limit } };
  }
  return plan === null || plan.limit === null
    ? {}
    : { planCounts: { used: plan.used, limit: plan.limit } };
}

/** One finding in words, with the step that fixes it: the caller binds the press. */
export interface BuilderCheckRow {
  readonly key: string;
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  readonly step: ProposalStep;
  /** The fields its step marks, by their paths in the field set. */
  readonly fields: readonly string[];
}

type CheckStanding = 'limit' | 'checking' | 'blocked' | 'clear';

function standingOf(check: BuilderCheckInput['check'], blocked: boolean): CheckStanding {
  if (check.failure?.kind === 'billing') return 'limit';
  if (check.checking || check.verdict === null) return 'checking';
  return blocked ? 'blocked' : 'clear';
}

function rowsOf(t: T, input: BuilderCheckInput) {
  const { verdict } = input.check;
  const { names, partsWords } = input.said;
  const facts = {
    kind: partsWords.kind,
    step: (step: ProposalStep) => names[step].title,
    number: input.format.number,
    amount: input.format.amountPlain,
  };
  const blocks: BuilderCheckRow[] = (verdict?.blocks ?? []).map((block, at) => ({
    key: `block-${at}`,
    ...proposalCheckBlockWords(t, facts, block),
    step: block.step,
    fields: block.fields,
  }));
  const warnings: BuilderCheckRow[] = [
    ...(verdict?.warnings ?? []).map((warning, at) => ({
      key: `warning-${at}`,
      ...proposalCheckWarningWords(t, facts, warning),
      step: warning.step,
      fields: warning.fields,
    })),
    ...(verdict?.skipped ?? []).map((skipped, at) => ({
      key: `skipped-${at}`,
      ...proposalCheckSkippedWords(t, skipped),
      step: skipped.step,
      fields: skipped.fields,
    })),
  ];
  return { blocks, warnings };
}

/**
 * Why Generate came back undone, said on the sheet; the checklist and the plan's limit say their
 * own. A refused value is named by its step, with the server's reason (`F8-36`).
 */
export function builderCheckFailureWords(
  t: T,
  failure: BuilderCheckFailureLike | null,
  said: Pick<ProposalBuilderSaid, 'names' | 'shared'>,
): TranslatedText | null {
  if (failure === null || failure.kind === 'billing' || failure.kind === 'not_ready') return null;
  if (failure.kind === 'unsaved') return said.shared.notSaved;
  if (failure.kind !== 'refused_field') return proposalActFailureWords(t, failure);
  const reason =
    proposalFieldRefusalWords(t, failure.failure) ?? proposalActFailureWords(t, failure.failure);
  return failure.step === null
    ? reason
    : t(REFUSED_IN_STEP, { step: said.names[failure.step].title, reason });
}

const REFUSED_IN_STEP = /*i18n*/ { id: 'Not saved in {step}: {reason}' };

/** When the plan's cycle starts again, and its count where the viewer may read it (`T-M06-028`). */
function planOf(input: BuilderCheckInput) {
  const { failure } = input.check;
  const blocked = failure?.kind === 'billing' ? failure.blocked : null;
  const resets = blocked?.reason === 'cap' ? (blocked.resetsAt ?? null) : null;
  if (resets === null && input.planCounts === undefined) return {};
  return {
    plan: {
      ...(input.planCounts === undefined ? {} : { counts: input.planCounts }),
      ...(resets === null ? {} : { resetsOn: input.format.date(resets) }),
    },
  };
}

/**
 * The check before Generate, in words (`M06-22`, `M06-23`, `T-M06-022`, `T-M06-028`): how it
 * stands, every block and warning as a row with its step, the summary's lines, the note a version
 * from the second on must carry (`M06-42`), and why a Generate came back undone.
 */
export function proposalBuilderCheckSaid(t: T, input: BuilderCheckInput) {
  const { check, frame } = input;
  const { blocks, warnings } = rowsOf(t, input);
  const standing = standingOf(check, blocks.length > 0);
  const pages = builderSheets(frame).count;
  const firstStep = blocks[0] === undefined ? '' : input.said.names[blocks[0].step].title;
  const version = input.versionsMade + 1;
  const words = proposalCheckWords(t, {
    check:
      standing === 'blocked'
        ? { kind: standing, blocks: blocks.length, warnings: warnings.length, firstStep }
        : standing === 'clear'
          ? { kind: standing, warnings: warnings.length, generating: check.generating, pages }
          : { kind: standing },
    quick: frame.quick,
    ...planOf(input),
    ...(input.planOwner === undefined ? {} : { planOwner: input.planOwner }),
    ...(input.missing === undefined ? {} : { missing: input.missing }),
    ...(input.factsOwner === undefined ? {} : { factsOwner: input.factsOwner }),
  });
  const note = words.changeNote(version);
  return {
    standing,
    words,
    blocks,
    warnings,
    failure: builderCheckFailureWords(t, input.check.failure, input.said),
    summary: {
      line: words.summaryLine(input.format.number(frame.fieldSet.system.capacityKw ?? 0)),
      amount: frame.payableText ?? '',
      facts: words.summaryFacts(pages, input.said.screenWords.language, version),
    },
    /** The note's words; `error` only once Generate was pressed with it still empty. */
    changeNote: {
      label: note.label,
      hint: note.hint,
      maxLength: LINK_TEXT_LIMIT,
      ...(check.noteMissing ? { error: note.missing } : {}),
    },
  };
}

export type ProposalBuilderCheckSaid = ReturnType<typeof proposalBuilderCheckSaid>;
