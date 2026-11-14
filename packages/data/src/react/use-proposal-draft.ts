'use client';
import type { ProposalFieldSetWire } from '@heliogrid/contracts';
import { onlineManager } from '@tanstack/react-query';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { type ProposalActFailure, useProposalCache } from './proposal-cache';
import {
  type DraftChange,
  type DraftConflict,
  type DraftFieldState,
  isMoving,
  type ProposalDealEdit,
} from './proposal-draft-queue';
import { useProposalDraftQueue } from './proposal-draft-store';
import { fieldStateOf, workingDealOf, workingFieldsOf } from './proposal-draft-working';
import { type ProposalRead, useProposal } from './use-proposal';

/**
 * The draft as the builder edits it (`M06-25`, `T-M06-023`): every field commits when it is left,
 * each on the revision the last answer gave, and the server's answer — fresh figures, standings and
 * the checklist — replaces the proposal held. A failed commit keeps what was typed and says so;
 * nothing is queued offline and nothing is retried by itself (`F8-36`).
 */
export interface ProposalDraft {
  /** The proposal as the server last answered it. */
  readonly read: ProposalRead;
  /**
   * The steps as the person left them: the stored ones with every change still waiting, out or
   * kept unsaved laid over — what the fields show. `null` until the proposal is read.
   */
  readonly fields: ProposalFieldSetWire | null;
  /**
   * The steps as the document prints them: `fields` without a value refused — by the server or held
   * on the device — since no document ever holds one. `null` until the proposal is read.
   */
  readonly printable: ProposalFieldSetWire | null;
  /** The lead facts typed and not yet stored, to lay over `document.deal`. */
  readonly deal: ProposalDealEdit;
  /** The Quick switch as the person left it. */
  readonly quickMode: boolean | null;
  /**
   * Commits one field. `key` names it — its state is read back under the same key — and a value
   * typed again while the last one waits replaces it; one typed while the last is out goes after.
   */
  commit(key: string, change: DraftChange): void;
  /** Holds a value the device refuses as typed, with why, and never sends it. */
  hold(key: string, change: DraftChange, failure: ProposalActFailure): void;
  /** One field's save: saving, saved, kept unsaved, or refused; `null` when there is nothing to say. */
  stateOf(key: string): DraftFieldState | null;
  /** A commit is waiting or out: the figures on screen are about to move (`F8-12`). */
  readonly saving: boolean;
  /** The field whose value landed last — its quiet tick shows. */
  readonly lastSaved: string | null;
  /** How many typed values are kept and not saved — *1 field not saved*. */
  readonly unsaved: number;
  /** How many typed values the server refused, still on screen with why — never stored. */
  readonly refused: number;
  /** Sends a kept value again; with no key, every one. */
  retry(key?: string): void;
  /** Lets a value that did not save go: its field shows what is stored. */
  drop(key: string): void;
  /** The device says it has no connection, or the last commit met none — said once, not per field. */
  readonly offline: boolean;
  /** Changed on another device, or the lead moved: no commit is taken until `reload`. */
  readonly conflict: DraftConflict | null;
  /** Reads the proposal again and lets what was typed on the old one go. */
  reload(): void;
  /** Resolves once nothing is waiting or out: `true` when every change landed. */
  settled(): Promise<boolean>;
}

export function useProposalDraft(proposalId: string): ProposalDraft {
  const read = useProposal(proposalId);
  const cache = useProposalCache();
  const queue = useProposalDraftQueue(proposalId);
  const snapshot = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getSnapshot);
  const online = useSyncExternalStore(
    onlineManager.subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
  const stored = read.kind === 'ready' ? read.value : null;

  const commit = useCallback(
    (key: string, change: DraftChange) => queue.commit(key, { kind: 'edit', change }),
    [queue],
  );
  const hold = useCallback(
    (key: string, change: DraftChange, failure: ProposalActFailure) =>
      queue.hold(key, { kind: 'edit', change }, failure),
    [queue],
  );
  const reload = useCallback(() => {
    queue.reset();
    void cache.reread(proposalId);
  }, [queue, cache, proposalId]);

  return useMemo(() => {
    const { entries } = snapshot;
    const quick = entries.flatMap((entry) =>
      entry.act.kind === 'edit' && entry.act.change.quickMode !== undefined
        ? [entry.act.change.quickMode]
        : [],
    );
    return {
      read,
      fields: stored === null ? null : workingFieldsOf(stored.document.fields, entries),
      printable:
        stored === null
          ? null
          : workingFieldsOf(
              stored.document.fields,
              entries.filter((entry) => entry.status !== 'refused'),
            ),
      deal: workingDealOf(entries),
      quickMode: quick.at(-1) ?? stored?.quickMode ?? null,
      commit,
      hold,
      stateOf: (key) => fieldStateOf(snapshot, key),
      saving: entries.some(isMoving),
      lastSaved: snapshot.lastSaved,
      unsaved: entries.filter((entry) => entry.status === 'unsaved').length,
      refused: entries.filter((entry) => entry.status === 'refused').length,
      retry: (key) => queue.retry(key),
      drop: (key) => queue.drop(key),
      offline: !online || entries.some((entry) => entry.reason === 'offline'),
      conflict: snapshot.conflict,
      reload,
      settled: () => queue.settled(),
    };
  }, [snapshot, read, stored, online, commit, hold, reload, queue]);
}
