import { IN_PACK } from '@heliogrid/domain';
import { apiEnvSchema } from '@heliogrid/env';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const DEV_PHONE = '+919999999999';
const SECOND_DEV_PHONE = '+919999999991';
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
    DEV_OTP_PHONES: undefined as readonly string[] | undefined,
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
  env.ENV.DEV_OTP_PHONES = [DEV_PHONE, SECOND_DEV_PHONE];
  env.ENV.DEV_OTP_CODE = DEV_CODE;
});

describe('the development numbers (DEV_OTP_PHONES) — a fixed code, no delivery, no cap', () => {
  it.each([DEV_PHONE, SECOND_DEV_PHONE])(
    'sends nothing and accepts the fixed code for every listed number — %s',
    async (phone) => {
      const { otp, delivery, markets, codes } = service();
      const now = Date.now();
      const challenge = await otp.request(phone, 'sms', 'en', now);
      expect(delivery.send).not.toHaveBeenCalled();
      expect(markets.deliverablePack).not.toHaveBeenCalled();
      expect(codes.challengesSince).not.toHaveBeenCalled();
      expect(challenge.resendAvailableAt).toBe(new Date(now).toISOString());
      await expect(
        otp.verify(challenge.challengeId, DEV_CODE, now + A_SECOND_LATER),
      ).resolves.toEqual({ phoneE164: phone });
    },
  );

  it('refuses a wrong code for a listed number like any other', async () => {
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

  it('treats every number as any other when the variables are absent', async () => {
    env.ENV.DEV_OTP_PHONES = undefined;
    env.ENV.DEV_OTP_CODE = undefined;
    const { otp, delivery } = service();
    await otp.request(DEV_PHONE, 'sms', 'en', Date.now());
    expect(delivery.send).toHaveBeenCalledTimes(1);
  });
});

/** The keys the api refuses to boot without, so each case below varies only the pair. */
const BOOTABLE = {
  DATABASE_URL: 'postgres://app_runtime:app_runtime@localhost:5544/heliogrid',
  AUTH_TOKEN_SECRET: 'a-test-only-signing-secret-of-thirty-two-plus',
  TEMPORAL_ADDRESS: '127.0.0.1:7233',
  TEMPORAL_NAMESPACE: 'heliogrid',
  TEMPORAL_TLS_CA_FILE: '/dev/null',
  TEMPORAL_TLS_CERT_FILE: '/dev/null',
  TEMPORAL_TLS_KEY_FILE: '/dev/null',
  TEMPORAL_AUTH_TOKEN_FILE: '/dev/null',
};

function refusals(source: Record<string, string>): string[] {
  const parsed = apiEnvSchema.safeParse({ ...BOOTABLE, ...source });
  if (parsed.success) return [];
  return parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

describe('the development numbers at boot', () => {
  it('trims each number and refuses one that is not E.164, an empty one included', () => {
    const parsed = apiEnvSchema.parse({
      ...BOOTABLE,
      DEV_OTP_PHONES: `${DEV_PHONE}, ${SECOND_DEV_PHONE}`,
      DEV_OTP_CODE: DEV_CODE,
    });
    expect(parsed.DEV_OTP_PHONES).toEqual([DEV_PHONE, SECOND_DEV_PHONE]);
    const refused = refusals({ DEV_OTP_PHONES: `${DEV_PHONE},+91abc`, DEV_OTP_CODE: DEV_CODE });
    expect(refused).toHaveLength(1);
    expect(refused[0]).toMatch(/^DEV_OTP_PHONES/);
    expect(refusals({ DEV_OTP_PHONES: '', DEV_OTP_CODE: DEV_CODE })[0]).toMatch(
      /^DEV_OTP_PHONES\.0/,
    );
  });

  it('refuses the code without the numbers', () => {
    expect(refusals({ DEV_OTP_CODE: DEV_CODE })).toEqual([
      'DEV_OTP_PHONES: DEV_OTP_PHONES and DEV_OTP_CODE are set together, or not at all.',
    ]);
  });

  it('refuses the numbers without the code', () => {
    expect(refusals({ DEV_OTP_PHONES: DEV_PHONE })).toEqual([
      'DEV_OTP_PHONES: DEV_OTP_PHONES and DEV_OTP_CODE are set together, or not at all.',
    ]);
  });

  it('refuses the numbers in production', () => {
    expect(
      refusals({ NODE_ENV: 'production', DEV_OTP_PHONES: DEV_PHONE, DEV_OTP_CODE: DEV_CODE }),
    ).toEqual([
      'DEV_OTP_PHONES: A fixed sign-in code never runs in production. Remove DEV_OTP_PHONES and DEV_OTP_CODE.',
    ]);
  });
});
