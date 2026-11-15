import type {
  EditProposal,
  ProposalDetail,
  ProposalFieldSetWire,
  ProposalFieldsEdit,
} from '@heliogrid/contracts';
import { ApiError } from '../errors/errors';
import type { FillEnergy, ResetStep } from '../proposals/proposals-repository';
import { type MovedTo, type ProposalActFailure, proposalActFailureOf } from './proposal-cache';

/** The lead's own facts a step writes (`M06-09`, `M06-16`), as one commit carries them. */
export type ProposalDealEdit = NonNullable<EditProposal['deal']>;

/**
 * One change to the draft (`M06-25`). `fields` builds the steps it rewrites, each WHOLE, on the
 * field set as the server holds it when the change is sent — so a change waiting behind another
 * is built on that one's answer, and never puts an earlier answer back.
 */
export interface DraftChange {
  readonly fields?: (stored: ProposalFieldSetWire) => ProposalFieldsEdit;
  readonly deal?: ProposalDealEdit;
  readonly quickMode?: boolean;
}

/** What a queued act does: an edit, the generation fill or its reset, or a step back to the template. */
export type DraftAct =
  | { readonly kind: 'edit'; readonly change: DraftChange }
  | { readonly kind: 'energy'; readonly mode: FillEnergy['mode'] }
  | { readonly kind: 'reset'; readonly step: ResetStep['step'] };

/** Why a typed value is still not saved: the send failed, the device is offline, or the draft moved on. */
export type UnsavedReason = 'failed' | 'offline' | 'conflict';

/** One field's save as its screen draws it (`T-M06-023`). */
export type DraftFieldState =
  | { readonly kind: 'saving' }
  /** The quiet tick on the field just left. */
  | { readonly kind: 'saved' }
  /** The typed value is kept; nothing claims it saved. */
  | { readonly kind: 'unsaved'; readonly reason: UnsavedReason }
  /** The server refused the value itself — a fourth brand, a figure out of range. */
  | { readonly kind: 'refused'; readonly failure: ProposalActFailure };

/** The draft cannot take commits until it is read again. */
export type DraftConflict =
  | { readonly kind: 'changed_elsewhere' }
  | { readonly kind: 'lead_moved'; readonly to: MovedTo | null };

/** One typed value; `refused` stays on screen with why, never sent again, until retyped or let go. */
interface Entry {
  readonly key: string;
  readonly act: DraftAct;
  readonly status: 'queued' | 'sending' | 'unsaved' | 'refused';
  readonly reason: UnsavedReason | null;
  readonly failure: ProposalActFailure | null;
}

export interface DraftSnapshot {
  readonly entries: readonly Entry[];
  readonly lastSaved: string | null;
  readonly conflict: DraftConflict | null;
}

export interface DraftQueueDeps {
  /** The proposal as held now: the revision and the stored field set the next send is built on. */
  held(): ProposalDetail | undefined;
  /** Sends one act on the revision given, answering the proposal as it now stands. */
  send(act: DraftAct, on: ProposalDetail): Promise<ProposalDetail>;
  landed(proposal: ProposalDetail): void;
  /** The device's own word on reachability; a commit made offline is kept, never queued (`F8-36`). */
  online(): boolean;
}

/** The entries with one replaced in place — spelled out, since the phone's engine lacks `Array.with`. */
function placedAt(entries: readonly Entry[], at: number, entry: Entry): readonly Entry[] {
  return entries.map((one, index) => (index === at ? entry : one));
}

/** From this status up the refusal is the server's own fault, never a no to the value sent. */
const SERVER_FAULT = 500;

const EMPTY: DraftSnapshot = { entries: [], lastSaved: null, conflict: null };

/**
 * The draft's saves (`M06-25`, `T-M06-023`), ONE queue per proposal so the builder's fields, the
 * generation fill and Generate all move the same revision in order. One send is out at a time:
 * each carries the revision the last answer gave, so a later field never overtakes an earlier one.
 * A value typed again while its field waits replaces the waiting one; one typed while its send is
 * out goes after it. A send that fails keeps its value as `unsaved`; nothing is retried by itself.
 */
export class ProposalDraftQueue {
  private snapshot: DraftSnapshot = EMPTY;
  private readonly listeners = new Set<() => void>();
  private idleWaiters: Array<() => void> = [];

  constructor(private readonly deps: DraftQueueDeps) {}

  getSnapshot = (): DraftSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Nothing is waiting, out or kept unsaved, and no listener reads it: the queue can be dropped. */
  get disposable(): boolean {
    return this.listeners.size === 0 && this.snapshot === EMPTY;
  }

  commit(key: string, act: DraftAct): void {
    const { entries } = this.snapshot;
    const waiting = entries.findIndex((entry) => entry.key === key && entry.status !== 'sending');
    const entry: Entry = { key, act, ...this.arrivalOf(), failure: null };
    this.set({
      entries: waiting === -1 ? [...entries, entry] : placedAt(entries, waiting, entry),
      lastSaved: this.snapshot.lastSaved === key ? null : this.snapshot.lastSaved,
    });
    this.pump();
  }

  /** A value the device refuses before sending — held as typed with why, never sent (`F8-36`). */
  hold(key: string, act: DraftAct, failure: ProposalActFailure): void {
    const entries = this.snapshot.entries.filter(
      (entry) => entry.key !== key || entry.status === 'sending',
    );
    this.set({ entries: [...entries, { key, act, status: 'refused', reason: null, failure }] });
  }

  /** Kept in a conflict (`pump` sends nothing then: queued, it would hold `settled` forever). */
  private arrivalOf(): Pick<Entry, 'status' | 'reason'> {
    if (this.snapshot.conflict !== null) return { status: 'unsaved', reason: 'conflict' };
    if (!this.deps.online()) return { status: 'unsaved', reason: 'offline' };
    return { status: 'queued', reason: null };
  }

  /** Sends what came back unsaved again — one field's, or every one. Nothing moves in a conflict. */
  retry(key?: string): void {
    if (this.snapshot.conflict !== null) return;
    this.set({
      entries: this.snapshot.entries.map((entry) =>
        entry.status === 'unsaved' && (key === undefined || entry.key === key)
          ? { ...entry, status: 'queued', reason: null }
          : entry,
      ),
    });
    this.pump();
  }

  /** The person lets a value that did not save go: the field shows what is stored. */
  drop(key: string): void {
    this.set({
      entries: this.snapshot.entries.filter(
        (entry) => entry.key !== key || entry.status === 'sending',
      ),
    });
  }

  /** After a reload: what was typed on the old draft is let go, and commits are taken again. */
  reset(): void {
    this.set({
      entries: this.snapshot.entries.filter((entry) => entry.status === 'sending'),
      conflict: null,
      lastSaved: null,
    });
  }

  /**
   * Resolves once nothing is waiting or out — `true` when every change landed, `false` when one is
   * kept unsaved or refused, or the draft is in conflict: what the screen shows is not what is stored. Generate waits on it, so it never runs on a revision
   * a commit is about to move.
   */
  settled(): Promise<boolean> {
    if (!this.busy()) return Promise.resolve(this.clean());
    return new Promise<void>((resolve) => this.idleWaiters.push(resolve)).then(() => this.clean());
  }

  private busy(): boolean {
    return this.snapshot.entries.some(isMoving);
  }

  private clean(): boolean {
    return this.snapshot.entries.length === 0 && this.snapshot.conflict === null;
  }

  private set(next: Partial<DraftSnapshot>): void {
    const snapshot = { ...this.snapshot, ...next };
    const idle =
      snapshot.entries.length === 0 && snapshot.lastSaved === null && snapshot.conflict === null;
    this.snapshot = idle ? EMPTY : snapshot;
    for (const listener of this.listeners) listener();
    if (!this.busy()) {
      const waiters = this.idleWaiters;
      this.idleWaiters = [];
      for (const resolve of waiters) resolve();
    }
  }

  private pump(): void {
    const { entries, conflict } = this.snapshot;
    if (conflict !== null || entries.some((entry) => entry.status === 'sending')) return;
    const at = entries.findIndex((entry) => entry.status === 'queued');
    const next = entries[at];
    const on = this.deps.held();
    if (next === undefined || on === undefined) return;
    this.set({ entries: placedAt(entries, at, { ...next, status: 'sending' }) });
    void this.deps.send(next.act, on).then(
      (proposal) => {
        this.deps.landed(proposal);
        this.set({ entries: this.without(next.key), lastSaved: next.key });
        this.pump();
      },
      (error: unknown) => {
        this.failed(next.key, error);
        this.pump();
      },
    );
  }

  /** Every entry but the one that was out for `key`. */
  private without(key: string): readonly Entry[] {
    return this.snapshot.entries.filter(
      (entry) => !(entry.key === key && entry.status === 'sending'),
    );
  }

  private failed(key: string, error: unknown): void {
    const failure = proposalActFailureOf(error);
    const keep = (reason: UnsavedReason, all: boolean) =>
      this.snapshot.entries.map((entry): Entry => {
        const sent = entry.key === key && entry.status === 'sending';
        return sent || (all && entry.status === 'queued')
          ? { ...entry, status: 'unsaved', reason }
          : entry;
      });
    if (failure.kind === 'changed_elsewhere' || failure.kind === 'lead_moved') {
      // Everything typed on the old revision is kept on screen; none of it is sent (`M06-25`).
      this.set({ entries: keep('conflict', true), conflict: failure });
      return;
    }
    if (failure.kind === 'failed' && failure.failure === 'no_connection') {
      // Offline: what waits behind it would meet the same wall, so nothing more is tried.
      this.set({ entries: keep('offline', true) });
      return;
    }
    if (!(error instanceof ApiError) || error.status >= SERVER_FAULT) {
      // No answer, or the server's own fault: the value may or may not have landed, so it is
      // kept and never claimed.
      this.set({ entries: keep('failed', false) });
      return;
    }
    // The server answered no: the value stays on screen with why, and is never sent again.
    this.set({
      entries: this.snapshot.entries.map((entry) =>
        entry.key === key && entry.status === 'sending'
          ? { ...entry, status: 'refused', failure }
          : entry,
      ),
    });
  }
}

/** A commit waiting or out: the figures on screen are about to move. */
export function isMoving(entry: DraftSnapshot['entries'][number]): boolean {
  return entry.status === 'queued' || entry.status === 'sending';
}
