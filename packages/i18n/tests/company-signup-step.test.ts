import { describe, expect, it } from 'vitest';
import { companyStepWords } from '../src/copy/company-signup-step';
import { createTranslator } from '../src/runtime';

/**
 * Every word company signup's step 3 picks by what holds (`SCR-M01-02`): the plain step's frames,
 * and the join steer that takes the primary's place (`M01-09`). Both platforms draw what this
 * returns and pick nothing themselves.
 */
describe('companyStepWords', () => {
  const plain = {
    restored: false,
    writing: false,
    failure: null,
    fieldRefused: false,
    steer: null,
  };
  const steered = {
    company: { companyName: 'Suryodaya Solar', city: 'Pune' },
    groupedPhone: '+91 94220 31088',
    failure: null,
  };

  it('the plain step as it opens: the step header, the title, the account, the create primary', async () => {
    const { t } = await createTranslator('en');
    expect(companyStepWords(t, plain)).toEqual({
      steps: { label: 'Create a company', steps: ['Your number', 'Code', 'Your company'] },
      title: 'Your company',
      intro: "Three details, and you're in.",
      block: null,
      account: { label: 'Your account', verified: 'Verified' },
      resumeLine: null,
      caption: null,
      primary: { label: 'Create company', aria: undefined },
      steer: null,
      helpers: {
        ownerName: 'You become the first EPC owner.',
        cityWhileEmpty: "Where you're based.",
      },
    });
  });

  /** The plain step's frames reach the component as `companySignupWords` writes them. */
  it.each([
    ['resumed', { restored: true }, 'Welcome back — carry on', null, null, 'Create company'],
    [
      'with a field refusing the press',
      { fieldRefused: true },
      'Your company',
      null,
      null,
      'Create company',
    ],
    [
      'writing',
      { writing: true },
      'Your company',
      null,
      'Writing these three details now.',
      'Creating your company',
    ],
    [
      'after a refusal',
      { failure: 'failed' },
      'We could not create the company',
      null,
      'If it keeps failing, sign in later to carry on.',
      'Try again',
    ],
    [
      'after no answer',
      { failure: 'unreached' },
      'We could not confirm the company',
      null,
      'If it keeps failing, sign in later to carry on.',
      'Try again',
    ],
  ] as const)(
    'the step %s: its title, intro, caption and primary',
    async (_name, facts, title, intro, caption, primary) => {
      const { t } = await createTranslator('en');
      const words = companyStepWords(t, { ...plain, ...facts });
      expect(words.title).toBe(title);
      expect(words.intro).toBe(intro);
      expect(words.caption).toBe(caption);
      expect(words.primary.label).toBe(primary);
    },
  );

  /** The resume line belongs to a resumed step that has nothing else to say (`M01-10`). */
  it.each([
    ['as it opens', {}, null],
    ['resumed', { restored: true }, 'No company was made yet — carry on from here.'],
    ['resumed, then the create refused', { restored: true, failure: 'failed' }, null],
    ['resumed, then the create unanswered', { restored: true, failure: 'unreached' }, null],
    ['resumed, under the steer', { restored: true, steer: steered }, null],
  ] as const)('the step %s: its resume line', async (_name, facts, line) => {
    const { t } = await createTranslator('en');
    expect(companyStepWords(t, { ...plain, ...facts }).resumeLine).toBe(line);
  });

  /** The verified number is drawn unless a failure block or the steer takes its place. */
  it.each([
    ['as it opens', {}, true],
    ['resumed', { restored: true }, true],
    ['writing', { writing: true }, true],
    ['with a field refusing the press', { fieldRefused: true }, true],
    ['after a refusal', { failure: 'failed' }, false],
    ['after no answer', { failure: 'unreached' }, false],
    ['under the steer', { steer: steered }, false],
  ] as const)('the step %s: its account', async (_name, facts, drawn) => {
    const { t } = await createTranslator('en');
    const { account } = companyStepWords(t, { ...plain, ...facts });
    expect(account).toEqual(drawn ? { label: 'Your account', verified: 'Verified' } : null);
  });

  it.each([
    ['was refused', 'failed', 'Something on our side failed'],
    ['got no answer', 'unreached', 'We did not hear back'],
  ] as const)(
    'a create that %s says itself when its block appears',
    async (_name, failure, title) => {
      const { t } = await createTranslator('en');
      const words = companyStepWords(t, { ...plain, failure });
      expect(words.block).toMatchObject({ tone: 'danger', title, announce: 'alert' });
      expect(words.primary).toEqual({ label: 'Try again', aria: undefined });
    },
  );

  it('under the steer: its own title, the finding, both roads, and no line under a field', async () => {
    const { t } = await createTranslator('en');
    expect(companyStepWords(t, { ...plain, steer: steered })).toEqual({
      steps: { label: 'Create a company', steps: ['Your number', 'Code', 'Your company'] },
      title: 'This company may already be here',
      intro: null,
      block: null,
      account: null,
      resumeLine: null,
      caption: null,
      primary: {
        label: 'Request to join',
        aria: 'Request to join the existing Suryodaya Solar workspace',
      },
      steer: {
        finding: {
          title: 'A workspace already exists for Suryodaya Solar in Pune',
          body: 'Asking to join sends its owner a request to add +91 94220 31088.',
        },
        createAnyway: 'Create a new company anyway',
      },
      helpers: undefined,
    });
  });

  /** Once a request did not land the road asks again, and its own words name it. */
  it.each([
    [
      'was refused',
      'failed',
      'Your request did not go through',
      'Something on our side failed, so nothing was sent.',
    ],
    [
      'got no answer',
      'unreached',
      'We did not hear back',
      'Your request may already be with the owner.',
    ],
  ] as const)(
    'under the steer, a request that %s: its block, spoken, and the road to send it again',
    async (_name, failure, title, body) => {
      const { t } = await createTranslator('en');
      const words = companyStepWords(t, { ...plain, steer: { ...steered, failure } });
      expect(words.block).toEqual({ tone: 'danger', title, body, announce: 'alert' });
      expect(words.primary).toEqual({ label: 'Send the request again', aria: undefined });
      expect(words.steer?.createAnyway).toBe('Create a new company anyway');
    },
  );

  it.each(['hi', 'mr'] as const)(
    'speaks %s on the plain step and under the steer',
    async (language) => {
      const { t } = await createTranslator(language);
      const opens = companyStepWords(t, { ...plain, restored: true });
      expect(opens.account?.label).not.toBe('Your account');
      expect(opens.resumeLine).not.toBe('No company was made yet — carry on from here.');
      const join = companyStepWords(t, { ...plain, steer: steered });
      expect(join.title).not.toBe('This company may already be here');
      expect(join.primary.aria).toContain('Suryodaya Solar');
      expect(join.primary.aria).not.toContain('Request to join');
      expect(join.steer?.createAnyway).not.toBe('Create a new company anyway');
    },
  );
});
