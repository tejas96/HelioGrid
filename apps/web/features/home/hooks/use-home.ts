'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '../../../lib/api-client';

/**
 * Post-login home controller — on the TYPED client, so request/response shapes are
 * compile-checked against packages/contracts (a mismatch is a build error, not a runtime
 * bug). Owns the redirect rules: no session → /login, no tenant yet → /onboarding.
 */
export function useHome() {
  const router = useRouter();
  const meQuery = api.auth.me.useQuery(['me']);
  const tenantReady = meQuery.data?.status === 200 && meQuery.data.body.tenant != null;
  const teamQuery = api.auth.listTeam.useQuery(
    ['team'],
    {},
    { queryKey: ['team'], enabled: tenantReady },
  );

  useEffect(() => {
    if (meQuery.error && 'status' in meQuery.error && meQuery.error.status === 401) {
      router.push('/login');
      return;
    }
    if (meQuery.data?.status === 200 && meQuery.data.body.tenant == null) {
      router.push('/onboarding');
    }
  }, [meQuery.data, meQuery.error, router]);

  return { meQuery, teamQuery, tenantReady };
}
