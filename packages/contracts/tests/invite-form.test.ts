import { IN_FORMATS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { inviteFormSchema } from '../src/invitation';

/** Invite Teammate's form (`SCR-M01-07`): the invite, with the number held to the market's length. */
describe('inviteFormSchema', () => {
  const invite = (phoneE164: string) => ({
    inviteeName: 'Anjali Kulkarni',
    phoneE164,
    roles: ['survey_engineer'],
  });

  it.each([
    ['+91982204118', false],
    ['+919822041187', true],
    ['+9198220411870', false],
    ['', false],
  ])('a number of %s is %s', (phone, sends) => {
    expect(inviteFormSchema(IN_FORMATS).safeParse(invite(phone)).success).toBe(sends);
  });

  it('keeps the contract’s rules: no role is refused', () => {
    expect(
      inviteFormSchema(IN_FORMATS).safeParse({ ...invite('+919822041187'), roles: [] }).success,
    ).toBe(false);
  });
});
