import { useRepositories, useSession } from '@heliogrid/data/react';
import { useEffect, useRef } from 'react';
import { askToPush, onPushArrived, pushToken, thisPlatform } from './messaging';

/**
 * Binds this handset to the signed-in person for as long as they are signed in (`F6-13`).
 *
 * Mounted ONCE, by the navigator. The wire is `packages/data`'s and the native calls are
 * `messaging.ts`'s; this only says when — which is the whole of the flow, and why it is a hook
 * rather than something a screen does on mount.
 *
 * Every step may legitimately answer no. A person who declines the permission, a simulator that
 * has no APNs token, a network that is down — each ends with no registration and a full inbox,
 * because the record is the truth and push is best effort (`F6-06`).
 */
export function usePushRegistration(): void {
  const { notification } = useRepositories();
  const session = useSession();
  const signedIn = session.status === 'authenticated';
  /** The token this hook registered, so sign-out forgets the right one and only once. */
  const registered = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    /* Every step may answer no, and a network that refuses is not a reason to break a screen:
       the record is the truth and the inbox already has it (`F6-06`). */
    async function bind() {
      try {
        if (!(await askToPush())) return;
        const token = await pushToken();
        if (token === null || cancelled) return;
        await notification.registerDevice({ platform: thisPlatform, token });
        if (!cancelled) registered.current = token;
      } catch {
        /* Unregistered is a legitimate state; the person keeps their whole product. */
      }
    }

    async function unbind(token: string) {
      registered.current = null;
      try {
        await notification.forgetDevice(token);
      } catch {
        /* The handset stops being pushed when the server next finds the token dead. */
      }
    }

    if (signedIn) {
      void bind();
    } else if (registered.current !== null) {
      void unbind(registered.current);
    }
    return () => {
      cancelled = true;
    };
  }, [signedIn, notification]);

  useEffect(
    () =>
      onPushArrived(() => {
        /* Arrivals are displayed by `messaging.ts`; routing to the subject lands with the first
           screen that has one to route to (`F6-02`). */
      }),
    [],
  );
}
