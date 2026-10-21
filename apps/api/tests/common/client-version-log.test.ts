import { CLIENT_VERSION_HEADER } from '@heliogrid/contracts';
import type { NextFunction, Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import { describe, expect, it } from 'vitest';
import { readMinimumClientVersion, refuseClientsBelow } from '../../src/common/client-version';

/**
 * The refusal of a too-old phone is written before the request logger runs, so its own line is
 * the only record — and it names the path an invite link carries its secret in.
 */
const TOKEN = 'the-invite-link-token-in-this-test';
const minimum = readMinimumClientVersion({
  MOBILE_MIN_VERSION: '1.10',
  MOBILE_STORE_URL_IOS: 'https://apps.apple.com/app/id1111111111',
  MOBILE_STORE_URL_ANDROID: 'https://play.google.com/store/apps/details?id=com.heliogrid.app',
});

describe('the too-old refusal’s log line', () => {
  it('names an invite landing’s path with its token censored', () => {
    if (minimum === null) throw new Error('the minimum must be set');
    const written: Record<string, unknown>[] = [];
    const logger = { warn: (fields: Record<string, unknown>) => written.push(fields) };
    const req = {
      id: 'request-1',
      method: 'GET',
      path: `/invitations/landing/${TOKEN}`,
      headers: { [CLIENT_VERSION_HEADER]: '1.0' },
    };
    const res = { status: () => ({ json: () => undefined }) };
    const next: NextFunction = () => undefined;

    refuseClientsBelow(minimum, logger as unknown as PinoLogger)(
      req as unknown as Request,
      res as unknown as Response,
      next,
    );

    expect(written).toHaveLength(1);
    expect(written[0]?.path).toBe('/invitations/landing/[redacted]');
  });
});
