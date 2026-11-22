import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import type { CadPlanRead } from '@heliogrid/contracts/workflows';
import { afterEach, describe, expect, it } from 'vitest';
import { cadPlanActivities } from '../../src/modules/studio/studio.activities';

/**
 * The CAD reader on our server (`T-M05-002d`): a DWG or a binary DXF read into the plan's lines and
 * PUT to the store. The store here is a plain HTTP server holding the plan and taking the PUT — it
 * stands for the object store, which signs both addresses.
 *
 * The plans are our own drawing of one house (`fixtures/`), written with ezdxf; the DWG is the same
 * file saved by LibreDWG's `dxf2dwg`. A 12 × 8.5 m outline and a 3 × 2.5 m stair room, both
 * closed, two inner walls, a half-round bay, a door block placed twice, a column, and a line of
 * text — all in mm. The R12 file has the outline, an arc and a column drawn facing down.
 */

const FIXTURES = join(__dirname, 'fixtures');
/** A cold reader starts in well under a second; a read past this is stuck. */
const READ_TIMEOUT_MS = 30_000;
const OK = 200;
/** The house, in mm: its outline, the bay that bulges east of it, and a door's leaf at its place. */
const LENGTH = 12_000;
const DEPTH = 8_500;
const BAY_EAST = 13_000;
const FIRST_DOOR_LEAF_END = 1_900;
/** The closed outlines: the house, the stair room and the column. */
const CLOSED_OUTLINES = 3;
/** A straight line is two points: four numbers. */
const ONE_SEGMENT = 4;

interface Store {
  readonly origin: string;
  readonly put: () => Buffer | null;
  readonly server: Server;
}

const servers: Server[] = [];
afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

async function storeHolding(plan: Buffer): Promise<Store> {
  let put: Buffer | null = null;
  const server = createServer((request: IncomingMessage, answer) => {
    if (request.method === 'GET') {
      answer.writeHead(OK).end(plan);
      return;
    }
    const parts: Buffer[] = [];
    request.on('data', (part: Buffer) => parts.push(part));
    request.on('end', () => {
      put = Buffer.concat(parts);
      answer.writeHead(OK).end();
    });
  });
  servers.push(server);
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as AddressInfo;
  return { origin: `http://127.0.0.1:${port}`, put: () => put, server };
}

async function read(plan: Buffer, contentType: 'image/vnd.dwg' | 'image/vnd.dxf') {
  const store = await storeHolding(plan);
  const result: CadPlanRead = await cadPlanActivities.readCadPlan({
    sourceUrl: `${store.origin}/plan`,
    contentType,
    put: { url: `${store.origin}/lines`, headers: {} },
  });
  const stored = store.put();
  return { result, lines: stored === null ? null : JSON.parse(stored.toString('utf8')), stored };
}

describe('the CAD reader', () => {
  it.each([
    ['house.dwg', 'image/vnd.dwg'],
    ['house-binary.dxf', 'image/vnd.dxf'],
  ] as const)(
    '%s reads into the house, its unit, and the bytes it PUT',
    async (name, type) => {
      const { result, lines, stored } = await read(readFileSync(join(FIXTURES, name)), type);
      expect(result).toMatchObject({ kind: 'lines', unit: 'mm', unitGuess: 'mm' });
      if (result.kind !== 'lines' || stored === null) throw new Error('no lines');
      expect(result.byteSize).toBe(stored.length);
      expect(result.checksumSha256).toBe(createHash('sha256').update(stored).digest('base64'));
      const closed = lines.lines.filter((line: { closed: boolean }) => line.closed);
      expect(closed).toHaveLength(CLOSED_OUTLINES);
      expect(closed[0].points).toEqual([0, 0, LENGTH, 0, LENGTH, DEPTH, 0, DEPTH]);
      // The bay bulges out east of the outline.
      expect(lines.extent).toMatchObject({ west: 0, south: 0, east: BAY_EAST, north: DEPTH });
      // Each door: its leaf and its swing, placed twice.
      const leaves = lines.lines.filter(
        (line: { points: number[] }) =>
          line.points.length === ONE_SEGMENT && line.points.includes(FIRST_DOOR_LEAF_END),
      );
      expect(leaves.length).toBeGreaterThanOrEqual(1);
    },
    READ_TIMEOUT_MS,
  );

  it(
    'an R12 binary DXF, whose group codes are one byte, reads its outline and its column from below',
    async () => {
      const { result, lines } = await read(
        readFileSync(join(FIXTURES, 'house-r12-binary.dxf')),
        'image/vnd.dxf',
      );
      // R12 writes no unit: the plan's size guesses it.
      expect(result).toMatchObject({ kind: 'lines', unit: null, unitGuess: 'mm' });
      expect(lines.lines[0]).toEqual({
        points: [0, 0, LENGTH, 0, LENGTH, DEPTH, 0, DEPTH],
        closed: true,
      });
      // The column was drawn facing down at x = 2500: from above it stands at x = −2500.
      const column = lines.lines.at(-1);
      expect(column.closed).toBe(true);
      expect(Math.max(...column.points.filter((_: number, i: number) => i % 2 === 0))).toBeLessThan(
        0,
      );
    },
    READ_TIMEOUT_MS,
  );

  it(
    'a file it cannot read is refused as broken, and nothing is PUT',
    async () => {
      const { result, stored } = await read(
        Buffer.from('AC1032 not a drawing at all'),
        'image/vnd.dwg',
      );
      expect(result).toEqual({ kind: 'refused', refusal: 'broken' });
      expect(stored).toBeNull();
    },
    READ_TIMEOUT_MS,
  );
});
