import { describe, expect, it, vi } from 'vitest';
import { DevelopmentMessageDelivery } from '../../src/modules/auth/internal/message-delivery.development';

function adapter() {
  const warn = vi.fn();
  const logger = { warn, setContext: vi.fn() };
  return { delivery: new DevelopmentMessageDelivery(logger as never), warn };
}

describe('the development delivery adapter — the one way to drive a hard SMS failure before a rail exists (M01-03)', () => {
  it('logs the code for an ordinary number and delivers', async () => {
    const { delivery, warn } = adapter();
    await expect(
      delivery.send({ phoneE164: '+919820041123', channel: 'sms', message: 'code 482913' }),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('+919820041123'));
  });

  it.each(['+919876540000', '+911234560000'])(
    'refuses %s, whose national part ends in 0000, the way a network turns a message away',
    async (phoneE164) => {
      const { delivery, warn } = adapter();
      await expect(delivery.send({ phoneE164, channel: 'sms', message: 'code' })).rejects.toThrow();
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it('refuses on the voice channel too — the failing number fails every rail', async () => {
    const { delivery } = adapter();
    await expect(
      delivery.send({ phoneE164: '+919876540000', channel: 'voice', message: 'code' }),
    ).rejects.toThrow();
  });
});
