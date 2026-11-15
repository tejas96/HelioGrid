import type { ProposalFieldSetWire } from '@heliogrid/contracts';
import type { DraftFieldState, DraftSnapshot, ProposalDealEdit } from './proposal-draft-queue';

/**
 * The stored field set with every change still waiting, out or kept unsaved applied in order — the
 * values the person left on screen. A typed value shows until it is saved or let go.
 */
export function workingFieldsOf(
  stored: ProposalFieldSetWire,
  entries: DraftSnapshot['entries'],
): ProposalFieldSetWire {
  let fields = stored;
  for (const entry of entries) {
    if (entry.act.kind !== 'edit' || entry.act.change.fields === undefined) continue;
    fields = Object.assign({}, fields, entry.act.change.fields(fields));
  }
  return fields;
}

/** The lead facts still waiting, out or kept unsaved, merged in order, to lay over the stored ones. */
export function workingDealOf(entries: DraftSnapshot['entries']): ProposalDealEdit {
  const deal: ProposalDealEdit = {};
  for (const entry of entries) {
    if (entry.act.kind === 'edit') Object.assign(deal, entry.act.change.deal);
  }
  return deal;
}

export function fieldStateOf(snapshot: DraftSnapshot, key: string): DraftFieldState | null {
  /* The newest entry speaks for the field: a value typed while its last one is out is `saving`. */
  const entry = snapshot.entries.filter((one) => one.key === key).at(-1);
  if (entry?.status === 'refused' && entry.failure !== null) {
    return { kind: 'refused', failure: entry.failure };
  }
  if (entry !== undefined) {
    return entry.status === 'unsaved'
      ? { kind: 'unsaved', reason: entry.reason ?? 'failed' }
      : { kind: 'saving' };
  }
  return snapshot.lastSaved === key ? { kind: 'saved' } : null;
}
