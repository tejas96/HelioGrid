'use client';
import { hasCompany, type SessionPhase, type SessionUser } from '@heliogrid/data';
import { useSession, useSessionPhase } from '@heliogrid/data/react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { COMPANY_SIGNUP_ROUTE, HOME_ROUTE, LOGIN_ROUTE } from './constants';

/** What a route group asks of its visitor: `signed-in` means a settled session WITH a company. */
type Need = 'signed-out' | 'signed-in';

/**
 * The web's one session gate, mounted once per route group by the group's layout. Nothing
 * renders while the store is still asking who the cookies belong to, and the door stays mounted
 * through the sign-in beat so "You are in" is read before the home opens — the same phase the
 * phone's navigator reads (`useSessionPhase`, Law 11).
 */
export function SessionGate({ need, children }: { need: Need; children: ReactNode }) {
  const phase = useSessionPhase();
  const { user } = useSession();
  const router = useRouter();
  const sendTo = destinationOf(need, phase, user);

  useEffect(() => {
    if (sendTo !== null) router.replace(sendTo);
  }, [sendTo, router]);

  if (phase === 'booting' || sendTo !== null) return null;
  return children;
}

/** Where a visitor who does not belong here goes; `null` keeps them. */
function destinationOf(need: Need, phase: SessionPhase, user: SessionUser | null): string | null {
  if (phase === 'booting') return null;
  if (need === 'signed-out') return phase === 'signedIn' ? landingOf(user) : null;
  if (phase !== 'signedIn') return LOGIN_ROUTE;
  return hasCompany(user) ? null : COMPANY_SIGNUP_ROUTE;
}

/** A signed-in person lands on their home, or on the company step while they have none. */
function landingOf(user: SessionUser | null): string {
  return hasCompany(user) ? HOME_ROUTE : COMPANY_SIGNUP_ROUTE;
}
