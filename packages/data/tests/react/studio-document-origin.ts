import type { IncomingMessage, ServerResponse } from 'node:http';
import type { StudioDocumentWire } from '@heliogrid/contracts';
import { afterEach } from 'vitest';
import { refusal, send, writeBodyOf } from './origin-wire';

/**
 * A design's document through the real client (`T-M05-002`): the origin keeps one document, takes
 * each save whole — checked against the contract — and counts its versions; the reader holds the
 * turn to edit, and the site has no sky picture.
 */

type Route = (req: IncomingMessage, res: ServerResponse, path: string) => boolean;

const SAVED_AT = '2026-11-10T05:00:00.000Z';
const HOLDER = { userId: '01a50000-0000-7000-8000-000000000002', name: 'Asha Patil' };

const FRESH = (): {
  document: StudioDocumentWire;
  version: number;
  saves: StudioDocumentWire[];
} => ({
  document: { schemaVersion: 1, picture: null, drawnOn: null, roofs: [], pictureScale: 1 },
  version: 0,
  saves: [],
});

/** The design's document as the origin holds it, and every document saved, in order. */
export const stored = FRESH();

afterEach(() => {
  Object.assign(stored, FRESH());
});

const DOCUMENT = /^\/designs\/([^/]+)\/document$/;
const TURN = /^\/designs\/([^/]+)\/edit-turn$/;
const SKY = /^\/designs\/([^/]+)\/sky-picture$/;

const read: Route = (req, res, path) => {
  if (!DOCUMENT.test(path) || req.method !== 'GET') return false;
  send(res, req, 200, {
    document: stored.document,
    version: stored.version,
    savedAt: stored.version === 0 ? null : SAVED_AT,
    savedBy: stored.version === 0 ? null : HOLDER,
    editTurn: { editor: HOLDER, mine: true },
  });
  return true;
};

const save: Route = (req, res, path) => {
  if (!DOCUMENT.test(path) || req.method !== 'PUT') return false;
  void writeBodyOf(req, res).then((write) => {
    if (write === null) return;
    const body = write.body as { baseVersion: number; document: StudioDocumentWire };
    if (body.baseVersion !== stored.version)
      return send(res, req, 409, refusal('DESIGN_SAVED_FIRST'));
    stored.document = body.document;
    stored.version += 1;
    stored.saves.push(body.document);
    send(res, req, 200, { version: stored.version, savedAt: SAVED_AT });
  });
  return true;
};

const turn: Route = (req, res, path) => {
  if (!TURN.test(path)) return false;
  if (req.method === 'DELETE') send(res, req, 204);
  else send(res, req, 200, { editor: HOLDER, mine: true });
  return true;
};

const sky: Route = (req, res, path) => {
  if (!SKY.test(path) || req.method !== 'GET') return false;
  send(res, req, 200, { kind: 'none', gap: 'not_set_up' });
  return true;
};

/** The document's routes, which the studio origin answers beside its own. */
export const DOCUMENT_ROUTES: readonly Route[] = [read, save, turn, sky];
