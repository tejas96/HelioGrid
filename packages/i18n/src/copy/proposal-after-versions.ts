import type { ProposalVersion, ProposalVersionSummary } from '@heliogrid/contracts';
import type { VersionFact } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { maintenanceValue, systemTypeWord } from './proposal-builder-system';

type T = Translator['t'];

/** What the caller holds for the tenant: money, a size, a moment, as the market prints them. */
export interface ProposalVersionsFormats {
  /** `beside`: the other amounts of the same column, which share one form. */
  readonly money: (amount: string, beside?: readonly string[]) => string;
  readonly number: (value: number) => string;
  readonly when: (instant: string) => string;
}

const VERSIONS = {
  changedTitle: /*i18n*/ { id: 'What changed in version {version}' },
  firstTitle: /*i18n*/ { id: 'Version {version}' },
  note: /*i18n*/ { id: '“{note}”' },
  whoShared: /*i18n*/ { id: '{name} · {when} · shared with the customer' },
  whoNotShared: /*i18n*/ {
    id: '{name} · {when} · not shared yet, so the customer still sees the earlier version',
  },
  whenShared: /*i18n*/ { id: '{when} · shared with the customer' },
  whenNotShared: /*i18n*/ { id: '{when} · not shared yet' },
  whoInForce: /*i18n*/ { id: '{name} · {when} · the customer’s link shows this plan' },
  whoNotInForce: /*i18n*/ { id: '{name} · {when} · not in force yet' },
  whenInForce: /*i18n*/ { id: '{when} · the customer’s link shows this plan' },
  whenNotInForce: /*i18n*/ { id: '{when} · not in force yet' },
  unchanged: /*i18n*/ {
    id: '{count, plural, =0 {Every page changed} one {# other page did not change} other {# other pages did not change}}',
  },
  mark: /*i18n*/ { id: 'v{version}' },
  versionTitle: /*i18n*/ { id: 'Version {version} · {amount}' },
  generated: /*i18n*/ { id: 'Generated {when} · not shared yet' },
  shared: /*i18n*/ { id: 'Shared {when} · kept exactly as sent' },
  accepted: /*i18n*/ { id: 'Accepted {when} · kept exactly as sent' },
  declined: /*i18n*/ { id: 'Declined {when} · kept exactly as sent' },
  changeAsked: /*i18n*/ { id: 'Change asked {when} · kept exactly as sent' },
  inForce: /*i18n*/ { id: 'In force on the project · kept exactly as sent' },
  share: /*i18n*/ { id: 'Share' },
  view: /*i18n*/ { id: 'View' },
  putInForce: /*i18n*/ { id: 'Put in force' },
  hint: /*i18n*/ {
    id: 'A version that was sent never changes. A new price always makes a new version.',
  },
  hintWon: /*i18n*/ {
    id: 'The deal is won, so the link takes no new answer. You record that the customer agreed.',
  },
  none: /*i18n*/ { id: 'No version yet. Generate makes version 1.' },
  loading: /*i18n*/ { id: 'Loading the versions' },
  failedTitle: /*i18n*/ { id: 'The versions did not load' },
  failedMessage: /*i18n*/ { id: 'Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
  nothing: /*i18n*/ { id: 'None' },
  changed: /*i18n*/ { id: 'Changed' },
  before: /*i18n*/ { id: 'As it was' },
  kw: /*i18n*/ { id: '{size} kW' },
  kwh: /*i18n*/ { id: '{amount} kWh' },
} as const;

const FACT: Record<VersionFact, MessageRef> = {
  payable: /*i18n*/ { id: 'Price' },
  discount: /*i18n*/ { id: 'Discount' },
  capacity: /*i18n*/ { id: 'System size' },
  system_type: /*i18n*/ { id: 'System type' },
  battery: /*i18n*/ { id: 'Battery' },
  panels: /*i18n*/ { id: 'Panels' },
  inverters: /*i18n*/ { id: 'Inverter' },
  other_parts: /*i18n*/ { id: 'Other parts' },
  incentive: /*i18n*/ { id: 'Subsidy' },
  yearly_generation: /*i18n*/ { id: 'Generation a year' },
  yearly_saving: /*i18n*/ { id: 'Saving a year' },
  payment_plan: /*i18n*/ { id: 'Payment plan' },
  timeline: /*i18n*/ { id: 'Timeline' },
  terms: /*i18n*/ { id: 'Terms' },
  maintenance: /*i18n*/ { id: 'Maintenance' },
  emi_example: /*i18n*/ { id: 'EMI example' },
  cover: /*i18n*/ { id: 'Cover' },
  proposal_type: /*i18n*/ { id: 'Proposal type' },
  about: /*i18n*/ { id: 'Achievements' },
  client: /*i18n*/ { id: 'Client' },
  bank: /*i18n*/ { id: 'Bank details' },
};

type Change = NonNullable<ProposalVersion['diff']>['changes'][number];
type Value = Change['from'];

/**
 * A coded value in the shipped vocabulary's words — `On-grid`, `Not included`, `3-year plan
 * included` — never its code; `null` for a fact whose value is not a code.
 */
function vocabularyWord(t: T, fact: string, value: Value) {
  if (fact === 'system_type' && value.kind === 'word' && value.word !== undefined) {
    return systemTypeWord(t, value.word);
  }
  if (fact !== 'maintenance') return null;
  if (value.kind === 'word' && value.word !== undefined) {
    return maintenanceValue(t, { kind: value.word, years: null });
  }
  if (value.kind === 'text' && value.text !== undefined) {
    return maintenanceValue(t, { kind: 'years', years: Number(value.text) });
  }
  return null;
}

/**
 * One side of a change, printed: a figure through the market's format, words as sent. An amount
 * shares one form with the other side's, so a paisa on one side keeps it on both.
 */
function printedValue(
  t: T,
  formats: ProposalVersionsFormats,
  value: Value,
  side: 'from' | 'to',
  other: Value,
) {
  switch (value.kind) {
    case 'money': {
      const beside = other.kind === 'money' && other.amount !== undefined ? [other.amount] : [];
      return value.amount === undefined ? '' : formats.money(value.amount, beside);
    }
    case 'power':
      return value.kw === undefined ? '' : t(VERSIONS.kw, { size: formats.number(value.kw) });
    case 'energy':
      return value.kwh === undefined ? '' : t(VERSIONS.kwh, { amount: formats.number(value.kwh) });
    case 'word':
      return value.word ?? '';
    case 'text':
      return value.text ?? '';
    case 'content':
      /* Long content — the terms, a timeline — is said to have changed, never printed twice. */
      return t(side === 'from' ? VERSIONS.before : VERSIONS.changed);
    case 'absent':
      return t(VERSIONS.nothing);
  }
}

function versionLine(t: T, formats: ProposalVersionsFormats, version: ProposalVersionSummary) {
  if (version.inForce) return t(VERSIONS.inForce);
  const at = version.answeredAt === null ? '' : formats.when(version.answeredAt);
  if (version.answer === 'accept') return t(VERSIONS.accepted, { when: at });
  if (version.answer === 'decline') return t(VERSIONS.declined, { when: at });
  if (version.answer === 'negotiate') return t(VERSIONS.changeAsked, { when: at });
  return version.sharedAt === null
    ? t(VERSIONS.generated, { when: formats.when(version.generatedAt) })
    : t(VERSIONS.shared, { when: formats.when(version.sharedAt) });
}

/**
 * Who made the version and what the customer sees of it. Before Won the link serves the latest
 * shared version; once won it shows the project and the plan in force, so the line says that.
 */
function whoLine(
  t: T,
  formats: ProposalVersionsFormats,
  version: ProposalVersionSummary,
  won: boolean,
) {
  const when = formats.when(version.generatedAt);
  const shared = version.sharedAt !== null;
  const [named, unnamed] = won
    ? version.inForce
      ? [VERSIONS.whoInForce, VERSIONS.whenInForce]
      : [VERSIONS.whoNotInForce, VERSIONS.whenNotInForce]
    : shared
      ? [VERSIONS.whoShared, VERSIONS.whenShared]
      : [VERSIONS.whoNotShared, VERSIONS.whenNotShared];
  if (version.generatedBy === null) return t(unnamed, { when });
  return t(named, { name: version.generatedBy.name, when });
}

/** `ProposalVersions`' words (`SCR-M06-16`). */
export function proposalVersionsWords(t: T, formats: ProposalVersionsFormats) {
  return {
    changedTitle: (version: number) =>
      t(version > 1 ? VERSIONS.changedTitle : VERSIONS.firstTitle, { version }),
    note: (note: string) => t(VERSIONS.note, { note }),
    whoLine: (version: ProposalVersionSummary, won: boolean) => whoLine(t, formats, version, won),
    change: (change: Change) => {
      const name = (FACT as Record<string, MessageRef | undefined>)[change.fact];
      return {
        name: name === undefined ? shownAsSent(change.fact.replace(/_/g, ' ')) : t(name),
        from:
          vocabularyWord(t, change.fact, change.from) ??
          printedValue(t, formats, change.from, 'from', change.to),
        to:
          vocabularyWord(t, change.fact, change.to) ??
          printedValue(t, formats, change.to, 'to', change.from),
      };
    },
    unchanged: (count: number) => t(VERSIONS.unchanged, { count }),
    mark: (version: number) => t(VERSIONS.mark, { version }),
    versionTitle: (version: ProposalVersionSummary) =>
      t(VERSIONS.versionTitle, {
        version: version.version,
        amount: formats.money(version.payable),
      }),
    versionLine: (version: ProposalVersionSummary) => versionLine(t, formats, version),
    share: t(VERSIONS.share),
    view: t(VERSIONS.view),
    putInForce: t(VERSIONS.putInForce),
    hint: (won: boolean) => t(won ? VERSIONS.hintWon : VERSIONS.hint),
    none: t(VERSIONS.none),
    loading: t(VERSIONS.loading),
    failedTitle: t(VERSIONS.failedTitle),
    failedMessage: t(VERSIONS.failedMessage),
    retry: t(VERSIONS.retry),
  };
}
