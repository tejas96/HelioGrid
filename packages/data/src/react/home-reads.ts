import { MAX_PAGE_LIMIT } from '@heliogrid/contracts';
import type { SetupFacts } from '@heliogrid/domain';
import { queryKeys } from '../cache/keys';
import type { Repositories } from '../data-layer';

/**
 * The reads Home judges setup by, each under the key its own page reads, so a save on that page
 * moves Home too (the page's invalidation names the same key or its prefix). Each answers only the
 * fact Home needs.
 */
type Fact<T> = {
  queryKey: readonly unknown[];
  queryFn: (context: { signal: AbortSignal }) => Promise<T>;
  enabled: boolean;
};

export function profileFactRead(
  repositories: Repositories,
  tenantId: string,
  enabled: boolean,
): Fact<Awaited<ReturnType<Repositories['settings']['businessProfile']>>> {
  return {
    queryKey: queryKeys.settings.businessProfile(tenantId),
    queryFn: ({ signal }) => repositories.settings.businessProfile(signal),
    enabled,
  };
}

export function registrationsFactRead(
  repositories: Repositories,
  tenantId: string,
  enabled: boolean,
): Fact<Awaited<ReturnType<Repositories['settings']['taxRegistrations']>>> {
  return {
    queryKey: queryKeys.settings.taxRegistrations(tenantId),
    queryFn: ({ signal }) => repositories.settings.taxRegistrations(signal),
    enabled,
  };
}

export function templateFactRead(
  repositories: Repositories,
  tenantId: string,
  enabled: boolean,
): Fact<Awaited<ReturnType<Repositories['settings']['proposalTemplate']>>> {
  return {
    queryKey: queryKeys.settings.proposalTemplate(tenantId),
    queryFn: ({ signal }) => repositories.settings.proposalTemplate(signal),
    enabled,
  };
}

export function paymentTermsFactRead(
  repositories: Repositories,
  tenantId: string,
  enabled: boolean,
): Fact<Awaited<ReturnType<Repositories['settings']['trancheTemplates']>>> {
  return {
    queryKey: queryKeys.settings.trancheTemplates(tenantId),
    queryFn: ({ signal }) => repositories.settings.trancheTemplates(signal),
    enabled,
  };
}

/** Releases published, counted by the list's own total: a proposal prices only from a release. */
export function releasesFactRead(
  repositories: Repositories,
  tenantId: string,
  enabled: boolean,
): Fact<number> {
  return {
    queryKey: [...queryKeys.catalog.releases(tenantId), 'count'],
    queryFn: async ({ signal }) =>
      (await repositories.catalog.releases({ page: 1, limit: 1 }, signal)).totalCount,
    enabled,
  };
}

/** Invitations still out: under the invites key, so a sent or revoked one moves it. */
export function pendingInvitesFactRead(
  repositories: Repositories,
  tenantId: string,
  enabled: boolean,
): Fact<number> {
  return {
    queryKey: [...queryKeys.team.invites(tenantId), 'pending'],
    queryFn: async ({ signal }) =>
      (await repositories.invitation.list({ page: 1, limit: MAX_PAGE_LIMIT }, signal)).items.filter(
        ({ status }) => status === 'pending',
      ).length,
    enabled,
  };
}

/** The profile's facts the readiness judges, from the stored profile and its registrations. */
export function profileFacts(
  profile: Awaited<ReturnType<Repositories['settings']['businessProfile']>> | undefined,
  registrations: Awaited<ReturnType<Repositories['settings']['taxRegistrations']>> | undefined,
): SetupFacts['profile'] {
  if (profile === undefined || registrations === undefined) return null;
  return {
    address: (profile.address ?? '').trim() !== '',
    bank: profile.bankDetails !== null,
    registrations: registrations.registrations.length,
    logo: (profile.logoFileId ?? null) !== null,
  };
}
