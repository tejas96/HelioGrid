import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DesignPictureWire, PlanLines } from '@heliogrid/contracts';
import { afterEach } from 'vitest';
import { send } from './origin-wire';

/**
 * A design's own pictures through the real client (`T-M05-002d`): the origin keeps each picture
 * the test lays, and serves its plan's lines at the link the picture names.
 */

type Route = (req: IncomingMessage, res: ServerResponse, path: string) => boolean;

const ADDED_AT = '2026-11-10T05:00:00.000Z';
const LINK_ENDS = '2026-11-10T05:05:00.000Z';
const PICTURE = /^\/designs\/[^/]+\/pictures\/([^/]+)$/;
const LINES = /^\/plan-lines\/([^/]+)\/(\d+)$/;

/** The pictures the origin holds, by id, and each plan's lines by page. */
export const pictures = new Map<string, { kind: 'plan'; name: string; pages: PlanLines[] }>();

afterEach(() => {
  pictures.clear();
});

/** A plan of the given pages, its page 1 a 12 × 8 m house drawn in millimetres. */
export function aPlan(id: string, pages = 1): void {
  const page = (n: number): PlanLines => ({
    page: n,
    extent: { west: 0, south: 0, east: 12_000, north: 8_000 },
    lines: [{ points: [0, 0, 12_000, 0, 12_000, 8_000, 0, 8_000], closed: true }],
  });
  pictures.set(id, {
    kind: 'plan',
    name: 'house.dxf',
    pages: Array.from({ length: pages }, (_, i) => page(i + 1)),
  });
}

const picture: Route = (req, res, path) => {
  const id = PICTURE.exec(path)?.[1];
  const held = id === undefined ? undefined : pictures.get(id);
  if (id === undefined || held === undefined || req.method !== 'GET') return false;
  const body: DesignPictureWire = {
    id,
    kind: held.kind,
    name: held.name,
    state: 'ready',
    refusal: null,
    facts: {
      takenOn: null,
      metresPerUnit: 0.001,
      turnDeg: null,
      centre: null,
      unit: 'mm',
      unitGuess: null,
      pages: held.pages.length,
      pickedPage: 1,
    },
    files: held.pages.map((lines) => ({
      page: lines.page,
      role: 'lines',
      box: null,
      url: `http://${req.headers.host}/plan-lines/${id}/${lines.page}`,
      expiresAt: LINK_ENDS,
    })),
    addedAt: ADDED_AT,
    addedBy: null,
  };
  send(res, req, 200, body);
  return true;
};

const lines: Route = (req, res, path) => {
  const match = LINES.exec(path);
  const page =
    match === null ? undefined : pictures.get(match[1] ?? '')?.pages[Number(match[2]) - 1];
  if (page === undefined) return false;
  send(res, req, 200, page);
  return true;
};

export const PICTURE_ROUTES: readonly Route[] = [picture, lines];
