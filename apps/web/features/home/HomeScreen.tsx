'use client';
import { Button, Card } from '@heliogrid/ui';
import { useHome } from './hooks/use-home';
import './home.css';

/**
 * Post-login home — CRM My Day surface in the making. `home` is its own feature, not part
 * of auth (filing it under auth would guarantee a second move once My Day lands).
 */
export function HomeScreen() {
  const { meQuery, teamQuery, tenantReady } = useHome();

  if (meQuery.isLoading)
    return (
      <main className="hm-centered flex min-h-dvh items-center justify-center">
        <p>Loading your workspace…</p>
      </main>
    );

  const meData = meQuery.data;
  if (!tenantReady || meData?.status !== 200 || meData.body.tenant == null)
    return (
      <main className="flex min-h-dvh items-center justify-center p-[var(--sp-4)]">
        <div className="w-full max-w-md">
          <Card>
            <p className="hm-error" role="alert">
              Could not load your workspace.
            </p>
            <Button type="button" fullWidth onClick={() => void meQuery.refetch()}>
              Try again
            </Button>
          </Card>
        </div>
      </main>
    );

  const me = meData.body;
  const members = teamQuery.data?.status === 200 ? teamQuery.data.body.members : [];

  return (
    <main className="hm-screen mx-auto w-full max-w-2xl">
      <p className="hm-overline">{me.tenant?.name}</p>
      <h1 className="hm-title">Namaste, {me.user.name.split(' ')[0]}</h1>
      <p className="hm-meta">
        Signed in as <span className="hm-mono">{me.user.phoneE164}</span> · roles:{' '}
        {me.user.roles.join(', ') || '—'}
      </p>
      <h2 className="hm-overline hm-section-heading">Team</h2>
      {members.length ? (
        members.map((m) => (
          // Card omits `className` by design (DS components own their pixels), so the
          // route's spacing goes on a wrapper rather than into the component.
          <div key={m.userId} className="hm-member">
            <Card density="functional">
              <div className="flex items-center justify-between gap-[var(--sp-4)]">
                <div>
                  <p className="hm-member-name">{m.name}</p>
                  <p className="hm-member-phone">{m.phoneE164}</p>
                </div>
                <p className="hm-roles">{m.roles.join(' · ')}</p>
              </div>
            </Card>
          </div>
        ))
      ) : (
        <p className="hm-roles">Just you so far — invites arrive with the auth module.</p>
      )}
    </main>
  );
}
