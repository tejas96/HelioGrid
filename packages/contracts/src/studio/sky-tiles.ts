import { SKY_PICTURE_GAPS, SKY_PICTURE_SOURCES } from '@heliogrid/domain';
import { z } from 'zod';
import { extensibleEnum } from '../common';
import { designParamsSchema } from './design';
import { calendarDaySchema } from './document';

/*
 * The sky picture as tiles (`T-M05-002a`): the studio first asks what a site's picture is and what
 * of it it may fetch, then asks tile by tile for the ground its camera sees. A tile is the map
 * service's own bytes, never stored: the reader's browser may keep it as the service allows.
 */

/** The header a tile is asked with: the ticket the site's picture facts came with. */
export const SKY_TICKET_HEADER = 'x-sky-ticket' as const;
/** The map service did not answer for a tile: the same tile may be asked for again. */
export const SKY_TILE_UNAVAILABLE = 'SKY_TILE_UNAVAILABLE' as const;

/** The finest zoom any map service cuts its tiles at: no tile is asked for past it. */
const ZOOM_CEILING = 22;

/** A box of the site's ground, in metres east and north of the pin (domain's `GroundBox`). */
const groundBoxSchema = z.object({
  west: z.number().finite(),
  east: z.number().finite(),
  south: z.number().finite(),
  north: z.number().finite(),
});

/** What a site's sky picture is, and the pass to fetch its tiles — or why there is none. */
export const skyTilesSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('tiles'),
    source: extensibleEnum(SKY_PICTURE_SOURCES),
    /** The provider's credit line, as the provider words it. */
    credit: z.string(),
    /** The picture's real detail: the ground one pixel of the provider's own picture covers. */
    metresPerPixel: z.number().positive(),
    /** `YYYY-MM-DD`, or `null` when the provider does not say. */
    takenOn: calendarDaySchema.nullable(),
    /** Sent back with every tile asked for. It names this reader, this design and what follows. */
    ticket: z.string().min(1),
    /** When the ticket runs out: the studio asks for these facts again before it does. */
    ticketUntil: z.string().datetime(),
    /** The coarsest zoom, whose few tiles cover the whole reach, and the finest that holds detail. */
    zoomMin: z.number().int().nonnegative(),
    zoomMax: z.number().int().nonnegative(),
    /** The ground the picture may be fetched for; no tile wholly past it is given. */
    reach: groundBoxSchema,
  }),
  z.object({ kind: z.literal('none'), gap: extensibleEnum(SKY_PICTURE_GAPS) }),
]);
export type SkyTilesWire = z.infer<typeof skyTilesSchema>;

/** One tile of a design's sky picture: its zoom, its column from the west, its row from the north. */
export const skyTileParamsSchema = designParamsSchema.extend({
  z: z.coerce.number().int().min(0).max(ZOOM_CEILING),
  x: z.coerce.number().int().nonnegative(),
  y: z.coerce.number().int().nonnegative(),
});

export const skyTileHeadersSchema = z.object({ [SKY_TICKET_HEADER]: z.string().min(1) });
