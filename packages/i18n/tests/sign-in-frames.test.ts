import {
  type FrameKind,
  INITIAL_LOGIN_STATE,
  type LoginState,
  loginFrame,
  OTP_LENGTH,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { explainerPagerWords } from '../src/copy/explainer';
import { SIGN_IN } from '../src/copy/sign-in';
import { signInWords } from '../src/copy/sign-in-frames';
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
const LANGUAGES = ['en', 'hi', 'mr'] as const;

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

/**
 * The pager's words reach the ask with its own (`F7-46`): `packages/ui` cannot ask for them, so a
 * frame's rule and a door's ask both leave here complete, and a frame with no ask carries none.
 */
describe('signInWords — the ask beside the title carries the pager’s words', () => {
  const ask = { label: 'About the ask', title: 'The ask', pages: ['One page.'] } as const;
  it.each(LANGUAGES)('the frame’s own rule and the door’s ask, in %s', async (language) => {
    const { t } = await createTranslator(language);
    const pager = explainerPagerWords(t);
    const asks = [
      signInWords(t, loginFrame(otp({ request: 'capped' }), false), FACTS).explainer,
      signInWords(t, loginFrame(otp({}), false), FACTS, { explainer: ask }).explainer,
    ];
    for (const explainer of asks) {
      expect(explainer?.nextLabel).toBe(pager.nextLabel);
      expect(explainer?.backLabel).toBe(pager.backLabel);
      expect(explainer?.positionLabel(2, 3)).toBe(pager.positionLabel(2, 3));
    }
  });

  it('a frame with no rule on a door with no ask draws none', async () => {
    const { t } = await createTranslator('en');
    expect(signInWords(t, loginFrame(otp({}), false), FACTS).explainer).toBeNull();
  });
});

describe('signInWords — the words every code frame draws', () => {
  it.each(LANGUAGES)('the way back and the field’s label, in %s', async (language) => {
    const { t } = await createTranslator(language);
    const words = signInWords(t, loginFrame(otp({}), false), FACTS);
    expect(words.changeNumber).toBe(t(SIGN_IN.changeNumber));
    expect(words.codeLabel).toBe(t(SIGN_IN.codeLabel, { n: OTP_LENGTH }));
    expect(words.codeLabel).toContain(String(OTP_LENGTH));
  });
});
