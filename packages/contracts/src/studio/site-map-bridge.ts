import { z } from 'zod';
import { geoPointSchema } from '../common';

/**
 * What the site map page and its host say to each other. The page is one web page that draws the
 * map under the pin; the web draws it in place, and a phone shows it in a web view and speaks
 * these messages as JSON text. The page holds no customer fact: the point arrives in a message,
 * never in the address of the page.
 *
 * An installed phone app outlives a release of the page, and the page outlives the app: each side
 * reads a message with `readSiteMapMessage`, which answers `null` for a version or a kind it does
 * not know, and the reader drops it. A change no old reader can drop is a new version beside this
 * one, never an edit of it.
 */
export const SITE_MAP_BRIDGE_VERSION = 1 as const;

const version = z.literal(SITE_MAP_BRIDGE_VERSION);

/** Host → page: the point the map centres on. Sent after `ready`, and again when the point is set from outside. */
export const siteMapShowSchema = z.object({
  v: version,
  kind: z.literal('show'),
  point: geoPointSchema,
});
export type SiteMapShow = z.infer<typeof siteMapShowSchema>;

/**
 * Page → host. `ready`: the page listens, send the point. `moved`: the map came to rest at a new
 * centre. `failed`: the map did not load; the host offers the retry. `unavailable`: this page has
 * no map to draw (no map key is set), so a retry cannot help; the host keeps its neutral grid.
 */
export const siteMapSaidSchema = z.discriminatedUnion('kind', [
  z.object({ v: version, kind: z.literal('ready') }),
  z.object({ v: version, kind: z.literal('moved'), point: geoPointSchema }),
  z.object({ v: version, kind: z.literal('failed') }),
  z.object({ v: version, kind: z.literal('unavailable') }),
]);
export type SiteMapSaid = z.infer<typeof siteMapSaidSchema>;

/** One message as its reader takes it: the parsed message, or `null` for anything else. */
export function readSiteMapMessage<Message>(
  schema: z.ZodType<Message>,
  sent: unknown,
): Message | null {
  let body = sent;
  if (typeof sent === 'string') {
    try {
      body = JSON.parse(sent);
    } catch {
      return null;
    }
  }
  const read = schema.safeParse(body);
  return read.success ? read.data : null;
}
