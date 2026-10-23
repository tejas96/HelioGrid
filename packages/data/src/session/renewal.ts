import { canRenew, type SessionEvent, type SessionSnapshot } from '@heliogrid/domain';
import type { AuthRepository } from '../auth/repository';
import type { SessionSignals } from '../transport/transport';
import { userOf } from './wire-answers';

/**
 * What the transport reports into (`SessionSignals`), and the session read that follows a renewal.
 * A refused refresh ends the session — where it goes, and whether a refused call is worth a refresh
 * at all, are domain's (`sessionAfter`, `canRenew`). A refresh that RENEWS may carry new roles: an
 * owner's role change makes the old token stale, so the next call renews it, and the person is read
 * again — or the device would keep the old home and roles until a restart.
 */
export function createRenewal(config: {
  auth: AuthRepository;
  snapshot: () => SessionSnapshot;
  apply: (event: SessionEvent) => void;
}): { signals: SessionSignals; rereadUser: () => Promise<void> } {
  let inFlight: Promise<void> | null = null;
  let sent = 0;
  let applied = 0;

  /**
   * Every call sends its own read, so a read asked for after a save sees the save, and an answer
   * applies only when it was sent after the last one applied: an older answer landing last would put
   * back what the save changed, and a newer read that failed never blocks an older one that came back.
   * The read is held BEFORE it goes out: its own 401 renews the token, and that renewal joins it
   * instead of reading again, so it never loops.
   */
  const rereadUser = (): Promise<void> => {
    sent += 1;
    const ticket = sent;
    const read = config.auth.session().then(
      (projection) => {
        if (projection !== null && ticket > applied) {
          applied = ticket;
          config.apply({ kind: 'reread', user: userOf(projection) });
        }
      },
      () => undefined,
    );
    const held = read.finally(() => {
      if (inFlight === held) inFlight = null;
    });
    inFlight = held;
    return held;
  };

  /**
   * Only a person signed in is read again: the boot check and a page load on a lapsed token renew
   * through their own session read, which already answers who this is.
   */
  const onSessionRenewed = () => {
    const now = config.snapshot();
    if (now.status !== 'authenticated' || now.ended !== null || inFlight !== null) return;
    void rereadUser();
  };

  return {
    signals: {
      onSessionLost: (loss) => config.apply({ kind: 'lost', loss }),
      onSessionRenewed,
      couldHoldSession: () => canRenew(config.snapshot()),
    },
    rereadUser,
  };
}
