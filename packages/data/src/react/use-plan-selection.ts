'use client';
import type { PlanChangePreview, PublicPricingRead } from '@heliogrid/contracts';
import { type BillingCycle, can, type Read, type Tier } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import {
  type PlanActFailure,
  planActFailureOf,
  planConfirmOf,
  refreshOnReturn,
} from './plan-selection-acts';
import { usePlanCompare, usePlanReads } from './plan-selection-reads';
import { readOf } from './read';
import type { BillingFacts } from './use-billing-home';
import type { PricingSet } from './use-pricing-page';
import { useSession } from './use-session';

export type { PlanActFailure } from './plan-selection-acts';

/** How the app opens the provider's page, and Billing once a downgrade is scheduled. */
export interface PlanSelectionAdapter {
  readonly openExternal: (url: string) => void;
  readonly toBilling: () => void;
}

/** Why the act did not land, and where it is said: the review sheet, or the page (frame s11). */
export interface PlanActFailureAt {
  readonly where: 'sheet' | 'page';
  readonly why: PlanActFailure;
}

/**
 * The plans (`SCR-M12-03`) as both screens draw them, assembled once (Law 11). `plan` is `Your
 * plan`'s read — the Owner's whole home, anyone else's standing and whose act it is (`M12-56`);
 * `book` is the market's price list, the plans region's read. A pick reads its preview, which
 * the review draws; every amount on it is the server's (`F4-04`).
 */
export interface PlanSelectionScreen {
  readonly owner: boolean;
  readonly plan: Read<BillingFacts>;
  readonly book: Read<PublicPricingRead>;
  readonly cycle: BillingCycle;
  chooseCycle(cycle: BillingCycle): void;
  readonly picked: Tier | null;
  pick(tier: Tier): void;
  /** The pick is the plan already held on this cycle: nothing to review. */
  readonly pickedIsHeld: boolean;
  readonly reviewing: boolean;
  openReview(): void;
  closeReview(): void;
  /** The pick's preview; `loading` until a pick is made. */
  readonly preview: Read<PlanChangePreview>;
  /** The preview a confirm found stale (`M12-49`): its rows are what the fresh one is marked against. */
  readonly changedFrom: PlanChangePreview | null;
  readonly acting: boolean;
  readonly failure: PlanActFailureAt | null;
  confirm(): void;
  readonly compareOpen: boolean;
  toggleCompare(): void;
  /** The two plans a phone compares — `Your plan` (or Growth on a trial) and ONE other. */
  readonly comparePlan: Tier | null;
  /** The first plan's choices on a trial, which holds none; empty when it is the reader's own. */
  readonly planOptions: readonly Tier[];
  choosePlan(tier: Tier): void;
  readonly against: Tier | null;
  readonly againstOptions: readonly Tier[];
  chooseAgainst(tier: Tier): void;
  readonly set: PricingSet;
  chooseSet(set: PricingSet): void;
  /** Enterprise's act; `null` when the book names no sales address. */
  readonly talkToSales: (() => void) | null;
}

export function usePlanSelectionScreen(adapter: PlanSelectionAdapter): PlanSelectionScreen {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const owner = can(user?.tenant?.roles ?? [], 'billing.manage_billing');
  const { plan, book, held } = usePlanReads(tenantId, owner);
  const compare = usePlanCompare(book, held?.tier ?? null);

  const [chosenCycle, setCycle] = useState<BillingCycle | null>(null);
  const [picked, setPicked] = useState<Tier | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [changedFrom, setChangedFrom] = useState<PlanChangePreview | null>(null);
  const [acting, setActing] = useState(false);
  const [failure, setFailure] = useState<PlanActFailureAt | null>(null);
  // A second press while an answer is out sends nothing (`F7-23` N5).
  const inFlight = useRef(false);
  const awaitReturn = useRef<() => void>(() => undefined);
  useEffect(() => () => awaitReturn.current(), []);

  const cycle = chosenCycle ?? held?.cycle ?? 'monthly';
  const pickedIsHeld = picked !== null && picked === held?.tier && cycle === held?.cycle;
  const pickOf = picked === null || pickedIsHeld ? null : { tier: picked, cycle };
  const previewQuery = useQuery({
    queryKey: queryKeys.billing.planChangePreview(tenantId, picked ?? '', cycle),
    queryFn: ({ signal }) =>
      repositories.billing.planChangePreview({ tier: picked ?? 'growth', cycle }, signal),
    enabled: owner && pickOf !== null,
  });
  const salesContact = book.kind === 'ready' ? book.value.salesContact : null;

  const settle = () => {
    setChangedFrom(null);
    setFailure(null);
  };

  /** A failed confirm: a stale preview is read again; anything else is said where it belongs. */
  async function failed(error: unknown, preview: PlanChangePreview): Promise<void> {
    const why = planActFailureOf(error);
    if (why === 'preview_changed') {
      setChangedFrom(preview);
      await previewQuery.refetch();
      return;
    }
    /* A handoff the gateway refused leaves the page as it was, and says so on it (s11). */
    const handoff = preview.kind !== 'downgrade' && why === 'gateway_down';
    if (handoff) setReviewing(false);
    setFailure({ where: handoff ? 'page' : 'sheet', why });
  }

  async function confirm(): Promise<void> {
    const preview = previewQuery.data;
    if (inFlight.current || pickOf === null || preview === undefined) return;
    inFlight.current = true;
    setActing(true);
    setFailure(null);
    try {
      const landed = await planConfirmOf(repositories, pickOf, preview);
      setChangedFrom(null);
      if (landed.kind === 'page') {
        awaitReturn.current();
        awaitReturn.current = refreshOnReturn(queryClient, queryKeys.billing.all(tenantId));
        adapter.openExternal(landed.url);
        return;
      }
      setReviewing(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.billing.all(tenantId) });
      if (landed.kind === 'scheduled') {
        /* Billing opens on `Needs you`, where the scheduled change now stands (frame 16). */
        queryClient.setQueryData(queryKeys.billingArrival(tenantId), 'needs');
        adapter.toBilling();
      }
    } catch (error) {
      await failed(error, preview);
    } finally {
      inFlight.current = false;
      setActing(false);
    }
  }

  const whileIdle =
    <A extends unknown[]>(run: (...args: A) => void) =>
    (...args: A) => {
      if (!inFlight.current) run(...args);
    };

  return {
    owner,
    plan,
    book,
    cycle,
    chooseCycle: whileIdle((next: BillingCycle) => {
      setCycle(next);
      settle();
    }),
    picked,
    pick: whileIdle((tier: Tier) => {
      setPicked(tier);
      settle();
    }),
    pickedIsHeld,
    reviewing,
    openReview: whileIdle(() => {
      if (pickOf !== null) setReviewing(true);
    }),
    closeReview: whileIdle(() => {
      setReviewing(false);
      settle();
    }),
    preview: pickOf === null ? { kind: 'loading' } : readOf(previewQuery),
    changedFrom,
    acting,
    failure,
    confirm: () => void confirm(),
    ...compare,
    talkToSales:
      salesContact === null ? null : () => adapter.openExternal(`mailto:${salesContact}`),
  };
}
