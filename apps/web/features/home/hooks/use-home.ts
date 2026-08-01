'use client';
import { useSession } from '@heliogrid/data/react';

/**
 * Post-login home controller. `api.auth.me` and `api.auth.listTeam` were removed with auth
 * (owner ruling 2026-08-01): identity now comes from the session, and the team list returns
 * with the module that owns it. The redirect rules return with the auth rebuild that owns
 * them — inventing them here would put a requirement in a screen.
 */
export function useHome() {
  const { user } = useSession();
  return { user };
}
