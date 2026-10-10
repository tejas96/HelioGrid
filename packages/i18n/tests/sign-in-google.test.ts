import { UI_LANGUAGES } from '@heliogrid/contracts';
import {
  INITIAL_LOGIN_STATE,
  type LoginState,
  loginFrame,
  type UiLanguage,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { explainerPagerWords } from '../src/copy/explainer';
import { SIGN_IN } from '../src/copy/sign-in';
import { signInWords } from '../src/copy/sign-in-frames';
import { googleLinkWords, phoneGoogleWords } from '../src/copy/sign-in-google';
import { createTranslator } from '../src/runtime';

/**
 * The Google door's words (`SCR-M01-01`, the Google frames), read against the real catalogs:
 * English as the board draws it, and every new sentence translated in Hindi and Marathi.
 */
const EMAIL = 'priya.sharma@gmail.com';
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
const google = { idToken: 't', nonce: null, email: EMAIL };
/** A door with a Google sheet behind it — the sign-in door. */
const signInFrame = (state: LoginState) => loginFrame(state, true);

describe('the code frames carry Google', () => {
  it('the locked frame offers Google with the hedged sentence (M01-04)', async () => {
    const { t } = await createTranslator('en');
    const words = signInWords(t, signInFrame(otp({ request: 'locked' })), FACTS);
    expect(words.google).toEqual({
      sentence: "If you've signed in with Google before, it still works.",
      label: 'Continue with Google',
      aria: 'Continue with Google. Signs you in to the same account as your mobile number.',
    });
  });

  it('the locked frame names what paused and for how long, and nothing else (M01-04, F7-46)', async () => {
    const { t } = await createTranslator('en');
    const words = signInWords(t, signInFrame(otp({ request: 'locked' })), FACTS);
    expect(words.title).toBe('SMS codes paused for 15 minutes');
    expect(words.sub).toBe('Paused for');
    expect(words.block).toEqual({ tone: 'danger', title: '3 codes were invalidated in a row' });
    expect(words.foot).toBeNull();
    expect(words.wait).toBeNull();
  });

  it("the resend gap is the control's own label, m:ss, and its spoken name in seconds", async () => {
    const { t } = await createTranslator('en');
    const waiting = signInFrame(otp({ resendAt: 1, cooldownLeft: 24 }));
    expect(signInWords(t, waiting, { ...FACTS, cooldownLeft: 24 }).wait).toEqual({
      label: 'Resend code in 0:24',
      spoken: 'Resend code, available in 24 seconds',
    });
    expect(signInWords(t, waiting, { ...FACTS, cooldownLeft: 1 }).wait?.spoken).toBe(
      'Resend code, available in 1 second',
    );
  });

  it('the cap keeps its limits behind the Explainer (m-cap-reached)', async () => {
    const { t } = await createTranslator('en');
    const words = signInWords(t, signInFrame(otp({ request: 'capped' })), FACTS);
    expect(words.explainer).toMatchObject({
      label: 'About code limits',
      title: 'Code limits',
      pages: ['You can ask for 3 codes every 15 minutes, and 8 a day.'],
    });
    expect(words.wait).toBeNull();
    expect(words.foot).toBeNull();
  });

  it('google-phone-taken: the block, the number signs in, another login', async () => {
    const { t } = await createTranslator('en');
    const frame = signInFrame(otp({ googleEnded: 'phone-taken', google, code: '482913' }));
    const words = signInWords(t, frame, FACTS);
    expect(words.title).toBe('This Google login cannot be linked');
    expect(words.sub).toBe('The code was correct for');
    expect(words.block?.title).toBe('This number is linked to another Google account');
    expect(words.primary).toBe('Sign in with this number');
    expect(words.primaryAria).toBe('Sign in with this number. The code is already verified.');
    expect(words.google).toEqual({
      sentence: null,
      label: 'Use a different Google account',
      aria: 'Use a different Google account',
    });
  });

  it('a linking code names the login under the number, and Verify says it links', async () => {
    const { t } = await createTranslator('en');
    const words = signInWords(t, signInFrame(otp({ google })), FACTS);
    expect(words.links).toBe(`Links ${EMAIL}`);
    expect(words.primaryAria).toBe('Verify the code, link this Google login and sign in');
  });

  it('a plain code frame carries none of it', async () => {
    const { t } = await createTranslator('en');
    const words = signInWords(t, signInFrame(otp({})), FACTS);
    expect(words).toMatchObject({ links: null, google: null, primaryAria: null });
  });
});

describe('phoneGoogleWords', () => {
  it('the control, the "or", and the account rule in its accessible name', async () => {
    const { t } = await createTranslator('en');
    expect(phoneGoogleWords(t, { busy: false, failed: false })).toEqual({
      or: 'or',
      label: 'Continue with Google',
      aria: 'Continue with Google. Signs you in to the same account as your mobile number.',
      failed: null,
    });
  });

  it('spinning, it names what it is opening (m-google-loading)', async () => {
    const { t } = await createTranslator('en');
    expect(phoneGoogleWords(t, { busy: true, failed: false }).aria).toBe('Opening Google sign-in');
  });

  it('a sign-in that did not finish says nothing changed (m-google-failed)', async () => {
    const { t } = await createTranslator('en');
    expect(phoneGoogleWords(t, { busy: false, failed: true }).failed).toEqual({
      tone: 'danger',
      title: 'Google sign-in did not finish',
      body: 'Try again, or use your number.',
    });
  });
});

describe('googleLinkWords', () => {
  const open = { kind: 'link', phoneEnabled: true, sendOffered: true, sending: false } as const;

  it('the link step: title, explainer, the tile, Send code that links (m-google-link)', async () => {
    const { t } = await createTranslator('en');
    const words = googleLinkWords(t, open, EMAIL, null);
    expect(words.title).toBe('Confirm your mobile number');
    expect(words.explainer?.title).toBe('How linking works');
    expect(words.explainer?.pages[0]).toBe(
      'HelioGrid accounts are mobile numbers. Google never makes a second account.',
    );
    expect(words.body).toBe("We'll link this Google login to your number.");
    expect(words.tileOverline).toBe('Signing in with Google');
    expect(words.email).toBe(EMAIL);
    expect(words.anotherAccount).toEqual({
      underTile: 'Not you? Use a different Google account',
      short: 'Use a different Google account',
    });
    expect(words.send).toEqual({
      label: 'Send code',
      aria: 'Send the code by SMS and link this Google login',
    });
    expect(words.locked).toBeNull();
  });

  it('Send code names the send while it runs', async () => {
    const { t } = await createTranslator('en');
    expect(googleLinkWords(t, { ...open, sending: true }, EMAIL, null).send?.label).toBe(
      'Sending the code',
    );
  });

  it('the locked link: no Send code, no explainer, the block and the wait (m-google-link-locked)', async () => {
    const { t } = await createTranslator('en');
    const locked = {
      kind: 'link-locked',
      phoneEnabled: false,
      sendOffered: false,
      sending: false,
    } as const;
    const words = googleLinkWords(t, locked, EMAIL, null);
    expect(words.send).toBeNull();
    expect(words.explainer).toBeNull();
    expect(words.locked?.block).toEqual({
      tone: 'danger',
      title: '3 codes were invalidated in a row',
    });
    expect(words.locked?.sentence).toBe('SMS codes are paused for 15 minutes, so linking waits.');
  });

  it.each(UI_LANGUAGES)(
    'the ask beside the title carries the pager’s words, in %s',
    async (language) => {
      const { t } = await createTranslator(language);
      const pager = explainerPagerWords(t);
      const { explainer } = googleLinkWords(t, open, EMAIL, null);
      expect(explainer?.nextLabel).toBe(pager.nextLabel);
      expect(explainer?.backLabel).toBe(pager.backLabel);
      expect(explainer?.positionLabel(1, 2)).toBe(pager.positionLabel(1, 2));
    },
  );

  it.each(UI_LANGUAGES)(
    'the field: no refusal as the step opens, both counts once pressed, in %s',
    async (language) => {
      const { t } = await createTranslator(language);
      expect(googleLinkWords(t, open, EMAIL, null).phoneError).toBeUndefined();
      const refused = googleLinkWords(t, open, EMAIL, { typed: 7, needed: 10 });
      expect(refused.phoneError).toBe(t(SIGN_IN.digitsMismatch, { typed: 7, needed: 10 }));
      expect(refused.phoneError).toContain('7');
      expect(refused.phoneError).toContain('10');
    },
  );
});

/** Every key this door added; each must read in the reader's own language (`F3-07`). */
const GOOGLE_KEYS = [
  'or',
  'continueWithGoogle',
  'continueWithGoogleLabel',
  'openingGoogle',
  'googleFailedTitle',
  'googleFailedBody',
  'confirmYourNumber',
  'linkingBody',
  'linkingExplainerLabel',
  'linkingExplainerTitle',
  'linkingExplainerIntro',
  'linkingExplainerPage',
  'signingInWithGoogle',
  'notYouUseAnotherGoogle',
  'useAnotherGoogle',
  'useMyNumberInstead',
  'useMyNumberInsteadLabel',
  'sendCodeAndLinkLabel',
  'linksEmail',
  'verifyAndLinkLabel',
  'phoneTakenTitle',
  'codeCorrectFor',
  'phoneTakenBlockTitle',
  'signInWithThisNumberLabel',
  'lockedGoogleSentence',
  'linkLockedSentence',
  // The words pass (`F7-46`): every sentence it changed or added.
  'intro',
  'wrongError',
  'triesLeft',
  'lockedTitle',
  'lockedFor',
  'authErrorFoot',
  'switchSubtitle',
  'resendIn',
  'resendInLabel',
  'codeLimitsExplainerLabel',
  'codeLimitsExplainerTitle',
  'codeLimitsExplainerPage',
] as const satisfies readonly (keyof typeof SIGN_IN)[];

describe.each<UiLanguage>(['hi', 'mr'])('the Google words in %s', (language) => {
  it.each(GOOGLE_KEYS)('%s is translated', async (key) => {
    const { t } = await createTranslator(language);
    const english = (await createTranslator('en')).t(SIGN_IN[key]);
    const translated = t(SIGN_IN[key]);
    expect(translated.trim()).not.toBe('');
    expect(translated).not.toBe(english);
  });
});
