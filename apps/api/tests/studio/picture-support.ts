import type {
  AddCadPlan,
  AddDesignPicture,
  DesignPictureFacts,
  DesignPictureWire,
  FileContentType,
} from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import { expect } from 'vitest';
import { aStored } from '../projects/stored-file';
import {
  aDesign,
  aLead,
  aSite,
  type Caller,
  retryKey,
  type StudioWorld,
  saveSite,
} from './support';

/** A design's own picture in a proof (`T-M05-002d`): the bytes, the facts and the calls. */

/** A JPEG's first bytes: what the store holds it to. */
export const JPEG = new Uint8Array(Buffer.from('ffd8ffe000104a464946', 'hex'));
export const LINES = new TextEncoder().encode('{"page":1,"extent":{},"lines":[]}');
export const DWG = new TextEncoder().encode('AC1032 a drawing');

export const photoFacts: DesignPictureFacts = {
  takenOn: '2026-11-20',
  metresPerUnit: null,
  turnDeg: null,
  centre: null,
  unit: null,
  unitGuess: null,
  pages: 1,
  pickedPage: 1,
};

/** A piece's box in the photo's pixels about its middle: a 1024 × 768 piece. */
export const box = { west: -512, south: -384, east: 512, north: 384 };

/** The error code a refused reply names. */
export const codeOf = (reply: { readonly body: unknown }) =>
  (reply.body as { readonly error: { readonly code: string } }).error.code;

/** The picture calls of one world. */
export function pictureCalls(world: StudioWorld) {
  const stored = (
    caller: Caller,
    designId: string,
    bytes: Uint8Array,
    contentType: FileContentType = 'image/jpeg',
  ) => aStored(world, caller, { subjectKind: 'design', subjectRef: designId, contentType, bytes });

  return {
    stored,

    /** A design on a new lead of the caller's company, with its site in Sangli. */
    async aSitedDesign(caller: Caller): Promise<string> {
      const made = await aDesign(caller, await aLead(caller));
      expect((await saveSite(caller, made.design.id, aSite())).status).toBe(HttpStatus.OK);
      return made.design.id;
    },

    add: (caller: Caller, designId: string, body: AddDesignPicture, key = retryKey()) =>
      caller.call<DesignPictureWire>('POST', `/designs/${designId}/pictures`, body, key),

    addCadPlan: (caller: Caller, designId: string, body: AddCadPlan, key = retryKey()) =>
      caller.call<DesignPictureWire>('POST', `/designs/${designId}/cad-plans`, body, key),

    read: (caller: Caller, designId: string, pictureId: string) =>
      caller.call<DesignPictureWire>('GET', `/designs/${designId}/pictures/${pictureId}`),

    /** A photo read on the device: two pieces, stored against the design. */
    async aPhoto(caller: Caller, designId: string): Promise<AddDesignPicture> {
      return {
        kind: 'photo',
        name: 'roof-from-above.jpg',
        facts: photoFacts,
        files: [
          { fileId: await stored(caller, designId, JPEG), page: 1, role: 'piece', box },
          {
            fileId: await stored(caller, designId, JPEG),
            page: 1,
            role: 'piece',
            box: { ...box, west: box.east, east: box.east * 2 },
          },
        ],
      };
    },
  };
}
