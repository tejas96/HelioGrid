'use client';
import { Card } from '@heliogrid/ui';
import { useHome } from './hooks/use-home';
import './home.css';

/**
 * Post-login home — CRM My Day surface in the making. `home` is its own feature, not part
 * of auth (filing it under auth would guarantee a second move once My Day lands).
 */
export function HomeScreen() {
  const { user } = useHome();

  if (!user)
    return (
      <main className="flex min-h-dvh items-center justify-center p-[var(--sp-4)]">
        <div className="w-full max-w-md">
          <Card>
            <p className="hm-error" role="alert">
              Could not load your workspace.
            </p>
          </Card>
        </div>
      </main>
    );

  return (
    <main className="hm-screen mx-auto w-full max-w-2xl">
      <p className="hm-overline">{user.tenant?.name}</p>
      <h1 className="hm-title">Namaste, {user.name.split(' ')[0]}</h1>
      <p className="hm-meta">
        Signed in as <span className="hm-mono">{user.phoneE164}</span>
      </p>
      <h2 className="hm-overline hm-section-heading">Team</h2>
      {/*
       * The member-card list is absent, not hidden: `listTeam` went with the auth teardown
       * (owner ruling 2026-08-01) and there is no contract type left to render a member
       * against. Declaring one HERE to keep the markup alive is the defect the repo warns
       * about — a screen inventing a shape the server never returns. The `hm-member*`
       * styles stay in home.css so the rebuild restores the list without redesigning it.
       */}
      <p className="hm-roles">Just you so far — invites arrive with the auth module.</p>
    </main>
  );
}
