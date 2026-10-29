'use client';
import { isSetupLanding, type SessionLanding, type SetupLanding } from '@heliogrid/domain';
import { useLanding } from './use-landing';
import { useSession } from './use-session';
import { useSessionPhase } from './use-session-phase';

/** What a route group asks of its visitor: `signed-in` is a settled session WITH a company. */
export type GateNeed = 'signed-out' | 'signed-in';

/**
 * A route group's gate, assembled once (Law 11, `F7-30`): where the visitor belongs and whether
 * this group keeps them. The landing is a decision, never a route — the app maps it to its own.
 */
export interface SessionGateView {
  /** The boot check got no answer (`M01-07`): the gate draws the retry screen in the group's place. */
  readonly unreachable: boolean;
  /** Where the visitor belongs (`useLanding`); `wait` while nothing is known, and nothing renders. */
  readonly landing: SessionLanding;
  /** The visitor belongs in another group: the gate sends them to their landing's route. */
  readonly leaves: boolean;
  /** The landing opens the link a person followed while signed out: the home, and a setup step before it. */
  readonly opensTheLink: boolean;
  /** The setup step drawn in the group's place (`SCR-M01-03`…`07`); `null` draws the group's page. */
  readonly setupStep: SetupLanding | null;
}

/**
 * Fills `SessionGateView` for a group that needs `need`. The phase is computed here, once per
 * gate, because it owns a dwell timer (`useSessionPhase`).
 */
export function useSessionGate(need: GateNeed): SessionGateView {
  const { unreachable } = useSession();
  const landing = useLanding(useSessionPhase());
  return {
    unreachable,
    landing,
    leaves: leavesFor(need, landing),
    opensTheLink: opensTheLink(landing),
    setupStep: isSetupLanding(landing) ? landing : null,
  };
}

function opensTheLink(landing: SessionLanding): boolean {
  return landing === 'home' || isSetupLanding(landing);
}

/**
 * Whether a visitor does not belong in this group. The landing itself is `landingFor` — the same
 * function the phone's navigator branches on, so `M01-10`'s rule is answered once.
 */
function leavesFor(need: GateNeed, landing: SessionLanding): boolean {
  if (landing === 'wait') return false;
  // A group for signed-OUT visitors keeps anyone still at the door and moves anyone past it.
  if (need === 'signed-out') return landing !== 'door';
  // A signed-IN group keeps a person who belongs inside with a company, one held there, and one
  // who owes a setup step, which is drawn here.
  return !(opensTheLink(landing) || landing === 'access-removed');
}
