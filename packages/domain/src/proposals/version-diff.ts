import type { MinorUnits } from '../money/minor-units';
import { sameContent } from '../tenancy/settings-page';
import type { ComponentCategory } from './component-category';
import type { ProposalVersionSnapshot } from './snapshot';
import { PROPOSAL_PAGES, type ProposalPage } from './steps';
import { VERSION_FACTS, type VersionFact } from './version-facts';

/**
 * What moved between two versions (`M06-42`, `T-M06-016`): only the facts that changed, each as
 * its old value and its new one, and how many pages did not change. On `./server` — it hands out
 * money figures, read from the two snapshots as they were frozen and never worked out again.
 */

/** A fact's value in one version, in the unit its kind names; `absent` where the version has none. */
export type VersionFactValue =
  | { readonly kind: 'money'; readonly amount: MinorUnits }
  | { readonly kind: 'power'; readonly kw: number }
  | { readonly kind: 'energy'; readonly kwh: number }
  /** A closed word a screen translates — a system type, a maintenance kind, on or off. */
  | { readonly kind: 'word'; readonly word: string }
  /** The tenant's own words, shown as written — brand names, a split, a count of steps. */
  | { readonly kind: 'text'; readonly text: string }
  /** Something whose content changed and has no short value — the terms, the timeline. */
  | { readonly kind: 'content' }
  | { readonly kind: 'absent' };

export interface VersionChange {
  readonly fact: VersionFact;
  readonly from: VersionFactValue;
  readonly to: VersionFactValue;
}

export interface VersionDiff {
  readonly changes: readonly VersionChange[];
  /** Pages the newer version prints whose facts all stayed as they were. */
  readonly pagesUnchanged: number;
}

const ABSENT: VersionFactValue = { kind: 'absent' };

function money(amount: MinorUnits | null | undefined): VersionFactValue {
  return amount === null || amount === undefined ? ABSENT : { kind: 'money', amount };
}

function brands(snapshot: ProposalVersionSnapshot, among: readonly ComponentCategory[]) {
  const names = snapshot.fields.components
    .filter((line) => among.includes(line.category))
    .map((line) => (line.count === null ? line.brand : `${line.count} × ${line.brand}`));
  return names.length === 0 ? ABSENT : ({ kind: 'text', text: names.join(' · ') } as const);
}

function split(snapshot: ProposalVersionSnapshot): VersionFactValue {
  const shares = snapshot.fields.payment.tranches.map((tranche) => tranche.share / 100);
  return shares.length === 0 ? ABSENT : { kind: 'text', text: shares.join('/') };
}

function maintenance(snapshot: ProposalVersionSnapshot): VersionFactValue {
  const plan = snapshot.fields.system.maintenance;
  return plan.kind === 'years'
    ? { kind: 'text', text: String(plan.years) }
    : { kind: 'word', word: plan.kind };
}

const CONTENT_FACTS = [
  'timeline',
  'terms',
  'cover',
  'proposal_type',
  'about',
  'client',
  'bank',
] as const satisfies readonly VersionFact[];
type ContentFact = (typeof CONTENT_FACTS)[number];
type ValuedFact = Exclude<VersionFact, ContentFact>;

/** A fact's short value in one version — what a change row shows on each side of its arrow. */
const VALUE_OF: Readonly<
  Record<ValuedFact, (snapshot: ProposalVersionSnapshot) => VersionFactValue>
> = {
  payable: (snapshot) => money(snapshot.money.payable),
  discount: (snapshot) => money(snapshot.money.discount === 0 ? null : snapshot.money.discount),
  capacity: ({ fields }) =>
    fields.system.capacityKw === null ? ABSENT : { kind: 'power', kw: fields.system.capacityKw },
  system_type: ({ fields }) => ({ kind: 'word', word: fields.system.systemType }),
  battery: ({ fields }) =>
    fields.system.battery === null
      ? ABSENT
      : { kind: 'energy', kwh: fields.system.battery.capacityKwh },
  panels: (snapshot) => brands(snapshot, ['panel']),
  inverters: (snapshot) => brands(snapshot, ['inverter']),
  other_parts: (snapshot) => brands(snapshot, ['cable', 'electrical', 'structure', 'battery']),
  incentive: (snapshot) => money(snapshot.money.incentive?.amount),
  yearly_generation: ({ generation }) =>
    generation === null ? ABSENT : { kind: 'energy', kwh: generation.yearlyKwh },
  yearly_saving: (snapshot) => money(snapshot.savings?.yearly),
  payment_plan: split,
  maintenance,
  emi_example: (snapshot) => money(snapshot.emi?.monthly),
};

/** A fact with no short value: its content is compared, and the row says only that it changed. */
const CONTENT_OF: Readonly<Record<ContentFact, (snapshot: ProposalVersionSnapshot) => unknown>> = {
  timeline: ({ fields }) => fields.timeline,
  terms: ({ fields }) => fields.terms,
  cover: ({ fields }) => fields.company.coverPicture,
  proposal_type: ({ fields }) => fields.company.proposalType,
  about: ({ fields }) => fields.achievements,
  client: ({ deal }) => [deal.clientName, deal.siteAddress],
  bank: ({ fields, company }) => [fields.bank, company.bankDetails],
};

function isContentFact(fact: VersionFact): fact is ContentFact {
  return (CONTENT_FACTS as readonly VersionFact[]).includes(fact);
}

const CHANGED_CONTENT: VersionFactValue = { kind: 'content' };

function changeOf(
  fact: VersionFact,
  from: ProposalVersionSnapshot,
  to: ProposalVersionSnapshot,
): VersionChange | null {
  if (isContentFact(fact)) {
    return sameContent(CONTENT_OF[fact](from), CONTENT_OF[fact](to))
      ? null
      : { fact, from: CHANGED_CONTENT, to: CHANGED_CONTENT };
  }
  const before = VALUE_OF[fact](from);
  const after = VALUE_OF[fact](to);
  return sameContent(before, after) ? null : { fact, from: before, to: after };
}

/** The pages a fact prints on: a page none of whose facts moved did not change. */
const PAGES_OF: Readonly<Record<VersionFact, readonly ProposalPage[]>> = {
  payable: ['cover', 'price'],
  discount: ['price'],
  capacity: ['cover', 'system', 'price'],
  system_type: ['cover', 'system'],
  battery: ['system', 'price'],
  panels: ['system', 'price'],
  inverters: ['system', 'price'],
  other_parts: ['system', 'price'],
  incentive: ['price', 'savings'],
  yearly_generation: ['cover', 'generation', 'savings'],
  yearly_saving: ['cover', 'savings'],
  payment_plan: ['price'],
  timeline: ['timeline'],
  terms: ['terms'],
  maintenance: ['price'],
  emi_example: ['price'],
  cover: ['cover'],
  /* The cover line says whether the customer pays for the system or for its power. */
  proposal_type: ['cover'],
  about: ['about'],
  /* The client's name is on the cover and in every page's foot. */
  client: PROPOSAL_PAGES,
  bank: ['bank'],
};

/** What moved from `from` to `to`, in `VERSION_FACTS` order, and how many of `to`'s pages stayed. */
export function versionDiff(
  from: ProposalVersionSnapshot,
  to: ProposalVersionSnapshot,
): VersionDiff {
  const changes = VERSION_FACTS.flatMap((fact): VersionChange[] => {
    const change = changeOf(fact, from, to);
    return change === null ? [] : [change];
  });
  const touched = new Set(changes.flatMap((change) => PAGES_OF[change.fact]));
  return {
    changes,
    pagesUnchanged: to.pages.filter((page) => !touched.has(page)).length,
  };
}
