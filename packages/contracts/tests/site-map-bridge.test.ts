import { describe, expect, it } from 'vitest';
import {
  readSiteMapMessage,
  SITE_MAP_BRIDGE_VERSION,
  siteMapSaidSchema,
  siteMapShowSchema,
} from '../src/studio/site-map-bridge';

const POINT = { latitude: 18.5204, longitude: 73.8567 };
const SHOW = { v: SITE_MAP_BRIDGE_VERSION, kind: 'show', point: POINT };
const NEXT_VERSION = SITE_MAP_BRIDGE_VERSION + 1;
const PAST_THE_POLE = 91;

describe('readSiteMapMessage', () => {
  it('reads a message sent as an object and as JSON text', () => {
    expect(readSiteMapMessage(siteMapShowSchema, SHOW)).toEqual(SHOW);
    expect(readSiteMapMessage(siteMapShowSchema, JSON.stringify(SHOW))).toEqual(SHOW);
  });

  it.each([
    ['a version this reader does not know', { ...SHOW, v: NEXT_VERSION }],
    ['a kind this reader does not know', { ...SHOW, kind: 'tilt' }],
    ['a point off the globe', { ...SHOW, point: { ...POINT, latitude: PAST_THE_POLE } }],
    ['text that is not JSON', '{not json'],
    ['another script’s message', { source: 'react-devtools' }],
    ['nothing', null],
  ])('drops %s', (_name, sent) => {
    expect(readSiteMapMessage(siteMapShowSchema, sent)).toBeNull();
  });

  it('reads each thing the page says, and drops what it never says', () => {
    const said = [
      { v: SITE_MAP_BRIDGE_VERSION, kind: 'ready' },
      { v: SITE_MAP_BRIDGE_VERSION, kind: 'moved', point: POINT },
      { v: SITE_MAP_BRIDGE_VERSION, kind: 'failed' },
      { v: SITE_MAP_BRIDGE_VERSION, kind: 'unavailable' },
    ];
    for (const message of said) {
      expect(readSiteMapMessage(siteMapSaidSchema, JSON.stringify(message))).toEqual(message);
    }
    expect(readSiteMapMessage(siteMapSaidSchema, JSON.stringify(SHOW))).toBeNull();
  });
});
