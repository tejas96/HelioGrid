import { describe, expect, it } from 'vitest';
import { IN_CALLING_RULES, type TrafficClass } from '../../src/calling/pack';
import { isCallerLineAllowed } from '../../src/calling/routing';
import { IN_FORMATS } from '../../src/format/pack';
import { nationalNumber } from '../../src/format/phone';

const IN_VOICE = IN_CALLING_RULES.voice;
if (!IN_VOICE.declared) throw new Error('the IN pack declares a voice ruleset');
const IN_SERIES = IN_VOICE.callerLineSeries.value;

/** As a caller holds it — E.164 — so the dial code is stripped by the one derivation. */
const allowed = (trafficClass: TrafficClass, e164: string) =>
  isCallerLineAllowed(IN_SERIES, trafficClass, nationalNumber(IN_FORMATS, e164));

describe('isCallerLineAllowed — the IN caller-line series rule (F1-37)', () => {
  it.each([
    ['+911402345678', true, 'the 140-series RTM route'],
    ['+919845027746', false, 'an ordinary mobile line'],
    ['+911600123456', false, 'the 1600-series, closed to non-BFSI entities'],
  ])('promotional from %s is %s — %s', (e164, expected) => {
    expect(allowed('promotional', e164)).toBe(expected);
  });

  it.each<TrafficClass>(['transactional', 'inbound'])(
    'a %s line carries no required series, so an ordinary number serves it',
    (trafficClass) => {
      expect(allowed(trafficClass, '+919845027746')).toBe(true);
    },
  );

  it.each<TrafficClass>(['transactional', 'promotional', 'inbound'])(
    'the 1600-series is refused for %s — a closed series is closed to every class',
    (trafficClass) => {
      expect(allowed(trafficClass, '+911600123456')).toBe(false);
    },
  );

  it('reads the national number, so the same line passes with or without its dial code', () => {
    expect(allowed('promotional', '1402345678')).toBe(true);
  });
});
