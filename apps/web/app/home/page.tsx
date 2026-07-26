'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '../../lib/api-client';

/**
 * Post-login home on the TYPED client — request/response shapes are compile-checked
 * against packages/contracts (a mismatch is a build error, not a runtime bug).
 */
export default function Home() {
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

  if (meQuery.isLoading)
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="hg-muted">Loading your workspace…</p>
      </main>
    );

  const meData = meQuery.data;
  if (!tenantReady || meData?.status !== 200 || meData.body.tenant == null)
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <section className="hg-card w-full max-w-md">
          <p className="hg-error" role="alert">
            Could not load your workspace.
          </p>
          <button
            type="button"
            className="hg-btn-primary w-full"
            onClick={() => void meQuery.refetch()}
          >
            Try again
          </button>
        </section>
      </main>
    );

  const me = meData.body;
  const members = teamQuery.data?.status === 200 ? teamQuery.data.body.members : [];

  return (
    <main className="mx-auto w-full max-w-2xl p-[var(--screen-pad-desktop)]">
      <p className="hg-overline">{me.tenant?.name}</p>
      <h1 className="hg-h1">Namaste, {me.user.name.split(' ')[0]}</h1>
      <p className="hg-muted">
        Signed in as <span className="hg-mono">{me.user.phoneE164}</span> · roles:{' '}
        {me.user.roles.join(', ') || '—'}
      </p>
      <h2 className="hg-overline" style={{ marginTop: 'var(--sp-8)' }}>
        Team
      </h2>
      {members.length ? (
        members.map((m) => (
          <div className="hg-list-row" key={m.userId}>
            <div>
              <p style={{ fontWeight: 'var(--fw-medium)' }}>{m.name}</p>
              <p className="hg-muted hg-mono" style={{ marginTop: 0 }}>
                {m.phoneE164}
              </p>
            </div>
            <p className="hg-muted">{m.roles.join(' · ')}</p>
          </div>
        ))
      ) : (
        <p className="hg-muted">Just you so far — invites arrive with the auth module.</p>
      )}
    </main>
  );
}
