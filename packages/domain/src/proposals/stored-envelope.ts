import type { ProposalFieldSet } from './field-set';
import type { ProposalVersionSnapshot } from './snapshot';
import { NO_COVER } from './template-fill';

/**
 * The field set and the version snapshot as their jsonb rows hold them (`M06-25`, `M06-42`): an
 * envelope carrying its schema version, read back through ONE door each. A `proposal_version` row
 * lives forever, so a reader written today must read every row any earlier build wrote: a key a
 * later build added reads with its default, and a version newer than this build is refused loudly
 * rather than read as something it is not.
 */

const FIELD_SET_VERSION = 1;
const SNAPSHOT_VERSION = 1;

type StepKey = Exclude<keyof ProposalFieldSet, 'version'>;

/** A field set as its row holds it: the schema version and the steps by name, unread. */
export interface FieldSetEnvelope extends Partial<Readonly<Record<StepKey, unknown>>> {
  readonly version: number;
}

/**
 * A snapshot as its row holds it. The first rows carry no mark and are version 1 — exactly the
 * shape they hold — so reading them needs no data migration.
 */
export interface VersionSnapshotEnvelope
  extends Partial<Readonly<Record<keyof ProposalVersionSnapshot, unknown>>> {
  readonly version?: number;
}

/** What a step reads as on a row written before it had its own key. */
const STEP_DEFAULTS: Partial<Readonly<Record<StepKey, unknown>>> = {
  achievements: NO_COVER,
  timeline: [],
  components: [],
  bank: { includeInProposal: true },
};

/** What a later fact reads as on a snapshot written before it existed. */
const SNAPSHOT_DEFAULTS: Partial<Readonly<Record<keyof ProposalVersionSnapshot, unknown>>> = {
  generation: null,
  savings: null,
  emi: null,
  basisLine: null,
  validityDays: null,
};

const STEP_KEYS: readonly StepKey[] = [
  'company',
  'achievements',
  'system',
  'performance',
  'financials',
  'timeline',
  'payment',
  'components',
  'terms',
  'bank',
];

const SNAPSHOT_KEYS: readonly Exclude<keyof ProposalVersionSnapshot, 'fields'>[] = [
  'deal',
  'company',
  'money',
  'generation',
  'savings',
  'emi',
  'pages',
  'basisLine',
  'validityDays',
  'language',
  'preparedBy',
];

function objectOf(stored: unknown, what: string): Readonly<Record<string, unknown>> {
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) {
    throw new RangeError(`a stored ${what} is not an object`);
  }
  return stored as Readonly<Record<string, unknown>>;
}

function versionOf(row: Readonly<Record<string, unknown>>, what: string, newest: number): number {
  const version = row.version;
  if (!Number.isInteger(version) || (version as number) < 1) {
    throw new RangeError(`a stored ${what} carries no schema version`);
  }
  if ((version as number) > newest) {
    throw new RangeError(
      `a stored ${what} is schema version ${String(version)}, newer than this build reads (${newest})`,
    );
  }
  return version as number;
}

/** Each key read off the row, else its default; a key with neither refuses the whole row. */
function keysOf<Key extends string>(
  row: Readonly<Record<string, unknown>>,
  keys: readonly Key[],
  defaults: Partial<Readonly<Record<Key, unknown>>>,
  what: string,
): Record<Key, unknown> {
  const read = {} as Record<Key, unknown>;
  for (const key of keys) {
    const value = Object.hasOwn(row, key) ? row[key] : defaults[key];
    if (value === undefined) throw new RangeError(`a stored ${what} has no ${key}`);
    read[key] = value;
  }
  return read;
}

/** A draft's field set read from its row. */
export function fieldSetOf(stored: unknown): ProposalFieldSet {
  const row = objectOf(stored, 'field set');
  versionOf(row, 'field set', FIELD_SET_VERSION);
  const steps = keysOf(row, STEP_KEYS, STEP_DEFAULTS, 'field set');
  return { version: FIELD_SET_VERSION, ...steps } as ProposalFieldSet;
}

/** A field set as its row is written. */
export function fieldSetEnvelopeOf(fields: ProposalFieldSet): FieldSetEnvelope {
  return { ...fields, version: FIELD_SET_VERSION };
}

/** A version's snapshot read from its row; a row with no mark is version 1. */
export function versionSnapshotOf(stored: unknown): ProposalVersionSnapshot {
  const row = objectOf(stored, 'version snapshot');
  if (Object.hasOwn(row, 'version')) versionOf(row, 'version snapshot', SNAPSHOT_VERSION);
  const facts = keysOf(row, SNAPSHOT_KEYS, SNAPSHOT_DEFAULTS, 'version snapshot');
  if (!Object.hasOwn(row, 'fields'))
    throw new RangeError('a stored version snapshot has no fields');
  return { ...facts, fields: fieldSetOf(row.fields) } as ProposalVersionSnapshot;
}

/** A version's snapshot as its row is written, marked with the schema version it is. */
export function versionSnapshotEnvelopeOf(
  snapshot: ProposalVersionSnapshot,
): VersionSnapshotEnvelope {
  return { ...snapshot, version: SNAPSHOT_VERSION };
}
