import { IN_FORMATS, ROLE_PRESETS } from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import { inviteFieldWords, inviteWords } from '../src/copy/invite';
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
