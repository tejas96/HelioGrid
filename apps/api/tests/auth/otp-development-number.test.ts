import { IN_PACK } from '@heliogrid/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const DEV_PHONE = '+919999999999';
const DEV_CODE = '000000';
const OTHER_PHONE = '+919845027746';
/** A verify a second after its request — inside every code's life. */
const A_SECOND_LATER = 1000;

/**
 * The api's env module is frozen when it loads and refuses to boot without every variable, so
 * the test hands the service an env of its own: the signing secret the code hash needs, and the
 * development pair each case sets.
 */
const env = vi.hoisted(() => ({
  ENV: {
    AUTH_TOKEN_SECRET: 'a-test-only-signing-secret-of-thirty-two-plus',
    DEV_OTP_PHONE: undefined as string | undefined,
    DEV_OTP_CODE: undefined as string | undefined,
  },
}));
vi.mock('../../src/config/env', () => env);

import { OtpService } from '../../src/modules/auth/internal/otp.service';

function service() {
  const rows = new Map<string, { phoneE164: string; codeHash: string; issuedAt: Date }>();
  const codes = {
    createChallenge: vi.fn(
      async (row: { phoneE164: string; codeHash: string; issuedAt: number }) => {
        const id = `challenge-${rows.size + 1}`;
        rows.set(id, {
          phoneE164: row.phoneE164,
          codeHash: row.codeHash,
          issuedAt: new Date(row.issuedAt),
        });
        return id;
      },
    ),
    challengeById: vi.fn(async (id: string) => {
      const row = rows.get(id);
      if (row === undefined) return null;
      return {
        ...row,
        channel: 'sms',
        failedVerifies: 0,
        verifiedAt: null,
        invalidatedAt: null,
        deliveryFailedAt: null,
      };
    }),
    challengesSince: vi.fn(async () => []),
    claimVerified: vi.fn(async () => true),
    recordVerify: vi.fn(async () => undefined),
    markDeliveryFailed: vi.fn(async () => undefined),
  };
  const delivery = { send: vi.fn(async () => undefined) };
  const markets = { deliverablePack: vi.fn(async () => IN_PACK) };
  const otp = new OtpService(codes as never, delivery as never, markets as never);
  return { otp, codes, delivery, markets };
}

beforeEach(() => {
  env.ENV.DEV_OTP_PHONE = DEV_PHONE;
  env.ENV.DEV_OTP_CODE = DEV_CODE;
});

describe('the one development number (DEV_OTP_PHONE) — a fixed code, no delivery, no cap', () => {
  it('sends nothing and accepts the fixed code for the development number', async () => {
    const { otp, delivery, markets, codes } = service();
    const now = Date.now();
    const challenge = await otp.request(DEV_PHONE, 'sms', 'en', now);
    expect(delivery.send).not.toHaveBeenCalled();
    expect(markets.deliverablePack).not.toHaveBeenCalled();
    expect(codes.challengesSince).not.toHaveBeenCalled();
    expect(challenge.resendAvailableAt).toBe(new Date(now).toISOString());
    await expect(
      otp.verify(challenge.challengeId, DEV_CODE, now + A_SECOND_LATER),
    ).resolves.toEqual({ phoneE164: DEV_PHONE });
  });

  it('refuses a wrong code for the development number like any other', async () => {
    const { otp } = service();
    const now = Date.now();
    const challenge = await otp.request(DEV_PHONE, 'sms', 'en', now);
    await expect(
      otp.verify(challenge.challengeId, '123456', now + A_SECOND_LATER),
    ).rejects.toThrow();
  });

  it('leaves every other number on the real path — a random code, sent through the rail', async () => {
    const { otp, delivery, markets } = service();
    const now = Date.now();
    const challenge = await otp.request(OTHER_PHONE, 'sms', 'en', now);
    expect(markets.deliverablePack).toHaveBeenCalledWith(OTHER_PHONE);
    expect(delivery.send).toHaveBeenCalledTimes(1);
    await expect(
      otp.verify(challenge.challengeId, DEV_CODE, now + A_SECOND_LATER),
    ).rejects.toThrow();
  });

  it('treats the number as any other when the variables are absent', async () => {
    env.ENV.DEV_OTP_PHONE = undefined;
    env.ENV.DEV_OTP_CODE = undefined;
    const { otp, delivery } = service();
    await otp.request(DEV_PHONE, 'sms', 'en', Date.now());
    expect(delivery.send).toHaveBeenCalledTimes(1);
  });
});
