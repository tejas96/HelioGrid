import { EMPTY_STUDIO_DOCUMENT } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { studioDocumentSchema } from '../src/studio/document';

/**
 * What a design keeps of its site's data (`T-M05-002`, part g), read one release before any studio
 * writes it (`CLAUDE.md` §8): a document with it reads; one from before it reads as none; a value
 * past its bounds is refused field by field; a key this release does not know is still refused.
 */

const document = (site?: unknown) => ({
  ...EMPTY_STUDIO_DOCUMENT,
  roofs: [],
  ...(site === undefined ? {} : { site }),
});

const kept = {
  dataStamp: { source: 'google_solar', quality: 'base', dataOn: '2025-10-17' },
  changed: { dataOn: '2025-10-17', changed: false },
  floors: 1,
  lineUp: { east: 0.3, north: -0.2, lift: -0.1 },
};

describe('the site data a design keeps', () => {
  it.each([
    ['a design from before part g: none', undefined],
    ['all of it', kept],
    ['none of it yet', {}],
    [
      'a stamp of data with no date',
      { dataStamp: { source: 'openstreetmap', quality: null, dataOn: null } },
    ],
    ['the line-up at its ends', { lineUp: { east: -5, north: 5, lift: 3 } }],
    ['sixty floors up', { floors: 60 }],
  ])('%s reads', (_, site) => {
    expect(studioDocumentSchema.safeParse(document(site)).success).toBe(true);
  });

  it.each([
    ['a lift past 3 m', { lineUp: { east: 0, north: 0, lift: 3.01 } }, ['site', 'lineUp', 'lift']],
    ['a move past 5 m', { lineUp: { east: -5.01, north: 0, lift: 0 } }, ['site', 'lineUp', 'east']],
    ['floors under the ground floor', { floors: -1 }, ['site', 'floors']],
    ['a part of a floor', { floors: 1.5 }, ['site', 'floors']],
    [
      'a source the studio does not know',
      { dataStamp: { source: 'esri', quality: null, dataOn: null } },
      ['site', 'dataStamp', 'source'],
    ],
    ['a key the studio does not know', { visit: true }, ['site']],
  ])('%s is refused there', (_, site, path) => {
    const read = studioDocumentSchema.safeParse(document(site));
    expect(read.success).toBe(false);
    expect(read.error?.issues[0]?.path).toEqual(path);
  });
});
