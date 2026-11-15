import { timingSafeEqual } from 'node:crypto';
import { keyedSecret } from '../../../common/auth/secrets';

/*
 * The grant the PDF's renderer reads a version with (`T-M06-017`): a short-lived signature over the
 * version's id and its own expiry, keyed on the api's token secret. The print page is public —
 * a browser with no session draws it — so the grant is what stands between a version id, which is
 * not a secret, and the document. It names no person and outlives no render.
 */

/** A render takes seconds; a grant that lasted longer would be a link someone could keep. */
const PRINT_GRANT_SECONDS = 300;

const MS_PER_SECOND = 1_000;

function signatureOf(key: string, versionId: string, expiresAt: number): string {
  return keyedSecret(key, `proposal-print:${versionId}:${expiresAt}`);
}

/** A grant for one version, good from `now` for `PRINT_GRANT_SECONDS`. */
export function mintPrintGrant(key: string, versionId: string, now: number): string {
  const expiresAt = Math.floor(now / MS_PER_SECOND) + PRINT_GRANT_SECONDS;
  return `${expiresAt}.${signatureOf(key, versionId, expiresAt)}`;
}

/** Whether `grant` was minted for this version with this key and has not run out. */
export function printGrantHolds(
  key: string,
  versionId: string,
  grant: string,
  now: number,
): boolean {
  const [expiry = '', signature = ''] = grant.split('.');
  const expiresAt = Number(expiry);
  if (!Number.isSafeInteger(expiresAt) || expiresAt * MS_PER_SECOND < now) return false;
  const expected = Buffer.from(signatureOf(key, versionId, expiresAt));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
