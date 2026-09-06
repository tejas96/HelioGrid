import { describe, expect, it } from 'vitest';
import type { CallingRulesPack } from '../../src/calling/pack';
import { IN_CALLING_RULES } from '../../src/calling/pack';
import { isOutboundVoiceAvailable } from '../../src/calling/voice';

const NO_VOICE: CallingRulesPack = { ...IN_CALLING_RULES, voice: { declared: false } };

describe('isOutboundVoiceAvailable — absence is a hard disable (F1-16)', () => {
  it('is available in IN, whose pack declares the TRAI ruleset', () => {
    expect(isOutboundVoiceAvailable(IN_CALLING_RULES)).toBe(true);
  });

  it('is unavailable where the pack declares no voice ruleset — never a permissive default', () => {
    expect(isOutboundVoiceAvailable(NO_VOICE)).toBe(false);
  });
});
