import { describe, expect, it } from 'vitest';
import { myMembershipSchema } from '../src/tenant';

describe('GET /tenants/me/membership — a release is safe at every step of its roll', () => {
  it.each([
    { label: 'an api from before the setter', body: { coachMarksDismissed: 1 }, setter: null },
    {
      label: 'the founder',
      body: { coachMarksDismissed: 0, rolesSetBy: null },
      setter: null,
    },
    {
      label: 'an invited person',
      body: { coachMarksDismissed: 3, rolesSetBy: { name: 'Rajesh Kulkarni' } },
      setter: { name: 'Rajesh Kulkarni' },
    },
  ])('$label reads rolesSetBy as $setter', ({ body, setter }) => {
    expect(myMembershipSchema.parse(body).rolesSetBy).toEqual(setter);
  });
});
