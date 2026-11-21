import { describe, expect, it } from 'vitest';
import {
  SKY_TICKET_HEADER,
  skyTileHeadersSchema,
  skyTileParamsSchema,
  skyTilesSchema,
} from '../src/studio/sky-tiles';

const ID = '01a1fc9f-876f-7739-a9ce-c6440567487f';

describe('a sky tile’s address', () => {
  it('reads its three numbers out of the path', () => {
    expect(skyTileParamsSchema.parse({ id: ID, z: '19', x: '370783', y: '237263' })).toEqual({
      id: ID,
      z: 19,
      x: 370_783,
      y: 237_263,
    });
  });

  it.each([
    ['a zoom past the finest any service cuts', { z: '23', x: '1', y: '1' }],
    ['a zoom below the world', { z: '-1', x: '0', y: '0' }],
    ['a column left of the grid', { z: '19', x: '-1', y: '1' }],
    ['a part of a tile', { z: '19', x: '1.5', y: '1' }],
    ['a word', { z: '19', x: 'east', y: '1' }],
    ['a design that is no id', { id: 'mine', z: '19', x: '1', y: '1' }],
  ])('refuses %s', (_what, typed) => {
    expect(skyTileParamsSchema.safeParse({ id: ID, ...typed }).success).toBe(false);
  });

  it.each([
    ['none', {}],
    ['an empty one', { [SKY_TICKET_HEADER]: '' }],
  ])('a tile is asked for with a ticket: %s is refused', (_what, headers) => {
    expect(skyTileHeadersSchema.safeParse(headers).success).toBe(false);
  });
});

describe('a site’s sky picture facts', () => {
  const tiles = {
    kind: 'tiles',
    source: 'google',
    credit: 'Imagery ©2026',
    metresPerPixel: 0.28,
    takenOn: null,
    ticket: 'body.signature',
    ticketUntil: '2026-11-21T11:00:00.000Z',
    zoomMin: 16,
    zoomMax: 19,
    reach: { west: -300, east: 300, south: -300, north: 300 },
  };

  it('a reader built before a new provider or a new reason still reads the answer', () => {
    expect(skyTilesSchema.safeParse({ ...tiles, source: 'a later provider' }).success).toBe(true);
    expect(skyTilesSchema.safeParse({ kind: 'none', gap: 'a later reason' }).success).toBe(true);
  });

  it.each([
    ['no ticket', { ticket: '' }],
    ['a sharpness of nothing', { metresPerPixel: 0 }],
    ['a reach that is no length', { reach: { ...tiles.reach, east: Number.POSITIVE_INFINITY } }],
    ['a zoom that is a part', { zoomMax: 19.5 }],
  ])('refuses %s', (_what, wrong) => {
    expect(skyTilesSchema.safeParse({ ...tiles, ...wrong }).success).toBe(false);
  });
});
