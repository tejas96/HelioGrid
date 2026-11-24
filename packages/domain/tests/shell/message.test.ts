import { describe, expect, it } from 'vitest';
import { goesByItself, type MessageTone, worstMessage } from '../../src/shell/message';

const say = (tone: MessageTone, line: string) => ({ tone, line });

describe('worstMessage', () => {
  it('shows the worst message when several are there', () => {
    const shown = worstMessage([
      say('info', 'moved'),
      say('error', 'cross'),
      say('warning', 'old'),
    ]);
    expect(shown?.line).toBe('cross');
  });

  it('keeps the first of two as bad', () => {
    expect(worstMessage([say('warning', 'first'), say('warning', 'second')])?.line).toBe('first');
  });

  it('shows nothing when there is nothing to say', () => {
    expect(worstMessage([])).toBeNull();
  });
});

describe('goesByItself', () => {
  it('lets only information that asks nothing go by itself', () => {
    expect(goesByItself('info', false)).toBe(true);
    expect(goesByItself('info', true)).toBe(false);
    expect(goesByItself('warning', false)).toBe(false);
    expect(goesByItself('error', false)).toBe(false);
  });
});
