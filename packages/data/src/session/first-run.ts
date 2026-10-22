import type { FirstRunCarry, SessionUser } from '@heliogrid/domain';

/**
 * The one step that follows a join, held in memory for this visit (`SCR-M01-09` ruling 17): a
 * reload or another device never sees it, and it belongs to the person the join admitted alone,
 * so a sign-out or a switch to another account leaves nothing to show.
 */
export interface FirstRunHold {
  /** The step owed to `user`, or `null`. */
  owedTo(user: SessionUser | null): FirstRunCarry | null;
  hold(userId: string, carry: FirstRunCarry): void;
  end(): void;
}

export function createFirstRunHold(): FirstRunHold {
  let held: { readonly userId: string; readonly carry: FirstRunCarry } | null = null;
  return {
    owedTo: (user) => (user !== null && held?.userId === user.id ? held.carry : null),
    hold: (userId, carry) => {
      held = { userId, carry };
    },
    end: () => {
      held = null;
    },
  };
}
