/* VersionDiff's row classifier — platform-neutral, so both halves agree about what changed.

   FOUR STATES, NOT TWO. changed · unchanged · added · removed. `unchanged` is first-class rather
   than an omission — an eleven-step field set where the reader cannot tell "same" from "not shown"
   is not a diff of the field set.

   TIERS ARE COMPARED RESOLVED, NOT COERCED. `ProvenanceTierSpec` is a string OR an object, and
   `String({tone:'derived'})` is "[object Object]" for every object alive — so an object-tier upgrade
   compared equal to itself, the row was classified `unchanged`, folded behind the collapse, and the
   `estimated → derived` pair never rendered: the exact silent tier change F8-05 and SCR-M06-18 exist
   to prevent. `resolveTier` is Provenance's own resolver and returns `{label,color}`, which is what a
   reader actually sees. */

import type { ReactNode } from 'react';
import { resolveTier } from '../Provenance/Provenance.tiers';
import type { ProvenanceTierSpec } from '../Provenance/Provenance.types';
import type { DiffRow, DiffState, VersionDiffMode, VersionSide } from './VersionDiff.types';

function text(value: ReactNode): string {
  return value === null || value === undefined ? '' : String(value);
}

export function sameValue(a: ReactNode, b: ReactNode): boolean {
  return text(a) === text(b);
}

export function sameTier(a?: ProvenanceTierSpec, b?: ProvenanceTierSpec): boolean {
  const ra = resolveTier(a);
  const rb = resolveTier(b);
  if (!ra || !rb) {
    return !ra && !rb;
  }
  return ra.label === rb.label && ra.color === rb.color;
}

/** The state of one row, when the caller hasn't stated it. Absence on either side is its own answer. */
export function resolveDiffRow(row: DiffRow): DiffState {
  if (row.state) {
    return row.state;
  }
  const hasB = row.before !== null && row.before !== undefined && row.before !== '';
  const hasA = row.after !== null && row.after !== undefined && row.after !== '';
  if (!hasB && hasA) {
    return 'added';
  }
  if (hasB && !hasA) {
    return 'removed';
  }
  if (sameValue(row.before, row.after) && sameTier(row.beforeTier, row.afterTier)) {
    return 'unchanged';
  }
  return 'changed';
}

/** True when the VALUE held still and only the tier moved — SCR-M06-18's whole content. */
export function isTierOnly(row: DiffRow, state: DiffState): boolean {
  return (
    state === 'changed' &&
    sameValue(row.before, row.after) &&
    !sameTier(row.beforeTier, row.afterTier)
  );
}

/** One row with the state it resolved to and the identity the list renders it under. */
export interface DiffEntry {
  row: DiffRow;
  state: DiffState;
  id: string;
}

/** Every row's state and key, resolved once so both halves render the same list. */
export function resolveDiffEntries(rows: DiffRow[]): DiffEntry[] {
  return rows.map((row, i) => ({
    row,
    state: resolveDiffRow(row),
    id: row.key ?? `${i}-${row.label}`,
  }));
}

/** What the two versions are CALLED — the headings, the per-line stamps and their notes. */
export interface DiffSides {
  beforeLabel: string;
  afterLabel: string;
  beforeStamp: string;
  afterStamp: string;
  /** Both sides' notes on one line — empty when neither side carries one. */
  notes: string;
}

/**
 * The naming of the two sides. `mode` only moves the defaults: `upgrade` is SCR-M06-18's
 * "Now" → "Upgraded", `versions` is SCR-M06-16's v1 → v2. A stamp falls back to its own label.
 */
export function resolveDiffSides(
  before: VersionSide,
  after: VersionSide,
  mode: VersionDiffMode,
): DiffSides {
  const beforeLabel = before.label || (mode === 'upgrade' ? 'Now' : 'v1');
  const afterLabel = after.label || (mode === 'upgrade' ? 'Upgraded' : 'v2');
  return {
    beforeLabel,
    afterLabel,
    beforeStamp: before.stamp || beforeLabel,
    afterStamp: after.stamp || afterLabel,
    notes: [
      before.note ? `${beforeLabel}: ${before.note}` : null,
      after.note ? `${afterLabel}: ${after.note}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

/** One heading and the consecutive rows that sit under it. */
export interface DiffGroup {
  name: string;
  rows: DiffEntry[];
}

/** Consecutive rows sharing a `group` heading, in the order given. */
export function groupDiffRows(entries: DiffEntry[]): DiffGroup[] {
  const groups: DiffGroup[] = [];
  for (const entry of entries) {
    const name = entry.row.group || '';
    const last = groups[groups.length - 1];
    if (last && last.name === name) {
      last.rows.push(entry);
    } else {
      groups.push({ name, rows: [entry] });
    }
  }
  return groups;
}

/** The counts line — "3 changed · 1 added · 1 removed · 6 unchanged". */
export function diffSummary(states: DiffState[]): string {
  const counts: Record<DiffState, number> = {
    changed: 0,
    unchanged: 0,
    added: 0,
    removed: 0,
  };
  for (const s of states) {
    counts[s] += 1;
  }
  return (['changed', 'added', 'removed', 'unchanged'] as const)
    .filter((k) => counts[k] > 0)
    .map((k) => `${counts[k]} ${k}`)
    .join(' · ');
}
