import { randomUUID } from 'node:crypto';
import { usageRecordWorkflow } from '@heliogrid/contracts/workflows';
import { orchestrationOutbox } from '@heliogrid/db';
import { EMPTY_STUDIO_DOCUMENT } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { expect } from 'vitest';
import type { Caller, StudioWorld } from './support';

/** The site data proofs' places, roofs and cost lines (`T-M05-002`, part g). */

const FIRST_LATITUDE = 16.7;
const APART_DEG = 0.01;
const LONGITUDE = 74.5;
let places = 0;

/** A place no other case of the file uses, so its answers are not yet kept. */
export const place = (latitude?: number, longitude = LONGITUDE) => {
  places += 1;
  return { latitude: latitude ?? FIRST_LATITUDE + places * APART_DEG, longitude };
};

const ROOF_SIDE_M = 8;

/** A square roof, 8 m a side, its south-west corner at `east, north`. */
export const aRoof = (east: number, north: number) => ({
  id: randomUUID(),
  corners: [
    { east, north },
    { east: east + ROOF_SIDE_M, north },
    { east: east + ROOF_SIDE_M, north: north + ROOF_SIDE_M },
    { east, north: north + ROOF_SIDE_M },
  ],
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
});

/** The design's document saved with these roofs, as its first save. */
export async function roofsSaved(caller: Caller, designId: string, roofs: readonly unknown[]) {
  const reply = await caller.call('PUT', `/designs/${designId}/document`, {
    baseVersion: 0,
    document: { ...EMPTY_STUDIO_DOCUMENT, picture: 'sky', roofs },
    opening: randomUUID(),
  });
  expect(reply.status).toBe(HttpStatus.OK);
}

/** The cost lines a design's calls left, read off the ledger's hand-offs. */
export async function costLinesOf(world: StudioWorld, designId: string) {
  const rows = await world.pools.admin.db
    .select({ payload: orchestrationOutbox.payload })
    .from(orchestrationOutbox)
    .where(eq(orchestrationOutbox.workflow, usageRecordWorkflow.name));
  return rows
    .map((row) => row.payload as { subjectRef?: string; meter?: string; billable?: boolean })
    .filter((payload) => payload.subjectRef === designId);
}
