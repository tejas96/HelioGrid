import { describe, expect, it } from 'vitest';
import {
  readSiteMapMessage,
  WEB_VIEW_BRIDGE_VERSION,
  webViewAskSchema,
  webViewInsetsSchema,
} from '../src';

/**
 * What the studio page asks of the phone around it. A phone app outlives a release of the page, so
 * an ask the app does not know reads as nothing — never as another ask.
 */
describe('the web view bridge: page → phone', () => {
  it.each(['token-needed', 'leave', 'site', 'insets-needed'] as const)(
    'reads the %s ask',
    (kind) => {
      const sent = JSON.stringify({ v: WEB_VIEW_BRIDGE_VERSION, kind });
      expect(readSiteMapMessage(webViewAskSchema, sent)).toEqual({
        v: WEB_VIEW_BRIDGE_VERSION,
        kind,
      });
    },
  );

  it.each(['selection', 'impact'] as const)('reads the %s haptic', (strength) => {
    const sent = JSON.stringify({ v: WEB_VIEW_BRIDGE_VERSION, kind: 'haptic', strength });
    expect(readSiteMapMessage(webViewAskSchema, sent)).toEqual({
      v: WEB_VIEW_BRIDGE_VERSION,
      kind: 'haptic',
      strength,
    });
  });

  it.each([
    ['an ask it does not know', { v: WEB_VIEW_BRIDGE_VERSION, kind: 'roof' }],
    ['a haptic it does not know', { v: WEB_VIEW_BRIDGE_VERSION, kind: 'haptic', strength: 'long' }],
    ['another version', { v: WEB_VIEW_BRIDGE_VERSION + 1, kind: 'site' }],
    ['no version', { kind: 'site' }],
  ])('reads %s as nothing', (_why, body) => {
    expect(readSiteMapMessage(webViewAskSchema, JSON.stringify(body))).toBeNull();
  });

  it('reads text that is not a message as nothing', () => {
    expect(readSiteMapMessage(webViewAskSchema, 'site')).toBeNull();
  });
});

/** How far the phone's own bars reach over the studio page, which runs under them. */
describe('the web view bridge: phone → page insets', () => {
  it('reads the bars the phone sends', () => {
    const insets = {
      v: WEB_VIEW_BRIDGE_VERSION,
      kind: 'insets',
      top: 59,
      right: 0,
      bottom: 34,
      left: 0,
    };
    expect(readSiteMapMessage(webViewInsetsSchema, JSON.stringify(insets))).toEqual(insets);
  });

  it.each([
    [
      'a bar below zero',
      { v: WEB_VIEW_BRIDGE_VERSION, kind: 'insets', top: -1, right: 0, bottom: 0, left: 0 },
    ],
    ['a side missing', { v: WEB_VIEW_BRIDGE_VERSION, kind: 'insets', top: 0, right: 0, bottom: 0 }],
    ['another kind', { v: WEB_VIEW_BRIDGE_VERSION, kind: 'token', token: 'x' }],
  ])('reads %s as nothing', (_why, body) => {
    expect(readSiteMapMessage(webViewInsetsSchema, JSON.stringify(body))).toBeNull();
  });
});
