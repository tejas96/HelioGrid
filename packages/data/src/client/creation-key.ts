import { IDEMPOTENCY_KEY_HEADER } from '@heliogrid/contracts';

/**
 * The retry key a create carries (`F4-07`), held for ONE submission: the same input sent again —
 * a second tap after a dropped connection, whose first answer never arrived — carries the same
 * key, so the server answers with the record the first send made instead of making another. A
 * success or a changed input starts a new key: a person who fixes a form and sends again is
 * making a new request, and one who adds a second identical record on purpose after the first
 * succeeded gets a second record.
 *
 * Held in memory, per repository: an app killed mid-send loses the key, and a relaunch reads what
 * the server holds instead of retrying (`T-FPLAT-011`, out of scope).
 */
export interface CreationKeys {
  /** The headers for this send: the held key when the input is the one it was made for. */
  headersFor(input: unknown): { [IDEMPOTENCY_KEY_HEADER]: string };
  /** The send succeeded: the next one is a new submission. */
  settle(): void;
}

export function createCreationKeys(): CreationKeys {
  let held: { readonly input: string; readonly key: string } | null = null;
  return {
    headersFor(input) {
      const sent = JSON.stringify(input);
      if (held === null || held.input !== sent) held = { input: sent, key: aKey() };
      return { [IDEMPOTENCY_KEY_HEADER]: held.key };
    },
    settle() {
      held = null;
    },
  };
}

/**
 * A version-4 uuid. It needs no secrecy — the server binds a key to the person who sent it — so
 * `Math.random` serves both platforms, where `crypto.randomUUID` is absent from the phone's engine.
 */
function aKey(): string {
  const hex = (digits: number) =>
    Array.from({ length: digits }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const variant = (8 + Math.floor(Math.random() * 4)).toString(16);
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${variant}${hex(3)}-${hex(12)}`;
}
