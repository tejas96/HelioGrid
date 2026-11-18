import type { MissingCompanyFact, TranslatedText } from '@heliogrid/contracts';
import { customerShortNameOf, type DealSegment, FIGURE_SLOT, type Read } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { assembled } from './assembled';
import { designPreviewWord } from './lead-designs';
import { proposalPageHeadWords } from './proposal-screens-words';

/**
 * The words around the builder (`packages/ui`'s `ProposalStartSheet`, `ProposalCheckSheet`,
 * `ProposalReady`): how a proposal starts, what stops or follows Generate, and the screen after it.
 * A finding's own sentence is `proposalCheckBlockWords`' and `proposalCheckWarningWords`'; every figure in it is the server's text.
 */

type T = Translator['t'];

const START = {
  title: /*i18n*/ { id: 'New proposal' },
  how: /*i18n*/ { id: 'How to build it' },
  quick: /*i18n*/ { id: 'Quick · 4 steps' },
  quickLine: /*i18n*/ {
    id: 'Size, price, parts and client. The rest uses your company defaults. Best for a home.',
  },
  full: /*i18n*/ { id: 'Full · 11 steps' },
  fullLine: /*i18n*/ { id: 'Check every page yourself. Best for a factory or an office.' },
  design: /*i18n*/ { id: 'With 3D design' },
  designLine: /*i18n*/ { id: 'Draw the roof. The system sizes it and fills the proposal.' },
  or: /*i18n*/ { id: 'or start from' },
  sameAs: /*i18n*/ { id: 'Same as {name}' },
  sourceLine: /*i18n*/ {
    id: '{summary} · {standing, select, draft {saved {when}} ready {made {when}} accepted {accepted} declined {declined} won {won} withdrawn {withdrawn} replaced {replaced} other {sent {when}}}',
  },
  copyLine: /*i18n*/ {
    id: 'A copy brings every step filled. {name}’s details come from this lead.',
  },
  start: /*i18n*/ { id: 'Start' },
  loading: /*i18n*/ { id: 'Loading your recent proposals' },
  close: /*i18n*/ { id: 'Close' },
} as const;

/** A company fact the document leaves out while the company has not added it (`M06-17`). */
export type { MissingCompanyFact };

const MISSING: Record<MissingCompanyFact, { id: string }> = {
  bank_details: /*i18n*/ { id: 'bank details' },
  logo: /*i18n*/ { id: 'logo' },
  tax_registration: /*i18n*/ { id: 'tax number' },
  address: /*i18n*/ { id: 'address' },
};

/** A fact a newer api names is not one these words know: it is left unsaid, never guessed. */
export const isMissingCompanyFact = (fact: string): fact is MissingCompanyFact => fact in MISSING;

const CHECK = {
  fix: /*i18n*/ { id: '{count, plural, one {Fix # thing first} other {Fix # things first}}' },
  readyCheck: /*i18n*/ { id: 'Ready. Check these first' },
  ready: /*i18n*/ { id: 'Ready to generate' },
  limit: /*i18n*/ { id: 'This month’s proposals are used' },
  checking: /*i18n*/ { id: 'Checking the proposal' },
  thenCheck: /*i18n*/ { id: 'Then check · {count}' },
  toCheck: /*i18n*/ { id: 'To check · {count}' },
  goTo: /*i18n*/ { id: 'Go to {step}' },
  generate: /*i18n*/ { id: 'Generate proposal' },
  generateAnyway: /*i18n*/ { id: 'Generate anyway' },
  noteLabel: /*i18n*/ { id: 'What changed, and why' },
  noteHint: /*i18n*/ {
    id: 'Kept with version {version}. The versions page shows it first.',
  },
  noteMissing: /*i18n*/ { id: 'Say what changed before you generate.' },
  noteBlocked: /*i18n*/ { id: 'Red items stop Generate. Amber items only warn.' },
  noteGenerating: /*i18n*/ {
    id: '{pages, plural, one {Making # page and a number…} other {Making # pages and a number…}}',
  },
  noteClear: /*i18n*/ {
    id: 'It gets its number now. You can still make a new version later.',
  },
  noteLimit: /*i18n*/ { id: 'Your draft is saved. Nothing is lost.' },
  generating: /*i18n*/ { id: 'Generating' },
  quickLine: /*i18n*/ {
    id: 'Quick mode used your company’s timeline, payment terms, and terms and conditions.',
  },
  leftOutOwner: /*i18n*/ {
    id: 'Left out, as the company has not added them: {facts}. Add them in Business profile.',
  },
  leftOutOther: /*i18n*/ {
    id: 'Left out, as the company has not added them: {facts}. {owner} can add them.',
  },
  summary: /*i18n*/ { id: '{size} kW · {amount}' },
  facts: /*i18n*/ {
    id: '{pages, plural, one {# page} other {# pages}} · {language} · version {version}',
  },
  used: /*i18n*/ { id: '{used} of {limit} proposals made this month' },
  resets: /*i18n*/ { id: 'The count starts again on {date}.' },
  usedAll: /*i18n*/ { id: 'Every proposal in this plan’s month is made.' },
  resetsSoon: /*i18n*/ { id: 'The count starts again with the next month of the plan.' },
  stillWorks: /*i18n*/ { id: 'Still works' },
  worksEdit: /*i18n*/ { id: 'Edit and share the proposals you have' },
  worksRead: /*i18n*/ { id: 'Read and download every proposal' },
  worksLinks: /*i18n*/ { id: 'Customers open and answer their links' },
  whoOwner: /*i18n*/ { id: 'A bigger plan lets you generate now.' },
  whoOther: /*i18n*/ { id: '{name} can change the plan.' },
  seePlans: /*i18n*/ { id: 'See plans' },
  close: /*i18n*/ { id: 'Close' },
} as const;

/** `name` is the customer's full name: the sheet says their short name (`customerShortNameOf`). */
export function proposalStartWords(
  t: T,
  facts: { readonly name: string; readonly segment: DealSegment | null },
) {
  return {
    closeLabel: t(START.close),
    title: t(START.title),
    how: t(START.how),
    modes: {
      quick: { title: t(START.quick), line: t(START.quickLine) },
      full: { title: t(START.full), line: t(START.fullLine) },
      design: { title: t(START.design), line: t(START.designLine) },
    },
    /** Where the 3D option will show a model: the placeholder until the studio draws one. */
    designPreview: designPreviewWord(t),
    or: t(START.or),
    /** A recent proposal's row — `Same as Meena Deshpande`. */
    sameAs: (customer: string) => t(START.sameAs, { name: customer }),
    copyLine: t(START.copyLine, { name: customerShortNameOf(facts.name, facts.segment) }),
    start: t(START.start),
    loading: t(START.loading),
  };
}

/** One of the person's recent proposals, as the start sheet reads it. */
interface StartSourceRow {
  readonly id: string;
  readonly customerName: string | null;
  readonly capacityKw: number | null;
  readonly payable: string | null;
  readonly standing: string;
  readonly latest: { readonly at: string };
}

/**
 * The start sheet's *or start from* rows — `Same as Meena Deshpande` over `5 kW · ₹3,10,000 · sent
 * 4 days ago` —
 * one per recent proposal that names its customer; `null` while they are read or failed.
 */
export function proposalStartSources(
  t: T,
  formats: {
    readonly money: (amount: string) => string;
    readonly number: (value: number) => string;
    readonly ago: (instant: string) => string;
  },
  recent: Read<readonly StartSourceRow[]>,
) {
  if (recent.kind === 'empty') return [];
  if (recent.kind !== 'ready') return null;
  const { summary } = proposalPageHeadWords(t, formats);
  return recent.value.flatMap((row) =>
    row.customerName === null
      ? []
      : [
          {
            id: row.id,
            title: t(START.sameAs, { name: row.customerName }),
            line: t(START.sourceLine, {
              summary: summary({
                customerName: null,
                capacityKw: row.capacityKw,
                payable: row.payable,
              }),
              standing: row.standing,
              when: formats.ago(row.latest.at),
            }),
          },
        ],
  );
}

/** How the check stands, as its words need it. */
export type ProposalCheckFacts =
  | { readonly kind: 'checking' }
  | {
      readonly kind: 'blocked';
      readonly blocks: number;
      readonly warnings: number;
      /** The first block's step, by its short word. */
      readonly firstStep: string;
    }
  | {
      readonly kind: 'clear';
      readonly warnings: number;
      readonly generating: boolean;
      readonly pages: number;
    }
  | { readonly kind: 'limit' };

export interface ProposalCheckWordsFacts {
  readonly check: ProposalCheckFacts;
  readonly quick: boolean;
  /** The plan's count for the cycle, where the limit was met. */
  /** The count is absent where the refusal carried none; so is the day the count starts again. */
  readonly plan?: { counts?: { used: number; limit: number }; resetsOn?: string };
  /** Who can change the plan, for a viewer who cannot; absent for one who can. */
  readonly planOwner?: string;
  /** The company facts the document leaves out; said under Quick mode's summary (`T-M06-002`). */
  readonly missing?: readonly MissingCompanyFact[];
  /** Who can add them, for a viewer who cannot; absent for one who can. */
  readonly factsOwner?: string;
}

/**
 * What Quick mode hides at Generate (`T-M06-002` ruling): the steps it used the company's
 * defaults for, and each company fact the document will leave out with who can add it.
 */
function quickLineOf(t: T, facts: ProposalCheckWordsFacts): TranslatedText {
  const used = t(CHECK.quickLine);
  const missing = facts.missing ?? [];
  if (missing.length === 0) return used;
  const names = missing.map((fact) => t(MISSING[fact])).join(', ');
  const leftOut =
    facts.factsOwner === undefined
      ? t(CHECK.leftOutOwner, { facts: names })
      : t(CHECK.leftOutOther, { facts: names, owner: facts.factsOwner });
  return assembled(`${used} ${leftOut}`);
}

function checkTitle(t: T, check: ProposalCheckFacts) {
  if (check.kind === 'limit') return t(CHECK.limit);
  if (check.kind === 'checking') return t(CHECK.checking);
  if (check.kind === 'blocked') return t(CHECK.fix, { count: check.blocks });
  return t(check.warnings > 0 ? CHECK.readyCheck : CHECK.ready);
}

function checkNote(t: T, check: ProposalCheckFacts) {
  if (check.kind === 'limit') return t(CHECK.noteLimit);
  if (check.kind === 'blocked' || check.kind === 'checking') return t(CHECK.noteBlocked);
  return check.generating ? t(CHECK.noteGenerating, { pages: check.pages }) : t(CHECK.noteClear);
}

/** The check sheet's words for its state. */
export function proposalCheckWords(t: T, facts: ProposalCheckWordsFacts) {
  const { check, plan } = facts;
  const warnings = check.kind === 'blocked' || check.kind === 'clear' ? check.warnings : 0;
  return {
    closeLabel: t(CHECK.close),
    title: checkTitle(t, check),
    warningsOver: t(check.kind === 'blocked' ? CHECK.thenCheck : CHECK.toCheck, {
      count: warnings,
    }),
    goToFirst: t(CHECK.goTo, { step: check.kind === 'blocked' ? check.firstStep : '' }),
    generate: t(CHECK.generate),
    generateAnyway: t(CHECK.generateAnyway),
    note: checkNote(t, check),
    generating: t(CHECK.generating),
    ...(facts.quick ? { quickLine: quickLineOf(t, facts) } : {}),
    checking: t(CHECK.checking),
    /**
     * The summary's two lines: the size and the payable, then pages, language and version. The
     * amount stands as `FIGURE_SLOT`: the sheet sets it in the money face where the words put it.
     */
    summaryLine: (size: string) => t(CHECK.summary, { size, amount: FIGURE_SLOT }),
    summaryFacts: (pages: number, language: string, version: number) =>
      t(CHECK.facts, { pages, language, version }),
    /** From version 2 on: the note a version carries (`M06-42`). */
    changeNote: (version: number) => ({
      label: t(CHECK.noteLabel),
      hint: t(CHECK.noteHint, { version }),
      missing: t(CHECK.noteMissing),
    }),
    limit: {
      used: plan?.counts === undefined ? t(CHECK.usedAll) : t(CHECK.used, plan.counts),
      resets:
        plan?.resetsOn === undefined
          ? t(CHECK.resetsSoon)
          : t(CHECK.resets, { date: plan.resetsOn }),
      stillWorks: t(CHECK.stillWorks),
      works: [t(CHECK.worksEdit), t(CHECK.worksRead), t(CHECK.worksLinks)],
      who:
        facts.planOwner === undefined
          ? t(CHECK.whoOwner)
          : t(CHECK.whoOther, { name: facts.planOwner }),
      seePlans: t(CHECK.seePlans),
      close: t(CHECK.close),
    },
  };
}
