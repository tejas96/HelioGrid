'use client';
import type { BillingHome, BillingStanding, TenantOwners } from '@heliogrid/contracts';
import {
  type BillingNeed,
  billingNeedOf,
  type CancellationReason,
  can,
  mapRead,
  type Read,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';
import { readOf } from './read';
import { ownersRead } from './use-owners';
import { useSession } from './use-session';

/** The page's record lists and its two asks; one stands open at a time. */
export type BillingSheet = 'invoices' | 'reminders' | 'history' | 'cancel' | 'refund';

/** An act whose answer is out: it shows pending, and every other act waits for it. */
export type BillingActing = 'need' | 'method' | 'cancel' | 'refund' | 'pdf';

/** Why an act did not land, said where the person acted (`F7-23` N10). */
export type BillingActFailure =
  | 'gateway_down'
  | 'cancel_not_possible'
  | 'refund_not_possible'
  | 'pdf'
  | 'other';

/** What a landed act says once: the toast's facts. */
export type BillingDone =
  | { readonly kind: 'cancelled'; readonly runsUntil: string }
  | { readonly kind: 'refunded'; readonly creditNoteNumber: string }
  /** `Keep <plan> instead`: the scheduled change is withdrawn and the plan stays. */
  | { readonly kind: 'kept' };

/** The page's facts: the Owner's whole home, or a member's standing and whose act it is. */
export type BillingFacts =
  | { readonly kind: 'owner'; readonly home: BillingHome }
  | {
      readonly kind: 'member';
      readonly standing: BillingStanding;
      readonly owners: TenantOwners | null;
    };

/** How the app opens a page the product does not draw, and the plan screen (`SCR-M12-03`). */
export interface BillingHomeAdapter {
  readonly openExternal: (url: string) => void;
  readonly toPlans: () => void;
}

/**
 * Billing (`SCR-M12-02`) as both screens draw it, assembled once (Law 11): the page's one read,
 * the need in force and its one act, the method's update, a PDF, the record sheets and the two
 * asks. Every person may open it (`M12-56`); the Owner reads the whole home, anyone else the
 * standing alone, with no amount, and the owners' names for whose act it is.
 */
export interface BillingHomeScreen {
  readonly owner: boolean;
  /** The page's one read: the Owner's home, or a member's standing and whose act it is. */
  readonly read: Read<BillingFacts>;
  readonly need: BillingNeed;
  readonly acting: BillingActing | null;
  readonly failure: { readonly act: BillingActing; readonly why: BillingActFailure } | null;
  readonly done: BillingDone | null;
  readonly sheet: BillingSheet | null;
  /** The cancel ask's chosen reason; none until one is picked, and none again once it closes. */
  readonly reason: CancellationReason | null;
  /** The invoice whose PDF link is being signed: its act shows pending. */
  readonly pendingPdf: string | null;
  /**
   * The need's one act: pay, the renewal's link, the refund's ask, reactivation, the plans, or
   * keeping the plan a scheduled change was moving from.
   */
  needAct(): void;
  updateMethod(): void;
  /** `Your plan`'s route: Enterprise writes to its contact (`Talk to us`), every plan else picks. */
  openPlanRoute(): void;
  openPdf(id: string): void;
  openSheet(sheet: BillingSheet): void;
  closeSheet(): void;
  chooseReason(reason: CancellationReason): void;
  cancel(reason: CancellationReason | null): void;
  refund(): void;
  /** The toast was read: it goes. */
  clearDone(): void;
  /**
   * Where focus lands on arrival, when another screen handed the person here — `needs` after the
   * plans scheduled a downgrade (`SCR-M12-03`); `null` once landed.
   */
  readonly arrival: 'needs' | null;
  clearArrival(): void;
  /** A failure the person has read — a toast closed — goes. */
  clearFailure(): void;
}

export function useBillingHomeScreen(adapter: BillingHomeAdapter): BillingHomeScreen {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const owner = can(user?.tenant?.roles ?? [], 'billing.manage_billing');
  const home = useQuery({
    queryKey: queryKeys.billing.home(tenantId),
    queryFn: ({ signal }) => repositories.billing.home(signal),
    enabled: tenantId !== '' && owner,
  });
  const standing = useQuery({
    queryKey: queryKeys.billing.standing(tenantId),
    queryFn: ({ signal }) => repositories.billing.standing(signal),
    enabled: tenantId !== '' && !owner,
  });
  const owners = useQuery(ownersRead(repositories, tenantId, tenantId !== '' && !owner));
  const arrival = useQuery<'needs' | null>({
    queryKey: queryKeys.billingArrival(tenantId),
    queryFn: () => null,
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const [acting, setActing] = useState<BillingActing | null>(null);
  const [failure, setFailure] = useState<BillingHomeScreen['failure']>(null);
  const [done, setDone] = useState<BillingDone | null>(null);
  const [sheet, setSheetState] = useState<BillingSheet | null>(null);
  const [reason, setReason] = useState<CancellationReason | null>(null);
  const [pendingPdf, setPendingPdf] = useState<string | null>(null);
  const setSheet = (next: BillingSheet | null) => {
    setSheetState(next);
    setReason(null);
  };
  // A second press while an answer is out sends nothing (`F7-23` N5).
  const inFlight = useRef(false);

  const read: Read<BillingFacts> = owner
    ? mapRead(presentOf(readOf(home)), (value) => ({ kind: 'owner', home: value }))
    : mapRead(presentOf(readOf(standing)), (value) => ({
        kind: 'member',
        standing: value,
        owners: owners.data ?? null,
      }));
  const ownerHome = read.kind === 'ready' && read.value.kind === 'owner' ? read.value.home : null;
  const need = ownerHome === null ? 'none' : billingNeedOf(ownerHome, Date.now());

  async function act(name: BillingActing, run: () => Promise<void>): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setActing(name);
    setFailure(null);
    try {
      await run();
    } catch (error) {
      setFailure({ act: name, why: failureOf(name, error) });
    } finally {
      inFlight.current = false;
      setActing(null);
    }
  }

  const refreshed = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.billing.all(tenantId) });

  return {
    owner,
    read,
    need,
    acting,
    failure,
    done,
    sheet,
    reason,
    pendingPdf,
    needAct() {
      if (ownerHome === null) return;
      if (need === 'scheduled_change') {
        void act('need', async () => {
          await repositories.billing.planChangeWithdraw();
          setDone({ kind: 'kept' });
          await refreshed();
        });
        return;
      }
      runNeedAct(need, ownerHome, {
        adapter,
        askRefund: () => setSheet('refund'),
        reactivate: (plan) =>
          void act('need', async () => {
            adapter.openExternal(
              await repositories.billing.checkout({ tier: plan.tier, cycle: plan.cycle }),
            );
          }),
      });
    },
    updateMethod() {
      const url = ownerHome?.method.manageUrl ?? null;
      if (url !== null) adapter.openExternal(url);
    },
    openPlanRoute() {
      const contact = ownerHome?.salesContact ?? null;
      if (ownerHome?.standing.tier === 'enterprise' && contact !== null) {
        adapter.openExternal(`mailto:${contact}`);
        return;
      }
      adapter.toPlans();
    },
    openPdf(id) {
      if (inFlight.current) return;
      setPendingPdf(id);
      void act('pdf', async () => {
        const signed = await repositories.billing.documentDownload(id);
        if (signed === null) throw new Error('no PDF');
        adapter.openExternal(signed.url);
      }).finally(() => setPendingPdf(null));
    },
    openSheet: setSheet,
    chooseReason: setReason,
    closeSheet: () => {
      if (!inFlight.current) setSheet(null);
    },
    cancel(reason) {
      void act('cancel', async () => {
        const runsUntil = await repositories.billing.cancel({ reason });
        setSheet(null);
        setDone({ kind: 'cancelled', runsUntil });
        await refreshed();
      });
    },
    refund() {
      void act('refund', async () => {
        const creditNoteNumber = await repositories.billing.refund();
        setSheet(null);
        setDone({ kind: 'refunded', creditNoteNumber });
        await refreshed();
      });
    },
    clearDone: () => setDone(null),
    arrival: arrival.data ?? null,
    clearArrival: () => queryClient.setQueryData(queryKeys.billingArrival(tenantId), null),
    clearFailure: () => setFailure(null),
  };
}

/** A read whose answer may be none: none is `empty` — a company with no subscription at all. */
function presentOf<T>(read: Read<T | null>): Read<T> {
  if (read.kind !== 'ready') return read;
  return read.value === null ? { kind: 'empty' } : { kind: 'ready', value: read.value };
}

/** The need's one act: pay, the renewal's link, the refund's ask, reactivation, or the plans. */
function runNeedAct(
  need: BillingNeed,
  home: BillingHome,
  ways: {
    readonly adapter: BillingHomeAdapter;
    readonly askRefund: () => void;
    readonly reactivate: (plan: NonNullable<BillingHome['reactivation']>) => void;
  },
): void {
  const { adapter } = ways;
  const payUrl = home.due?.payUrl ?? null;
  const plan = home.reactivation;
  if (need === 'refund') ways.askRefund();
  else if (need === 'pick_plan') adapter.toPlans();
  else if (need === 'pay' && payUrl !== null) adapter.openExternal(payUrl);
  else if (need === 'renewal' && home.renewal !== null) adapter.openExternal(home.renewal.payUrl);
  else if ((need === 'way_back' || need === 'running') && plan !== null) ways.reactivate(plan);
}

function failureOf(act: BillingActing, error: unknown): BillingActFailure {
  if (act === 'pdf') return 'pdf';
  if (!(error instanceof ApiError)) return 'other';
  if (error.code === 'GATEWAY_UNAVAILABLE') return 'gateway_down';
  if (error.code === 'CANCEL_NOT_POSSIBLE') return 'cancel_not_possible';
  if (error.code === 'REFUND_NOT_POSSIBLE') return 'refund_not_possible';
  return 'other';
}
