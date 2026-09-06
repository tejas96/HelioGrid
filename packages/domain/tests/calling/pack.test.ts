import { describe, expect, it } from 'vitest';
import { clockTime } from '../../src/calling/clock-time';
import { callingWindow, IN_CALLING_RULES, NO_WINDOW } from '../../src/calling/pack';
import { IN_PACK } from '../../src/market/pack';

const IN_VOICE = IN_CALLING_RULES.voice;

describe('callingWindow — a window closes after it opens', () => {
  it('reads a lawful window', () => {
    expect(callingWindow('09:00', '21:00')).toEqual({
      opens: clockTime('09:00'),
      closes: clockTime('21:00'),
    });
  });

  it.each([
    ['09:00', '09:00', 'a window of no width'],
    ['22:00', '06:00', 'a window crossing midnight — refused rather than handled'],
  ])('refuses %s–%s: %s', (opens, closes) => {
    expect(() => callingWindow(opens, closes)).toThrow(RangeError);
  });
});

describe('the IN ruleset carries voice AND messaging in the one key (F1-15, F1-17)', () => {
  it('is the pack’s callingRules key', () => {
    expect(IN_PACK.callingRules).toBe(IN_CALLING_RULES);
  });

  it.each([
    ['promotionalWindow', 'floor'],
    ['dndScrubMaxAgeHours', 'floor'],
    ['optOutHonouredWithinHours', 'floor'],
    ['recordingRetentionDays', 'floor'],
    ['proactiveAiDisclosure', 'floor'],
    ['recordingConsentCaptured', 'default'],
    ['callerLineSeries', 'floor'],
  ])('classifies the voice item %s as %s', (item, enforcement) => {
    expect(IN_VOICE.declared && IN_VOICE[item as 'dndScrubMaxAgeHours'].enforcement).toBe(
      enforcement,
    );
  });

  it.each([
    ['statutoryWindow', 'floor'],
    ['scheduledSendHour', 'default'],
    ['senderRegistration', 'floor'],
  ])('classifies the messaging item %s as %s', (item, enforcement) => {
    expect(IN_CALLING_RULES.messaging[item as 'scheduledSendHour'].enforcement).toBe(enforcement);
  });
});

describe('the IN voice floor — TRAI/DND (F1-36, F1-39)', () => {
  it('dials promotional traffic only inside 09:00–21:00', () => {
    expect(IN_VOICE.declared && IN_VOICE.promotionalWindow.value).toEqual(
      callingWindow('09:00', '21:00'),
    );
  });

  it.each([
    ['dndScrubMaxAgeHours', 24],
    ['optOutHonouredWithinHours', 24],
    ['recordingRetentionDays', 90],
  ])('sets %s to %i', (item, value) => {
    expect(IN_VOICE.declared && IN_VOICE[item as 'dndScrubMaxAgeHours'].value).toBe(value);
  });

  it('ships proactive AI disclosure OFF — the agent opens naturally until TRAI’s rule binds', () => {
    expect(IN_VOICE.declared && IN_VOICE.proactiveAiDisclosure.value).toBe(false);
  });

  it('captures recording consent by default', () => {
    expect(IN_VOICE.declared && IN_VOICE.recordingConsentCaptured.value).toBe(true);
  });
});

describe('the IN compliance routes — 140-series CLI and DLT (F1-37, F1-38)', () => {
  it('requires the 140-series for promotional outbound and nothing for the other classes', () => {
    expect(IN_VOICE.declared && IN_VOICE.callerLineSeries.value.requiredByClass).toEqual({
      transactional: null,
      promotional: '140',
      inbound: null,
    });
  });

  it('closes the 1600-series, which is not open to non-BFSI entities', () => {
    expect(IN_VOICE.declared && IN_VOICE.callerLineSeries.value.forbidden).toEqual(['1600']);
  });

  it('demands DLT registration of the entity, the header and the template', () => {
    expect(IN_CALLING_RULES.messaging.senderRegistration.value).toEqual({
      platform: 'DLT',
      levels: ['entity', 'header', 'template'],
    });
  });
});

describe('the IN messaging time law — TCCCPR (F1-62)', () => {
  it('authors an EMPTY window, so no code waits on a value', () => {
    expect(IN_CALLING_RULES.messaging.statutoryWindow.value).toBe(NO_WINDOW);
  });

  it('sends at 19:00 on the tenant’s clock', () => {
    expect(IN_CALLING_RULES.messaging.scheduledSendHour.value).toBe(clockTime('19:00'));
  });
});
