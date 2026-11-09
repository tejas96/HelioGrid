'use client';
import type {
  BillingHome,
  BillingStanding,
  BillingUsage,
  BillingUsageSignals,
  TenantOwners,
} from '@heliogrid/contracts';
import {
  type BillingStripAudience,
  type BillingStripGo,
  billingStripAudienceOf,
  CAP_HELD_STEPS,
  can,
  type Read,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { queryKeys } from '../cache/keys';
import type { Repositories } from '../composition';
import type { BlockedRefusal } from '../session/blocked';
import { useAction } from './action';
import { useDataLayer, useRepositories } from './context';
import { readOf } from './read';
import { ownersRead } from './use-owners';
import { useSession } from './use-session';

/** The cap steps that draw a strip, so the Owner's counts are read only then (`M12-30`). */
const AT_CAP: ReadonlySet<string> = new Set(CAP_HELD_STEPS);

/** What the strip and the denial are built from, as both shells read it. */
export interface BillingStripReadFacts {
  readonly standing: BillingStanding;
  readonly signals: BillingUsageSignals['signals'];
  readonly audience: BillingStripAudience;
  /** The Owner's home: the amount owed, its invoice, the method and the way back. */
  readonly home: BillingHome | null;
  /** The Owner's counts, while a meter stands at its cap. */
  readonly usage: BillingUsage | null;
  /** Whose act it is, for anyone who is not the Owner. */
  readonly owners: TenantOwners | null;
}

/** How the app carries the act out: a page the product does not draw, or one of its own. */
export interface BillingStripAdapter {
  readonly openExternal: (url: string) => void;
  readonly toBillingHome: () => void;
  readonly toPlans: () => void;
}

/**
 * `SCR-SHELL-06` as both shells draw it, assembled once (Law 11): the strip's read, its one act,
 * and the latest save the billing gate refused. Everyone reads the standing and the cap signals;
 * the Owner reads the home in the standing's place, and the counts only while a cap holds.
 */
export interface BillingStripScreen {
  /** `empty` when the company has no subscription to speak of. */
  readonly read: Read<BillingStripReadFacts>;
  /** Who the strip speaks to, from the session's roles — known before any read answers. */
  readonly audience: BillingStripAudience;
  /** The act is out: it is inert and a second press sends nothing. */
  readonly acting: boolean;
  /** The act did not land. */
  readonly failed: boolean;
  act(go: BillingStripGo): void;
  /** The save the billing gate refused, until the person closes the denial. */
  readonly refusal: BlockedRefusal | null;
  dismissRefusal(): void;
}

export function useBillingStrip(adapter: BillingStripAdapter): BillingStripScreen {
  const repositories = useRepositories();
  const { blocked } = useDataLayer();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles ?? [];
  const signedIn = tenantId !== '';
  const audience = billingStripAudienceOf(roles);
  const owner = audience === 'owner';
  const home = useQuery(billingHomeRead(repositories, tenantId, signedIn && owner));
  const standing = useQuery(billingStandingRead(repositories, tenantId, signedIn && !owner));
  const signals = useQuery({
    queryKey: queryKeys.billing.usageSignals(tenantId),
    queryFn: ({ signal }) => repositories.billingUsage.signals(signal),
    enabled: signedIn,
  });
  const atCap = (signals.data?.signals ?? []).some((each) => AT_CAP.has(each.usage.step));
  const usage = useQuery({
    queryKey: queryKeys.billing.usage(tenantId),
    queryFn: ({ signal }) => repositories.billingUsage.usage(signal),
    enabled: signedIn && atCap && can(roles, 'billing.view_usage_and_invoices'),
  });
  const owners = useQuery(ownersRead(repositories, tenantId, signedIn && !owner));
  const refusal = useSyncExternalStore(blocked.subscribe, blocked.getSnapshot, blocked.getSnapshot);
  const ownerHome = home.data ?? null;
  const action = useAction((go: BillingStripGo) =>
    runStripAct(go, ownerHome, adapter, repositories),
  );

  // A refusal may mean the state moved since it was read: the strip reads it again.
  useEffect(() => {
    if (refusal !== null && signedIn) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all(tenantId) });
    }
  }, [refusal, signedIn, queryClient, tenantId]);

  const read = stripReadOf(owner ? readOf(home) : readOf(standing), {
    signals: signals.data?.signals ?? [],
    audience,
    home: ownerHome,
    usage: atCap ? (usage.data ?? null) : null,
    owners: owners.data ?? null,
  });

  return {
    read,
    audience,
    acting: action.pending,
    failed: action.failure !== null,
    act(go) {
      // Once the act has run, the denial it was taken from has done its job and closes, so the page
      // the act opened is not left under it.
      void action.run(go).then((answer) => {
        if (answer.kind === 'done') blocked.dismiss();
      });
    },
    refusal,
    dismissRefusal: () => blocked.dismiss(),
  };
}

/** The Owner's billing home as one read: the strip and the sidebar's trial count share it. */
export function billingHomeRead(repositories: Repositories, tenantId: string, enabled: boolean) {
  return {
    queryKey: queryKeys.billing.home(tenantId),
    queryFn: ({ signal }: { signal: AbortSignal }) => repositories.billing.home(signal),
    enabled,
  };
}

/** The standing everyone but the Owner reads, as one read the strip and the sidebar share. */
export function billingStandingRead(
  repositories: Repositories,
  tenantId: string,
  enabled: boolean,
) {
  return {
    queryKey: queryKeys.billing.standing(tenantId),
    queryFn: ({ signal }: { signal: AbortSignal }) => repositories.billing.standing(signal),
    enabled,
  };
}

/** The standing everyone reads — or the Owner's home, which carries it — joined with the rest. */
function stripReadOf(
  base: Read<BillingHome | BillingStanding | null>,
  rest: Omit<BillingStripReadFacts, 'standing'>,
): Read<BillingStripReadFacts> {
  if (base.kind !== 'ready') return base;
  if (base.value === null) return { kind: 'empty' };
  const standing = 'standing' in base.value ? base.value.standing : base.value;
  return { kind: 'ready', value: { standing, ...rest } };
}

/** Where each act goes (decision 5); a pay or reactivation page opens outside the app. */
async function runStripAct(
  go: BillingStripGo,
  home: BillingHome | null,
  adapter: BillingStripAdapter,
  repositories: Repositories,
): Promise<void> {
  if (go === 'billing_home') return adapter.toBillingHome();
  if (go === 'plans') return adapter.toPlans();
  if (go === 'pay_link') {
    const url = home?.due?.payUrl ?? null;
    return url === null ? adapter.toBillingHome() : adapter.openExternal(url);
  }
  const plan = home?.reactivation ?? null;
  if (plan === null) return adapter.toPlans();
  adapter.openExternal(await repositories.billing.checkout({ tier: plan.tier, cycle: plan.cycle }));
}
