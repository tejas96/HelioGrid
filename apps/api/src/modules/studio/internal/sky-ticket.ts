import { timingSafeEqual } from 'node:crypto';
import { SKY_TICKET_SECONDS, type SkyTileRange, type SkyTileZooms } from '@heliogrid/domain';
import { keyedSecret } from '../../../common/auth/secrets';
import type { SourceMarket } from './sky-picture-source';

/*
 * The ticket a design's sky tiles are asked with (`T-M05-002a`): what the reader may fetch, signed
 * with the api's token secret, so a tile is checked without reading the design again. It names the
 * company, the design and the person it was given to, the market the provider is asked in, the
 * zooms and the tiles its reach covers, and when it runs out. It is no credential: the session is still checked on every tile.
 */

const MS_PER_SECOND = 1_000;

export interface SkyTicket extends SkyTileZooms, SourceMarket {
  readonly tenantId: string;
  readonly designId: string;
  readonly userId: string;
  /** The tiles the site's reach covers at `zoomMax`. */
  readonly reach: SkyTileRange;
  /** Seconds since the epoch. */
  readonly expiresAt: number;
}

const signatureOf = (key: string, body: string): string => keyedSecret(key, `sky-ticket:${body}`);

/** A ticket for these facts, good from `now` for `SKY_TICKET_SECONDS`. */
export function mintSkyTicket(
  key: string,
  facts: Omit<SkyTicket, 'expiresAt'>,
  now: number,
): { readonly ticket: string; readonly until: Date } {
  const expiresAt = Math.floor(now / MS_PER_SECOND) + SKY_TICKET_SECONDS;
  const { tenantId, designId, userId, region, language, zoomMin, zoomMax, reach } = facts;
  const body = Buffer.from(
    JSON.stringify([
      tenantId,
      designId,
      userId,
      region,
      language,
      zoomMin,
      zoomMax,
      reach.x0,
      reach.y0,
      reach.x1,
      reach.y1,
      expiresAt,
    ]),
  ).toString('base64url');
  return {
    ticket: `${body}.${signatureOf(key, body)}`,
    until: new Date(expiresAt * MS_PER_SECOND),
  };
}

const isText = (value: unknown): value is string => typeof value === 'string';
const isWhole = (value: unknown): value is number => Number.isSafeInteger(value);

/** What a ticket says, or `null` when it was not made with this key or has run out. */
export function readSkyTicket(key: string, ticket: string, now: number): SkyTicket | null {
  const [body = '', signature = '', ...rest] = ticket.split('.');
  if (rest.length > 0) return null;
  const expected = Buffer.from(signatureOf(key, body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  // Signed by this api, so its shape is its own; it is still read as an untrusted value.
  let said: unknown;
  try {
    said = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!Array.isArray(said)) return null;
  const [
    tenantId,
    designId,
    userId,
    region,
    language,
    zoomMin,
    zoomMax,
    x0,
    y0,
    x1,
    y1,
    expiresAt,
  ] = said;
  if (![tenantId, designId, userId, region, language].every(isText)) return null;
  if (![zoomMin, zoomMax, x0, y0, x1, y1, expiresAt].every(isWhole)) return null;
  if (expiresAt * MS_PER_SECOND < now) return null;
  return {
    tenantId,
    designId,
    userId,
    region,
    language,
    zoomMin,
    zoomMax,
    reach: { x0, y0, x1, y1 },
    expiresAt,
  };
}
