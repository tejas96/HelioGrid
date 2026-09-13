'use client';
import { useSession, useSessionPhase } from '@heliogrid/data/react';
import { landingFor, type SessionPhase, type SessionUser } from '@heliogrid/domain';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { ROUTE_OF } from './constants';

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

/**
 * Where a visitor who does not belong here goes; `null` keeps them. The landing itself is
 * `landingFor` — the same function the phone's navigator branches on, so `M01-10`'s rule is
 * answered once rather than twice in two shapes.
 */
function destinationOf(need: Need, phase: SessionPhase, user: SessionUser | null): string | null {
  const landing = landingFor(phase, user);
  if (landing === 'wait') return null;
  // A group for signed-OUT visitors keeps anyone still at the door and moves anyone past it.
  if (need === 'signed-out') return landing === 'door' ? null : ROUTE_OF[landing];
  // A signed-IN group keeps only a person who belongs inside with a company.
  return landing === 'home' ? null : ROUTE_OF[landing];
}
