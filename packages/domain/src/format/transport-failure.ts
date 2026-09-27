/**
 * The ways a request ends with no answer from HelioGrid's API that the client can read (`F8-36`).
 * The server's own refusals are not here: they carry the server's code and the server's words.
 *
 * None of these knows whether the server applied a write. A connection can drop after the server
 * committed, a timeout can fire on a request that landed, and an unreadable answer may have been a
 * success — so no failure here may be worded as "it failed" or as "nothing was saved".
 *
 * - `no_connection` — no socket, a refused one, or one dropped mid-request. On web a proxy's error
 *   page with no CORS header lands here too, so HelioGrid may be what is down, not the network.
 * - `no_answer` — the client's deadline passed with nothing back.
 * - `unreadable_answer` — an answer that is not HelioGrid's envelope or not the contract's shape.
 * - `cancelled` — the caller stopped the request, usually because the person left the screen.
 */
export const TRANSPORT_FAILURES = [
  'no_connection',
  'no_answer',
  'unreadable_answer',
  'cancelled',
] as const;

export type TransportFailure = (typeof TRANSPORT_FAILURES)[number];
