'use client';
import type { BillingStanding } from '@heliogrid/contracts';
import {
  billingStripAudienceOf,
  billingStripFactOf,
  opensSettingsRow,
  type StandingDestination,
  type WorkDestination,
  workListLanded,
} from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useRepositories } from './context';
import { billingHomeRead, billingStandingRead } from './use-billing-strip';
import { catalogCountRead } from './use-catalog-items';
import { useSession } from './use-session';
import { membersRead } from './use-team';

/**
 * The desktop sidebar's facts (redesign direction A), as both shells read them: the work lists
 * still marked *Soon*, and the setup figures Home reads beside its steps.
 */
export interface Sidebar {
  /** A work list whose module has not landed: its door is the placeholder, so the row says *Soon*. */
  soon(destination: StandingDestination): boolean;
  readonly counts: ShellCounts;
}

/**
 * The setup figures — the catalog's items, the trial's days, the team's people — each read from
 * the record its page reads (the same query, so the two never disagree) and only for a row this
 * person's presets open. A figure still out, failed or not this person's is null and draws nothing.
 */
export interface ShellCounts {
  /** Every item of the catalog, hidden ones included, as the Catalog page counts it. */
  readonly catalogItems: number | null;
  /** Days left on the trial, as the billing strip counts them; null off a trial. */
  readonly trialDaysLeft: number | null;
  /** The people on the team. */
  readonly people: number | null;
}

export function useSidebar(): Sidebar {
  const counts = useShellCounts();
  return {
    soon: (destination) => isWork(destination) && !workListLanded(destination),
    counts,
  };
}

/** Home and More open pages of their own; every other standing destination is a work list. */
function isWork(destination: StandingDestination): destination is WorkDestination {
  return destination !== 'home' && destination !== 'more';
}

function useShellCounts(): ShellCounts {
  const repositories = useRepositories();
  const { user } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles ?? [];
  const reading = tenantId !== '';
  const audience = billingStripAudienceOf(roles);
  const owner = audience === 'owner';
  const catalog = useQuery(
    catalogCountRead(repositories, tenantId, 'all', reading && opensSettingsRow(roles, 'catalog')),
  );
  const people = useQuery(
    membersRead(repositories, tenantId, reading && opensSettingsRow(roles, 'team')),
  );
  const home = useQuery(billingHomeRead(repositories, tenantId, reading && owner));
  const standing = useQuery(billingStandingRead(repositories, tenantId, reading && !owner));
  const held = owner ? (home.data?.standing ?? null) : (standing.data ?? null);
  return {
    catalogItems: catalog.data ?? null,
    trialDaysLeft: held === null ? null : trialDaysOf(held, audience),
    people: people.data?.length ?? null,
  };
}

/** The trial's days as the strip counts them — whole days, never under one — or null off a trial. */
function trialDaysOf(
  standing: BillingStanding,
  audience: ReturnType<typeof billingStripAudienceOf>,
): number | null {
  const fact = billingStripFactOf({
    phase: standing.phase,
    stateEnteredAt: Date.parse(standing.stateEnteredAt),
    trialEndsAt: standing.trialEndsAt === null ? null : Date.parse(standing.trialEndsAt),
    signals: [],
    audience,
    now: Date.now(),
  });
  return fact.kind === 'trial_chip' || fact.kind === 'trial_prominent' ? fact.daysLeft : null;
}
