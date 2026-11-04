'use client';
import type { BillingStanding, PublicPricingRead } from '@heliogrid/contracts';
import { againstOptionsOf, mapRead, planPairOf, type Read, type Tier } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { companyRead } from './shell-reads';
import type { BillingFacts } from './use-billing-home';
import { ownersRead } from './use-owners';
import { PAIR_START, type PricingSet } from './use-pricing-page';

/** A read whose answer may be none: none is `empty`. */
function present<T, U>(read: Read<T | null>, map: (value: T) => U): Read<U> {
  if (read.kind !== 'ready') return read;
  return read.value === null
    ? { kind: 'empty' }
    : mapRead({ kind: 'ready', value: read.value }, map);
}

/**
 * The plans' two reads (decision 10): `Your plan` from Billing's own reads — the Owner's home,
 * anyone else's standing and whose act it is (`M12-56`) — and the market's public price list.
 */
export function usePlanReads(tenantId: string, owner: boolean) {
  const repositories = useRepositories();
  const signedIn = tenantId !== '';
  const home = useQuery({
    queryKey: queryKeys.billing.home(tenantId),
    queryFn: ({ signal }) => repositories.billing.home(signal),
    enabled: signedIn && owner,
  });
  const standing = useQuery({
    queryKey: queryKeys.billing.standing(tenantId),
    queryFn: ({ signal }) => repositories.billing.standing(signal),
    enabled: signedIn && !owner,
  });
  const owners = useQuery(ownersRead(repositories, tenantId, signedIn && !owner));
  const company = useQuery(companyRead(repositories, tenantId, signedIn));
  const marketCode = company.data?.marketCode;
  const pricing = useQuery({
    queryKey: queryKeys.pricing.current(marketCode ?? ''),
    queryFn: ({ signal }) => repositories.pricing.current(marketCode ?? '', signal),
    enabled: marketCode !== undefined,
  });
  const plan: Read<BillingFacts> = owner
    ? present(readOf(home), (value) => ({ kind: 'owner', home: value }))
    : present(readOf(standing), (value) => ({
        kind: 'member',
        standing: value,
        owners: owners.data ?? null,
      }));
  const book: Read<PublicPricingRead> = present(readOf(pricing), (value) => value);
  return { plan, book, held: heldOf(plan) };
}

function heldOf(plan: Read<BillingFacts>): BillingStanding | null {
  if (plan.kind !== 'ready') return null;
  return plan.value.kind === 'owner' ? plan.value.home.standing : plan.value.standing;
}

/**
 * The comparison's choices (decision 4): open or shut, the two plans and the set it shows. A paid
 * plan is compared against ONE other; a trial holds no plan (`M12-52`), so it pairs two plans as
 * the pricing page does — both chosen, neither the reader's own.
 */
export function usePlanCompare(book: Read<PublicPricingRead>, heldTier: Tier | null) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<{ plan: Tier | null; against: Tier | null }>({
    plan: null,
    against: null,
  });
  const [set, setSet] = useState<PricingSet>('limits');
  const sold = book.kind === 'ready' ? book.value.plans.map((row) => row.tier) : [];
  const first = heldTier ?? chosen.plan ?? PAIR_START.plan;
  const fallback = heldTier === null ? PAIR_START.against : first;
  const pair = planPairOf(sold, first, chosen.against ?? fallback);
  return {
    compareOpen: open,
    toggleCompare: () => setOpen((was) => !was),
    comparePlan: pair?.plan ?? null,
    /** The first plan's choices: every sold plan on a trial; none when it is the reader's own. */
    planOptions: heldTier === null ? sold : [],
    choosePlan: (plan: Tier) =>
      setChosen((was) => ({
        plan,
        against: planPairOf(sold, plan, was.against ?? fallback)?.against ?? null,
      })),
    against: pair?.against ?? null,
    againstOptions: pair === null ? [] : againstOptionsOf(sold, pair.plan),
    chooseAgainst: (against: Tier) => setChosen((was) => ({ ...was, against })),
    set,
    chooseSet: setSet,
  };
}
