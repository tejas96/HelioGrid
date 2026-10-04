import { describe, expect, it, vi } from 'vitest';

/**
 * The Google check the api's suites sign in through accepts a typed subject, so it must never be
 * built where a person could reach it (`M01-02`): outside `NODE_ENV=test` it refuses to exist.
 */
vi.mock('../../src/config/env', async (original) => {
  const real = (await original()) as { ENV: Record<string, unknown> };
  return { ENV: { ...real.ENV, NODE_ENV: 'development' } };
});

import { TestGoogleIdentity } from '../../src/modules/auth/internal/google-identity.test-double';

describe('the test Google identity', () => {
  it('is refused outside test', () => {
    expect(() => new TestGoogleIdentity()).toThrow(/NODE_ENV=test/);
  });
});
