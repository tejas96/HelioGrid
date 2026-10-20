'use client';
import { useLanding, useSession, useSessionPhase } from '@heliogrid/data/react';
import { isSetupLanding, type SessionLanding, type SetupLanding } from '@heliogrid/domain';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { ROUTE_OF } from './constants';
import { forgetReturnPath, keepReturnPath, keptReturnPath } from './return-path';
import { UnreachableScreen } from './UnreachableScreen';

/**
 * What a route group asks of its visitor: `signed-in` means a settled session WITH a company. That
 * group also hands in the setup steps, one per setup landing, which this gate draws in the group's
 * place — required there, so a signed-in group that forgets one does not compile and can never
 * show a blank page.
 */
type GateProps = { children: ReactNode } & (
  | { need: 'signed-out' }
  | { need: 'signed-in'; setupSteps: Record<SetupLanding, ReactNode> }
);
type Need = GateProps['need'];

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
 *
 * An owner who owes a setup step (`SCR-M01-03`, `SCR-M01-04`, `SCR-M01-05`, `SCR-M01-07`, `SCR-M01-06`) is inside, at the address they asked
 * for: the step is drawn there in the group's place and has no address of its own, so the link
 * they opened is the page that follows it and Back has no step to return to.
 */
export function SessionGate(props: GateProps) {
  const { need, children } = props;
  const phase = useSessionPhase();
  const { unreachable } = useSession();
  const router = useRouter();
  const landing = useLanding(phase);
  const sendTo = destinationOf(need, landing);

  useEffect(() => {
    if (landing === 'wait') return;
    if (sendTo === null) {
      if (need === 'signed-in') forgetReturnPath();
      return;
    }
    if (need === 'signed-in') keepReturnPath();
    const backToTheLink = need === 'signed-out' && opensTheLink(landing) ? keptReturnPath() : null;
    router.replace(backToTheLink ?? sendTo);
  }, [need, landing, sendTo, router]);

  if (unreachable) return <UnreachableScreen />;
  if (landing === 'wait' || sendTo !== null) return null;
  return props.need === 'signed-in' && isSetupLanding(landing)
    ? props.setupSteps[landing]
    : children;
}

/** The landings that open the link a person followed while signed out: the home, and a setup step before it. */
function opensTheLink(landing: SessionLanding): boolean {
  return landing === 'home' || isSetupLanding(landing);
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
  // A signed-IN group keeps a person who belongs inside with a company, one held there, and one
  // who owes a setup step, which is drawn here.
  return opensTheLink(landing) || landing === 'access-removed' ? null : ROUTE_OF[landing];
}
