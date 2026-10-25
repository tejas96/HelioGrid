import { describe, expect, it } from 'vitest';
import { holdsOutright } from '../../src/authz/outright';
import type { RolePreset } from '../../src/authz/roles';

describe('holdsOutright — a capability held with no limit on it', () => {
  it.each<[string, RolePreset[], boolean]>([
    ['an owner', ['epc_owner'], true],
    ['operations', ['operations'], true],
    ['finance, whose cell is limited', ['finance'], false],
    [
      'finance and operations together, where the wider grant wins',
      ['finance', 'operations'],
      true,
    ],
    ['a sales executive, who does not hold it', ['sales_executive'], false],
    ['no role at all', [], false],
  ])('holds a capability outright (%s)', (_who, roles, expected) => {
    expect(holdsOutright(roles, 'onboarding.manage_catalog')).toBe(expected);
  });
});
