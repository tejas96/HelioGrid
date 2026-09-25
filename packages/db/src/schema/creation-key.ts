import { text, uuid } from 'drizzle-orm/pg-core';

/**
 * The retry key a create carried, and what it was sent with (`F4-07`): a second send with the same
 * key finds this row instead of writing another. Both are written once, in the insert, and are
 * null on a row made without a key — every row older than this release, and every send from an
 * app that has not updated. The fingerprint is sha-256 over the actor, the route and the parsed
 * body, so the key answers only the request that made it. One definition for every table a
 * create route writes, so the pair cannot differ between them.
 */
export function creationKeyColumns() {
  return {
    creationKey: uuid('creation_key'),
    creationFingerprint: text('creation_fingerprint'),
  };
}
