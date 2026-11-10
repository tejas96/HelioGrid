'use client';
import {
  can,
  DOOR_SEGMENT,
  type MergeChoices,
  type MergeField,
  type MergeMoves,
  type MergePreviewRead,
  type MergeRecord,
  type MergeRefusal,
  type MergeUnavailable,
  type MergeView,
  mergePicksOf,
  mergeUnavailableOf,
  mergeViewOf,
  type Read,
  subjectAddressOf,
} from '@heliogrid/domain';
import { type UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError, DataError } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';
import { readOf } from './read';
import { type CustomerMergeFind, useCustomerMergeFind } from './use-customer-merge-find';
import { useSession } from './use-session';
import { useTenantId } from './use-tenant-id';

export type { CustomerMergeCandidate, CustomerMergeFind } from './use-customer-merge-find';

export interface CustomerMergeOptions {
  /** The record the person came from — the lead's customer; it stays unless they pick the other. */
  readonly survivorId: string;
  /** The other record, when the screen opened with both (a kept-both link); else `null`. */
  readonly loserId: string | null;
  /** *Open customer* on the done page: the route goes to the survivor's lead at this address. */
  readonly onOpenLead: (address: string) => void;
}

/** Find the other record, pick what stays, then (on the phone) read the confirm before merging. */
export type CustomerMergeStep = 'find' | 'choose' | 'confirm';

/** The pair's read: the compare once both answer, or why the two cannot merge here (`M02-63`). */
export type CustomerMergeRead =
  | Read<MergeView>
  | { readonly kind: 'unavailable'; readonly unavailable: MergeUnavailable };

/** Why the confirmed merge did not run — nothing changed — said under the act. */
export type CustomerMergeFailure =
  | { readonly kind: 'refused'; readonly refusal: MergeRefusal }
  | { readonly kind: 'failed'; readonly attempt: DataError };

/** A finished merge, as the calm done page names it. */
export interface CustomerMergeDone {
  readonly survivor: MergeRecord;
  readonly loser: MergeRecord;
  /** The survivor's lead — where *Open customer* lands. */
  readonly leadId: string;
  /** When it ran, an ISO instant on the device's clock. */
  readonly at: string;
  readonly moves: MergeMoves;
}

/** Customer Merge (`SCR-M02-06`) as both screens draw it, assembled once (Law 11). */
export interface CustomerMergeScreen {
  /** The reader may merge customers (`crm.merge_customers`: Owner, Sales Manager). */
  readonly allowed: boolean;
  readonly step: CustomerMergeStep;
  readonly find: CustomerMergeFind;
  readonly read: CustomerMergeRead;
  /** Makes this record the one that stays; every pick follows its record. */
  stay(customerId: string): void;
  /** Keeps this record's value of a differing field (`M02-60`: explicit, never guessed). */
  pick(field: MergeField, customerId: string): void;
  /** The screen found the other record itself, so it may go back and find a different one. */
  readonly canChangeOther: boolean;
  changeOther(): void;
  /** The phone's step to the confirm, once every differing field is picked. */
  review(): void;
  backToChoices(): void;
  /** The merge is out: every choice and every way out waits for its answer. */
  readonly merging: boolean;
  /** A merge is out NOW — read from the lock, so an Esc or a Back in the same frame finds it. */
  isMerging(): boolean;
  /** Every differing field picked and nothing refused: the act is awake. */
  readonly canMerge: boolean;
  readonly failure: CustomerMergeFailure | null;
  /** Runs the merge — only from an explicit press, and never a second while one is out. */
  merge(): void;
  readonly done: CustomerMergeDone | null;
  openCustomer(): void;
}

/** A refusal that no second press can change: the act sleeps beside its line. */
const FINAL: readonly MergeRefusal[] = ['out_of_scope', 'already_merged', 'not_found'];

const REFUSAL_BY_CODE: Readonly<Record<string, MergeRefusal>> = {
  MERGE_OUT_OF_SCOPE: 'out_of_scope',
  CUSTOMER_ALREADY_MERGED: 'already_merged',
  MERGE_CHOICES_MISSING: 'choices_missing',
  NOT_FOUND: 'not_found',
};

function failureOf(error: unknown): CustomerMergeFailure | null {
  if (!(error instanceof DataError)) return null;
  const refusal = error instanceof ApiError ? REFUSAL_BY_CODE[error.code] : undefined;
  return refusal === undefined ? { kind: 'failed', attempt: error } : { kind: 'refused', refusal };
}

const isGone = (error: unknown) => error instanceof ApiError && error.status === 404;

export function useCustomerMergeScreen(options: CustomerMergeOptions): CustomerMergeScreen {
  const { survivorId: firstId } = options;
  const repositories = useRepositories();
  const client = useQueryClient();
  const tenantId = useTenantId();
  const allowed = can(useSession().user?.tenant?.roles ?? [], 'crm.merge_customers');
  const latest = useRef(options);
  latest.current = options;

  const [otherId, setOtherId] = useState<string | null>(options.loserId);
  const [stayingId, setStayingId] = useState(firstId);
  const [choices, setChoices] = useState<MergeChoices>({});
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<CustomerMergeDone | null>(null);
  const find = useCustomerMergeFind({
    survivorId: firstId,
    enabled: allowed && otherId === null,
    onPick: setOtherId,
  });

  const loserId = otherId === null ? null : stayingId === firstId ? otherId : firstId;
  const preview = useQuery({
    queryKey: queryKeys.crm.mergePreview(tenantId, stayingId, loserId ?? ''),
    queryFn: ({ signal }): Promise<MergePreviewRead> =>
      repositories.customerMerge.preview(stayingId, loserId ?? '', signal),
    enabled: allowed && tenantId !== '' && loserId !== null && done === null,
  });
  /* The other way round is read as soon as this one answers, so making the other record stay turns
     the compare and its summary round at once. */
  const turned = preview.data?.blocked === null ? loserId : null;
  useEffect(() => {
    if (turned === null) return;
    void client.prefetchQuery({
      queryKey: queryKeys.crm.mergePreview(tenantId, turned, stayingId),
      queryFn: ({ signal }) => repositories.customerMerge.preview(turned, stayingId, signal),
    });
  }, [client, repositories, tenantId, turned, stayingId]);

  const view = preview.data === undefined ? null : mergeViewOf(preview.data, firstId, choices);
  const read = pairReadOf(preview, view);

  const merging = useAction(
    async (input: { view: MergeView }) => {
      const { view: sent } = input;
      const merged = await repositories.customerMerge.merge({
        survivorId: sent.survivor.customerId,
        loserId: sent.loser.customerId,
        picks: mergePicksOf(sent),
        capturedAt: new Date().toISOString(),
      });
      return { merged, sent };
    },
    {
      onDone: ({ merged, sent }) => {
        setDone({
          survivor: sent.survivor,
          loser: sent.loser,
          leadId: merged.leadId,
          at: new Date().toISOString(),
          moves: sent.moves,
        });
        void client.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });
      },
      onFailed: (error) => {
        const answer = failureOf(error);
        if (answer?.kind !== 'refused' || answer.refusal !== 'choices_missing') return;
        /* The records changed under the picks: read them again and go back to the choices. */
        setConfirming(false);
        void preview.refetch();
      },
    },
  );
  const failure = failureOf(merging.failure);
  const refusedForGood = failure?.kind === 'refused' && FINAL.includes(failure.refusal);
  const canMerge = view?.ready === true && !refusedForGood;

  const unlessMerging = (change: () => void) => () => {
    if (merging.isOut()) return;
    merging.clear();
    change();
  };

  return {
    allowed,
    step: otherId === null ? 'find' : confirming ? 'confirm' : 'choose',
    find,
    read,
    stay: (customerId) => unlessMerging(() => setStayingId(customerId))(),
    pick: (field, customerId) =>
      unlessMerging(() => setChoices((was) => ({ ...was, [field]: customerId })))(),
    canChangeOther: options.loserId === null,
    changeOther: unlessMerging(() => {
      setOtherId(null);
      setStayingId(firstId);
      setChoices({});
      setConfirming(false);
    }),
    review: () => {
      if (canMerge) setConfirming(true);
    },
    backToChoices: unlessMerging(() => setConfirming(false)),
    merging: merging.pending,
    isMerging: () => merging.isOut(),
    canMerge,
    failure,
    merge: () => {
      if (view === null || !canMerge) return;
      void merging.run({ view });
    },
    done,
    openCustomer: () => {
      if (done === null) return;
      latest.current.onOpenLead(subjectAddressOf('lead', done.leadId) ?? DOOR_SEGMENT.leads);
    },
  };
}

/** The pair's read as the screen draws it: a 404 or a blocked answer is unavailable, never failed. */
function pairReadOf(
  preview: UseQueryResult<MergePreviewRead>,
  view: MergeView | null,
): CustomerMergeRead {
  if (preview.data === undefined && isGone(preview.error)) {
    return { kind: 'unavailable', unavailable: { kind: 'not_found' } };
  }
  const blocked = preview.data === undefined ? null : mergeUnavailableOf(preview.data);
  if (blocked !== null) return { kind: 'unavailable', unavailable: blocked };
  const pair = readOf(preview);
  return pair.kind === 'ready' && view !== null
    ? { kind: 'ready', value: view }
    : pairLoading(pair);
}

function pairLoading(pair: Read<MergePreviewRead>): Read<MergeView> {
  return pair.kind === 'ready' ? { kind: 'loading' } : pair;
}
