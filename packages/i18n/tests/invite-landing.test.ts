import {
  INITIAL_INVITE_LANDING,
  type InviteFacts,
  type InviteLandingEvent,
  type InviteLandingState,
  inviteLandingFrame,
  inviteLandingReducer,
  ROLE_PRESETS,
} from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import { type InviteLandingWords, inviteLandingWords } from '../src/copy/invite-landing';
import { createTranslator } from '../src/runtime';

/** The invite landing's words (`SCR-M01-08`): the board's, word for word, the pronoun ruled out (brief ruling 15). */
const INVITE: InviteFacts = {
  inviterName: 'Rajesh Kulkarni',
  companyName: 'Suryodaya Solar',
  phoneE164: '+919845027746',
  /* The third preset, Sales Executive. */
  roles: [ROLE_PRESETS[2]],
};
const NOW = Date.UTC(2026, 9, 21, 9, 0, 0);

let t: Awaited<ReturnType<typeof createTranslator>>['t'];
beforeAll(async () => {
  t = (await createTranslator('en')).t;
});

function at(...events: readonly InviteLandingEvent[]): InviteLandingState {
  return events.reduce(inviteLandingReducer, INITIAL_INVITE_LANDING);
}
function wordsOf(state: InviteLandingState, translate = t): InviteLandingWords {
  const { cooldownLeft, triesLeft } = state.code;
  return inviteLandingWords(translate, inviteLandingFrame(state), state.invite, {
    cooldownLeft,
    triesLeft,
  });
}
const read = (kind: 'pending' | 'expired') =>
  ({ type: 'read-ended', read: { kind, invite: INVITE } }) as const;
const sent = { type: 'request-ended', outcome: 'sent', now: NOW } as const;
const normal = at(read('pending'), sent);
const filled = at(read('pending'), sent, { type: 'code-typed', code: '482913' });
const joining = inviteLandingReducer(filled, { type: 'verify' });
const wrong = inviteLandingReducer(joining, {
  type: 'join-ended',
  result: { step: 'code', outcome: 'mismatch', triesLeft: 3 },
});
const joinFailed = inviteLandingReducer(joining, {
  type: 'join-ended',
  result: { step: 'join', outcome: 'failed' },
});
const expired = at(read('expired'));
const asked = at(read('expired'), { type: 'ask' }, { type: 'ask-ended', outcome: 'asked' });

describe('inviteLandingWords', () => {
  it('m-normal: who invited, the heading, the invite card, the code and Join', () => {
    const words = wordsOf(normal);
    expect(words.inviter).toEqual({
      name: 'Rajesh Kulkarni',
      label: 'EPC Owner · Suryodaya Solar',
    });
    expect(words.title).toBe('Rajesh invited you to Suryodaya Solar');
    expect(words.facts).toEqual({
      label: 'Your invite',
      rolesLabel: 'Rajesh set you up as',
      roles: ['Sales Executive'],
      phoneLabel: 'Mobile number',
      line: 'The code went to the number Rajesh entered; if it is wrong, decline.',
    });
    expect(words.codeLabel).toBe('Code from the SMS');
    expect(words.primary).toBe('Join Suryodaya Solar');
    expect(words.wait).toEqual({
      label: 'Resend code in 0:30',
      spoken: 'Resend code, available in 30 seconds',
    });
    expect(words.banner).toBeNull();
  });

  it('m-otp-auto-read: the helper says where the code came from', () => {
    expect(wordsOf(filled).codeHelper).toBe('Filled from the SMS — check it, or type over it.');
  });

  it('m-wrong-code: the field counts the wrong tries, and the resend is live once the gap is over', () => {
    const cooled = inviteLandingReducer(wrong, { type: 'tick', now: NOW + 31_000 });
    const words = wordsOf(cooled);
    expect(words.codeError).toBe(
      'That is not the code we sent. 2 wrong tries so far — check the last SMS, or ask for a new one.',
    );
    expect(words.resend).toBe('Resend code');
    expect(words.primary).toBe('Join Suryodaya Solar');
  });

  it.each([
    [4, '1 wrong try so far'],
    [3, '2 wrong tries so far'],
  ])('with %i tries left the field says “%s”', (triesLeft, phrase) => {
    const state = inviteLandingReducer(joining, {
      type: 'join-ended',
      result: { step: 'code', outcome: 'mismatch', triesLeft },
    });
    expect(wordsOf(state).codeError).toContain(phrase);
  });

  it('m-error: the join failed — the banner above the code, Try again, no resend', () => {
    const words = wordsOf(joinFailed);
    expect(words.banner).toEqual({
      tone: 'danger',
      title: 'Something on our side failed',
      line: 'You have not joined yet, and this invite still works.',
    });
    expect(words.primary).toBe('Try again');
    expect(words.resend).toBeNull();
    expect(words.wait).toBeNull();
  });

  it('m-expired: the warning, the ask by name, and its line', () => {
    const words = wordsOf(expired);
    expect(words.banner).toEqual({
      tone: 'warning',
      title: 'This invite has expired',
      line: 'An invite lasts 7 days, and this one is past that.',
    });
    expect(words.primary).toBe('Ask Rajesh to invite you again');
    expect(words.foot).toBe('One tap tells Rajesh you are still waiting.');
    expect(words.facts).not.toBeNull();
  });

  it('an ask that failed says so above the act', () => {
    const failed = at(read('expired'), { type: 'ask' }, { type: 'ask-ended', outcome: 'failed' });
    expect(wordsOf(failed).banner).toEqual({
      tone: 'danger',
      title: 'Something on our side failed',
      line: null,
    });
  });

  it('m-reinvite-requested and m-empty name the next step, never a pronoun', () => {
    expect(wordsOf(asked).place).toEqual({
      title: 'Rajesh has been asked for a new invite',
      line: 'When Rajesh sends it, a new link reaches this phone.',
      act: 'Sign in to HelioGrid',
      note: 'For an account you already have with another company.',
    });
    expect(wordsOf(at({ type: 'read-ended', read: { kind: 'gone' } })).place).toEqual({
      title: 'This invite is not there any more',
      line: 'It may already have been used, or taken back by the person who sent it.',
      act: 'Sign in to HelioGrid',
      note: 'Not joined yet? Ask whoever invited you for a new invite.',
    });
  });

  it('m-load-error names nobody and offers Try again', () => {
    const words = wordsOf(at({ type: 'read-ended', read: { kind: 'unread' } }));
    expect(words.loadError).toEqual({
      title: 'Your invite did not load',
      line: 'Something on our side failed; try again in a moment.',
    });
    expect(words.inviter).toBeNull();
    expect(words.primary).toBe('Try again');
  });

  it.each(['hi', 'mr'] as const)('every landing word has %s', async (language) => {
    const local = (await createTranslator(language)).t;
    for (const state of [normal, filled, wrong, joinFailed, expired, asked]) {
      const english = JSON.stringify(wordsOf(state));
      const translated = JSON.stringify(wordsOf(state, local));
      // Every value but the inviter's own name, never translated, and the banners' tones.
      for (const value of english.match(/:"[^"]+"/g) ?? []) {
        if (value === ':"Rajesh Kulkarni"' || value === ':"danger"' || value === ':"warning"')
          continue;
        expect(translated).not.toContain(value);
      }
    }
  });
});
