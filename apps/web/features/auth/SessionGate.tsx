'use client';
import { useSession, useSessionPhase } from '@heliogrid/data/react';
import { landingFor, type SessionLanding } from '@heliogrid/domain';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { ROUTE_OF } from './constants';
import { forgetReturnPath, keepReturnPath, keptReturnPath } from './return-path';
import { UnreachableScreen } from './UnreachableScreen';

/** What a route group asks of its visitor: `signed-in` means a settled session WITH a company. */
type Need = 'signed-out' | 'signed-in';

/**
 * The web's one session gate, mounted once per route group by the group's layout. Nothing
 * renders while the store is still asking who the cookies belong to, and the door stays mounted
 * through the sign-in beat so "You are in" is read before the home opens — the same phase the
 * phone's navigator reads (`useSessionPhase`, Law 11).
 *
 * A person whose access was removed while signed in is held (`S1.wrong.4`): the signed-in group
 * keeps them on the route they are on, where the shell shows Frame 8, and the door group sends them
 * inside — held at `/login`, the door would say "You are in".
 *
 * A visitor the signed-in group turns away has their address kept, and the door sends them back to
 * it once they are in (`M01-61`). One who was inside and left is not followed: after a sign-out the
 * next person in this tab starts at their own home.
 */
export function SessionGate({ need, children }: { need: Need; children: ReactNode }) {
  const phase = useSessionPhase();
  const { user, ended, unreachable } = useSession();
  const router = useRouter();
  const landing = landingFor(phase, user, ended);
  const sendTo = destinationOf(need, landing);

  useEffect(() => {
    if (landing === 'wait') return;
    if (sendTo === null) {
      if (need === 'signed-in') forgetReturnPath();
      return;
    }
    if (need === 'signed-in') keepReturnPath();
    const backToTheLink = need === 'signed-out' && landing === 'home' ? keptReturnPath() : null;
    router.replace(backToTheLink ?? sendTo);
  }, [need, landing, sendTo, router]);

  if (unreachable) return <UnreachableScreen />;
  if (landing === 'wait' || sendTo !== null) return null;
  return children;
}

/**
 * Where a visitor who does not belong here goes; `null` keeps them. The landing itself is
 * `landingFor` — the same function the phone's navigator branches on, so `M01-10`'s rule is
 * answered once rather than twice in two shapes.
 */
function destinationOf(need: Need, landing: SessionLanding): string | null {
  if (landing === 'wait') return null;
  // A group for signed-OUT visitors keeps anyone still at the door and moves anyone past it.
  if (need === 'signed-out') return landing === 'door' ? null : ROUTE_OF[landing];
  // A signed-IN group keeps a person who belongs inside with a company, and one held there.
  return landing === 'home' || landing === 'access-removed' ? null : ROUTE_OF[landing];
}
