import {
  type FrameKind,
  INITIAL_LOGIN_STATE,
  type LoginState,
  loginFrame,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { SHELL } from '../src/copy/shell';
import { SIGN_IN } from '../src/copy/sign-in';
import { doorNoticeWords, signInWords } from '../src/copy/sign-in-frames';
import { createTranslator, type MessageRef } from '../src/runtime';

/**
 * No answer is never told as our failure (`F8-36`, `SCR-M01-01` decision 17): each request or check
 * that got no answer names both sides, and each refusal keeps its own words.
 */
const FACTS = { cooldownLeft: 0, triesLeft: 5 };
const otp = (over: Partial<LoginState>): LoginState => ({
  ...INITIAL_LOGIN_STATE,
  step: 'otp',
  phone: '+919820041123',
  request: 'sent',
  placed: true,
  sends: 1,
  ...over,
});
const byCall = { channel: 'voice', placed: true } as const;
const { notReached, ourSideFailed } = SIGN_IN;

describe('signInWords — a request or a check with no answer names both sides', () => {
  it.each<[FrameKind, Partial<LoginState>, MessageRef]>([
    ['auth-unreached', { verify: 'unreached' }, notReached],
    ['request-unreached', { request: 'unreached' }, notReached],
    ['call-request-unreached', { request: 'unreached', ...byCall }, notReached],
    ['auth-error', { verify: 'failed' }, ourSideFailed],
    ['request-failed', { request: 'failed' }, ourSideFailed],
    ['call-request-failed', { request: 'failed', ...byCall }, ourSideFailed],
  ])('%s carries its own block', async (_kind, facts, title) => {
    const { t } = await createTranslator('en');
    const { block } = signInWords(t, loginFrame(otp(facts), true), FACTS);
    expect(block).toEqual({ tone: 'danger', title: t(title) });
  });
});

describe('doorNoticeWords — the number step names what failed, then both sides', () => {
  it.each(['en', 'hi', 'mr'] as const)('not-reached in %s', async (language) => {
    const { t } = await createTranslator(language);
    const words = doorNoticeWords(t, 'not-reached');
    expect(words).toEqual({
      tone: 'danger',
      title: t(SIGN_IN.requestFailedTitle),
      body: t(SIGN_IN.notReached),
      announce: 'alert',
    });
    const en = await createTranslator('en');
    if (language !== 'en') expect(words.body).not.toBe(en.t(SIGN_IN.notReached));
  });
});

describe('doorNoticeWords — a removal found at the door is a fact, not a refusal (S1.wrong.4)', () => {
  it.each(['en', 'hi', 'mr'] as const)(
    'access-removed in %s: the info tone, the title alone',
    async (language) => {
      const { t } = await createTranslator(language);
      expect(doorNoticeWords(t, 'access-removed')).toEqual({
        tone: 'info',
        title: t(SHELL.accessRemoved),
        announce: 'status',
      });
    },
  );
});

/**
 * The signup door's ask beside the code step's title (`SCR-M01-02` *What the code does*): it stands
 * where the frame carries no rule of its own, and a limit frame keeps its own (`SCR-M01-01`).
 */
describe('signInWords — the door’s ask beside the title', () => {
  const ask = { label: 'About the ask', title: 'The ask', pages: ['One page.'] } as const;
  it.each([
    ['a sent code shows the door’s ask', otp({}), 'The ask'],
    ['a capped frame keeps its own rule', otp({ request: 'capped' }), 'Code limits'],
  ] as const)('%s', async (_name, state, title) => {
    const { t } = await createTranslator('en');
    const words = signInWords(t, loginFrame(state, false), FACTS, { explainer: ask });
    expect(words.explainer?.title).toBe(title);
  });
});
