import type { FirstRunCarry, SessionUser } from '@heliogrid/domain';

/**
 * The steps that follow a join, held in memory for this visit (`SCR-M01-09` ruling 17): a reload or
 * another device never sees them, and they belong to the person the join admitted alone, so a
 * sign-out or a switch to another account leaves nothing to show. First-Run Profile is owed until
 * its save; the carry stays until the role card's act (`SCR-M01-10`), whose heading and credit line
 * draw from it before their own reads land.
 */
export interface FirstRunHold {
  /** First-Run Profile, while it is owed to `user`; `null` once saved or not owed. */
  owedTo(user: SessionUser | null): FirstRunCarry | null;
  /** What the join told `user`, until the role card's act; `null` when nothing is held. */
  carryFor(user: SessionUser | null): FirstRunCarry | null;
  hold(userId: string, carry: FirstRunCarry): void;
  /** First-Run Profile is done; the carry stays for the role card. */
  profileSaved(): void;
  end(): void;
}

export function createFirstRunHold(): FirstRunHold {
  let held: {
    readonly userId: string;
    readonly carry: FirstRunCarry;
    readonly profileOwed: boolean;
  } | null = null;
  const carryFor = (user: SessionUser | null) =>
    user !== null && held?.userId === user.id ? held.carry : null;
  return {
    owedTo: (user) => (held?.profileOwed ? carryFor(user) : null),
    carryFor,
    hold: (userId, carry) => {
      held = { userId, carry, profileOwed: true };
    },
    profileSaved: () => {
      if (held !== null) held = { ...held, profileOwed: false };
    },
    end: () => {
      held = null;
    },
  };
}

/** The store's first-run calls, each read against the person signed in now. */
export function firstRunCalls(hold: FirstRunHold, signedIn: () => SessionUser | null) {
  return {
    firstRunOwed: () => hold.owedTo(signedIn()),
    firstRunCarry: () => hold.carryFor(signedIn()),
    profileSaved: hold.profileSaved,
    endFirstRun: hold.end,
  };
}
