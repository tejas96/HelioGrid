'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/auth-client';

interface Me {
  user: { id: string; name: string; phoneE164: string; language: string; roles: string[] };
  tenant: { id: string; name: string; slug: string; segment: string | null } | null;
}
interface Team {
  members: { userId: string; name: string; phoneE164: string; roles: string[]; status: string }[];
}

/** Post-login home: workspace summary + team (YoureReady/TeamRoles read view). */
export default function Home() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    const res = await api<Me>('/auth/me');
    if (res.status === 401) return router.push('/login');
    if (res.status !== 200) return setState('error');
    if (!res.body.tenant) return router.push('/onboarding');
    setMe(res.body);
    const teamRes = await api<Team>('/auth/team');
    if (teamRes.status === 200) setTeam(teamRes.body);
    setState('ready');
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === 'loading')
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="hg-muted">Loading your workspace…</p>
      </main>
    );
  if (state === 'error' || !me?.tenant)
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <section className="hg-card w-full max-w-md">
          <p className="hg-error" role="alert">
            Could not load your workspace.
          </p>
          <button type="button" className="hg-btn-primary w-full" onClick={() => void load()}>
            Try again
          </button>
        </section>
      </main>
    );

  return (
    <main className="mx-auto w-full max-w-2xl p-[var(--screen-pad-desktop)]">
      <p className="hg-overline">{me.tenant.name}</p>
      <h1 className="hg-h1">Namaste, {me.user.name.split(' ')[0]}</h1>
      <p className="hg-muted">
        Signed in as <span className="hg-mono">{me.user.phoneE164}</span> · roles:{' '}
        {me.user.roles.join(', ') || '—'}
      </p>
      <h2 className="hg-overline" style={{ marginTop: 'var(--sp-8)' }}>
        Team
      </h2>
      {team?.members.length ? (
        team.members.map((m) => (
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
        <p className="hg-muted">Just you so far — invites arrive with the next slice.</p>
      )}
    </main>
  );
}
