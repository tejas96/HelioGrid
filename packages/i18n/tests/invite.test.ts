import { IN_FORMATS, ROLE_PRESETS } from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import { apiErrorMessageId } from '../src/copy/api-error';
import { inviteFieldWords, inviteWords, setupInviteWords } from '../src/copy/invite';
import { createTranslator } from '../src/runtime';

/** Invite Teammate's words (`SCR-M01-07`): the board's, word for word. */
let t: Awaited<ReturnType<typeof createTranslator>>['t'];
beforeAll(async () => {
  t = (await createTranslator('en')).t;
});

describe('inviteWords', () => {
  it('draws the twelve presets in F2 order with their lines', () => {
    const roles = inviteWords(t).roles;
    expect(roles.map((role) => role.value)).toEqual([...ROLE_PRESETS]);
    expect(roles[0]).toEqual({
      value: ROLE_PRESETS[0],
      title: 'EPC Owner',
      description: 'Everything, including team and roles, the agent, billing and company settings',
    });
    /* The ninth preset, HR/Admin. */
    expect(roles[8]?.description).toBe('Employee records, documents, attendance and leave');
    expect(roles.every((role) => role.description.length > 0)).toBe(true);
  });

  it('prints the expiry from the policy, and the digit refusal in the door’s words', () => {
    const words = inviteWords(t);
    expect(words.lasts).toBe('Invite lasts 7 days · cancel it from Team');
    expect(words.digitsMismatch(9, 10)).toBe('That is 9 digits. A mobile number here has 10.');
  });

  it('every word has Hindi and Marathi', async () => {
    for (const language of ['hi', 'mr'] as const) {
      const local = inviteWords((await createTranslator(language)).t);
      const english = inviteWords(t);
      expect(local.title).not.toBe(english.title);
      expect(local.noRole).not.toBe(english.noRole);
      expect(local.roles.map((role) => role.description)).not.toContain(
        english.roles[1]?.description,
      );
    }
  });
});

describe('setupInviteWords', () => {
  it('says the setup step’s acts and its steps after a send, the expiry from the policy', () => {
    expect(setupInviteWords(t)).toEqual({
      skip: 'Skip for now',
      continueSetup: 'Continue setup',
      openTeam: 'Open Team',
      afterYouSend: {
        heading: 'After you send',
        message: { title: 'HelioGrid messages their phone', line: 'Not from your number' },
        lasts: { title: 'The invite works for 7 days', line: 'Cancel it on Team' },
        join: { title: 'They join with the roles you pick', line: null },
      },
    });
  });

  it('has Hindi and Marathi', async () => {
    for (const language of ['hi', 'mr'] as const) {
      const local = setupInviteWords((await createTranslator(language)).t);
      expect(local.skip).not.toBe('Skip for now');
      expect(local.afterYouSend.join.title).not.toBe('They join with the roles you pick');
    }
  });
});

describe('inviteFieldWords', () => {
  const failed = { message: 'Enter at least 1 character' };
  it('says nothing before a press refuses', () => {
    expect(
      inviteFieldWords(inviteWords(t), IN_FORMATS, 'roles', { value: [], error: undefined }),
    ).toEqual({
      error: undefined,
    });
  });
  it('the roles refuse with the banner’s words, the name with the form’s, the number with the door’s', () => {
    const words = inviteWords(t);
    expect(inviteFieldWords(words, IN_FORMATS, 'roles', { value: [], error: {} }).error).toBe(
      words.noRole,
    );
    expect(
      inviteFieldWords(words, IN_FORMATS, 'inviteeName', { value: ' ', error: failed }).error,
    ).toBe(words.required);
    expect(
      inviteFieldWords(words, IN_FORMATS, 'inviteeName', { value: 'Anjali', error: failed }).error,
    ).toBe(failed.message);
    expect(
      inviteFieldWords(words, IN_FORMATS, 'phoneE164', { value: '+91982204', error: {} }).error,
    ).toBe('That is 6 digits. A mobile number here has 10.');
    expect(
      inviteFieldWords(words, IN_FORMATS, 'phoneE164', { value: '+919822041187', error: {} }).error,
    ).toBe(words.notCovered);
    expect(inviteFieldWords(words, IN_FORMATS, 'phoneE164', { value: '', error: {} }).error).toBe(
      words.required,
    );
    expect(
      inviteFieldWords(words, IN_FORMATS, 'inviteeName', { value: 'A'.repeat(121), error: failed })
        .error,
    ).toBe('A name can have up to 120 characters.');
  });
});

describe('the refusals’ words', () => {
  it('each refusal the form draws has its board words', () => {
    const words = inviteWords(t);
    expect(words.refusal('already_member')).toEqual({
      title: 'This number is already on your team',
      body: null,
    });
    expect(words.refusal('already_invited')).toEqual({
      title: 'This number already has an invite waiting',
      body: 'Nothing to send — to invite this number again, cancel the pending invite on Team.',
    });
    expect(words.refusal('cap')).toEqual({
      title: '50 invites in the last 24 hours — the limit for one company',
      body: 'Each invite counts for 24 hours from when it was sent.',
    });
    expect(words.refusal('not_covered')).toEqual({ title: words.notCovered, body: null });
    expect(words.differentNumber).toBe('Use a different number');
    expect(words.forbidden).toBe('You can no longer invite people to this company.');
    expect(words.failed).toBe('The invite wasn’t sent. Try again.');
  });

  it('the cap’s generic words say the rolling 24 hours, never “tomorrow”', () => {
    expect(t({ id: apiErrorMessageId('INVITE_CAP_REACHED') ?? '' })).toBe(
      'Your company has reached its invite limit for the last 24 hours.',
    );
  });
});
