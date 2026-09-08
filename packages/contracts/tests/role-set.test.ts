import { ROLE_PRESETS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { roleSetSchema } from '../src/common';

describe('roleSetSchema — a person holds at least one preset (F2-21)', () => {
  it.each([
    { roles: [], accepted: false, why: 'no role at all signs in to nothing' },
    { roles: ['epc_owner'], accepted: true, why: 'one preset is enough' },
    { roles: [...ROLE_PRESETS], accepted: true, why: 'all twelve stack' },
    { roles: ['owner'], accepted: false, why: 'a name outside the twelve is not a preset' },
  ])('$why', ({ roles, accepted }) => {
    expect(roleSetSchema.safeParse(roles).success).toBe(accepted);
  });
});
