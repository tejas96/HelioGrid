'use client';
import { useSession, useSessionPhase } from '@heliogrid/data/react';
import { landingFor, type SessionLanding } from '@heliogrid/domain';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { ROUTE_OF } from './constants';

/** What a route group asks of its visitor: `signed-in` means a settled session WITH a company. */
type Need = 'signed-out' | 'signed-in';

/**
 * The web's one session gate, mounted once per route group by the group's layout. Nothing
 * renders while the store is still asking who the cookies belong to, and the door stays mounted
 * through the sign-in beat so "You are in" is read before the home opens — the same phase the
 * phone's navigator reads (`useSessionPhase`, Law 11).
 *
 * A person whose access was removed while signed in is held (`S1.wrong.4`), and the web has no
 * frame that says so yet (`T-SHELL-008`): the signed-in group signs them out, once, and the
 * plain door follows. Holding them at `/login` would leave the door saying "You are in".
 */
export function SessionGate({ need, children }: { need: Need; children: ReactNode }) {
  const phase = useSessionPhase();
  const { user, ended, signOut } = useSession();
  const router = useRouter();
  const landing = landingFor(phase, user, ended);
  const sendTo = destinationOf(need, landing);
  const signingOut = useRef(false);

  useEffect(() => {
    if (sendTo !== null) router.replace(sendTo);
  }, [sendTo, router]);

  useEffect(() => {
    if (need !== 'signed-in' || landing !== 'access-removed' || signingOut.current) return;
    signingOut.current = true;
    void signOut();
  }, [need, landing, signOut]);

  if (landing === 'wait' || landing === 'access-removed' || sendTo !== null) return null;
  return children;
}

/**
 * Where a visitor who does not belong here goes; `null` keeps them. The landing itself is
 * `landingFor` — the same function the phone's navigator branches on, so `M01-10`'s rule is
 * answered once rather than twice in two shapes.
 */
function destinationOf(need: Need, landing: SessionLanding): string | null {
  if (landing === 'wait' || landing === 'access-removed') return null;
  // A group for signed-OUT visitors keeps anyone still at the door and moves anyone past it.
  if (need === 'signed-out') return landing === 'door' ? null : ROUTE_OF[landing];
  // A signed-IN group keeps only a person who belongs inside with a company.
  return landing === 'home' ? null : ROUTE_OF[landing];
}
