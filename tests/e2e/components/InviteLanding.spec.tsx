import type { InviteFacts, InviteLandingEvent } from '@heliogrid/domain';
import { createTranslator, INVITE_LANDING, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { resolvedLength } from '../support/token';
import { InviteLandingAt } from './InviteLanding.story';

/**
 * The invite landing (`SCR-M01-08`): every part-b frame at 375 and 1536 — who invited, the invite's
 * facts, the code and its one act; the frames that name no live invite; the expired invite's ask.
 */
const en = await createTranslator('en');
const INVITE: InviteFacts = {
  inviterName: 'Rajesh Kulkarni',
  companyName: 'Suryodaya Solar',
  phoneE164: '+919845027746',
  roles: ['sales_executive'],
};
const NOW = Date.UTC(2026, 9, 21, 9, 0, 0);
const CODE = '482913';
const words = (message: Parameters<typeof en.t>[0]) =>
  en.t(message, { first: 'Rajesh', company: INVITE.companyName, days: 7, tries: 2 });

const opened: readonly InviteLandingEvent[] = [
  { type: 'read-ended', read: { kind: 'pending', invite: INVITE } },
  { type: 'request-ended', outcome: 'sent', now: NOW },
];
const FRAMES = {
  loading: [],
  empty: [{ type: 'read-ended', read: { kind: 'gone' } }],
  loadError: [{ type: 'read-ended', read: { kind: 'unread' } }],
  normal: opened,
  filled: [...opened, { type: 'code-typed', code: CODE }],
  wrong: [
    ...opened,
    { type: 'code-typed', code: CODE },
    { type: 'verify' },
    { type: 'join-ended', result: { step: 'code', outcome: 'mismatch', triesLeft: 3 } },
    { type: 'tick', now: NOW + 31_000 },
  ],
  joinFailed: [
    ...opened,
    { type: 'code-typed', code: CODE },
    { type: 'verify' },
    { type: 'join-ended', result: { step: 'join', outcome: 'failed' } },
  ],
  expired: [{ type: 'read-ended', read: { kind: 'expired', invite: INVITE } }],
  asked: [
    { type: 'read-ended', read: { kind: 'expired', invite: INVITE } },
    { type: 'ask' },
    { type: 'ask-ended', outcome: 'asked' },
  ],
  reloaded: [
    { type: 'read-ended', read: { kind: 'pending', invite: INVITE } },
    { type: 'request-ended', outcome: 'cooldown', now: NOW },
  ],
} satisfies Record<string, readonly InviteLandingEvent[]>;

async function sideways(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}
function code(root: Locator) {
  return root.getByRole('group', { name: words(INVITE_LANDING.codeLabel) });
}

for (const [width, height] of [
  [375, 812],
  [1536, 1000],
] as const) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height } });

    test('m-normal names the inviter, the company, the role and the number, and Join is the one act', async ({
      mount,
      page,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
      await expect(
        root.getByRole('heading', { level: 1, name: words(INVITE_LANDING.title) }),
      ).toBeVisible();
      await expect(root.getByText('EPC Owner · Suryodaya Solar')).toBeVisible();
      await expect(
        root.getByRole('term').filter({ hasText: words(INVITE_LANDING.rolesLabel) }),
      ).toBeVisible();
      await expect(root.getByText('Sales Executive')).toBeVisible();
      await expect(root.getByText('+91 98450 27746')).toBeVisible();
      await expect(root.getByRole('textbox', { name: /number/i })).toHaveCount(0);
      await expect(code(root)).toBeVisible();
      await expect(root.getByRole('button', { name: words(INVITE_LANDING.join) })).toBeEnabled();
      await expect(
        root.getByRole('button', { name: en.t(SIGN_IN.resendInLabel, { seconds: 30 }) }),
      ).toBeDisabled();
      expect(await sideways(page)).toBe(0);
    });

    test('m-expired asks the inviter again, shows no code, and the ask leads to m-reinvite-requested', async ({
      mount,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.expired} />);
      await expect(root.getByText(words(INVITE_LANDING.expired))).toBeVisible();
      await expect(root.getByText(words(INVITE_LANDING.expiredLine))).toBeVisible();
      await expect(code(root)).toHaveCount(0);
      await expect(root.getByText(words(INVITE_LANDING.askFoot))).toBeVisible();
      await root.getByRole('button', { name: words(INVITE_LANDING.ask) }).click();
      await expect(root.getByTestId('pressed')).toHaveText('ask');
    });

    test('m-reinvite-requested names the inviter, offers no code, and leads to sign in', async ({
      mount,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.asked} />);
      await expect(root.getByText(words(INVITE_LANDING.askedTitle))).toBeVisible();
      await expect(root.getByText(words(INVITE_LANDING.askedLine))).toBeVisible();
      await expect(code(root)).toHaveCount(0);
      await root.getByRole('button', { name: words(INVITE_LANDING.signIn) }).click();
      await expect(root.getByTestId('pressed')).toHaveText('sign-in');
    });

    test('m-empty names nobody, sends nothing, and leads to sign in over its line', async ({
      mount,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.empty} />);
      await expect(root.getByText(words(INVITE_LANDING.goneTitle))).toBeVisible();
      await expect(root.getByText(words(INVITE_LANDING.goneNote))).toBeVisible();
      await expect(root.getByText('Rajesh')).toHaveCount(0);
      await root.getByRole('button', { name: words(INVITE_LANDING.signIn) }).click();
      await expect(root.getByTestId('pressed')).toHaveText('sign-in');
    });

    test('m-load-error names nobody and its one act is Try again', async ({ mount }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.loadError} />);
      await expect(root.getByText(words(INVITE_LANDING.loadFailed))).toBeVisible();
      await expect(root.getByRole('button')).toHaveCount(1);
      await root.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
      await expect(root.getByRole('status', { name: words(INVITE_LANDING.loading) })).toBeVisible();
    });

    test('m-loading holds the invite’s place, says what is loading, and offers no act', async ({
      mount,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.loading} />);
      await expect(root.getByRole('status', { name: words(INVITE_LANDING.loading) })).toBeVisible();
      await expect(root.getByRole('button')).toHaveCount(0);
    });
  });
}

test.describe('the code at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('m-otp-auto-read says where the code came from', async ({ mount }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.filled} />);
    await expect(root.getByText(words(INVITE_LANDING.filled))).toBeVisible();
  });

  test('m-wrong-code: the field counts the wrong tries and the resend is live; nothing else changes', async ({
    mount,
  }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.wrong} />);
    await expect(root.getByText(words(INVITE_LANDING.wrong))).toBeVisible();
    await expect(root.getByRole('button', { name: en.t(SIGN_IN.resendCode) })).toBeEnabled();
    await expect(
      root.getByRole('heading', { level: 1, name: words(INVITE_LANDING.title) }),
    ).toBeVisible();
  });

  test('m-error: the banner above the card, the code held read-only, and Try again', async ({
    mount,
  }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.joinFailed} />);
    const banner = await root.getByText(words(INVITE_LANDING.joinFailedLine)).boundingBox();
    const card = await root.getByText(words(INVITE_LANDING.codeWent)).boundingBox();
    expect(banner?.y ?? 0).toBeLessThan(card?.y ?? 0);
    const boxes = code(root).locator('input');
    await expect(boxes.first()).toHaveAttribute('readonly', '');
    await expect(boxes.first()).toBeEnabled();
    await root.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
    await expect(root.getByTestId('pressed')).toHaveText('try-again');
  });

  test('a reload inside the gap holds Join until a code of its own is sent', async ({ mount }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.reloaded} />);
    await expect(root.getByRole('button', { name: words(INVITE_LANDING.join) })).toBeDisabled();
  });

  test('the acts follow the content with no gap, and the code takes no focus on arrival', async ({
    mount,
    page,
  }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
    const resend = await root.locator('.hg-invite-landing-resend').boundingBox();
    const join = await root.getByRole('button', { name: words(INVITE_LANDING.join) }).boundingBox();
    expect((join?.y ?? 0) - ((resend?.y ?? 0) + (resend?.height ?? 0))).toBe(
      await resolvedLength(page, '--sp-4'),
    );
    await expect(code(root).locator('input').first()).not.toBeFocused();
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} m-normal fits the width`, async ({ mount, page }) => {
      await mount(<InviteLandingAt reader={reader} events={FRAMES.normal} />);
      expect(await sideways(page)).toBe(0);
    });
  }
});

test.describe('the code at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('the code takes focus on arrival, then Join, then the resend, centred in the task pane', async ({
    mount,
  }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
    await expect(code(root).locator('input').first()).toBeFocused();
    const field = await code(root).boundingBox();
    const join = await root.getByRole('button', { name: words(INVITE_LANDING.join) }).boundingBox();
    const resend = await root.locator('.hg-invite-landing-resend').boundingBox();
    expect(field?.y ?? 0).toBeLessThan(join?.y ?? 0);
    expect(join?.y ?? 0).toBeLessThan(resend?.y ?? 0);
    const pane = await root.locator('.hg-door-task').boundingBox();
    const column = await root.locator('.hg-invite-landing').boundingBox();
    const left = (column?.x ?? 0) - (pane?.x ?? 0);
    const right = (pane?.x ?? 0) + (pane?.width ?? 0) - ((column?.x ?? 0) + (column?.width ?? 0));
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });

  test('the invite’s facts sit in the context pane, with no card', async ({ mount }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
    const identity = await root.locator('.hg-door-identity').boundingBox();
    const facts = await root.getByText(words(INVITE_LANDING.codeWent)).boundingBox();
    expect(facts?.x ?? 0).toBeLessThan((identity?.x ?? 0) + (identity?.width ?? 0));
    await expect(root.locator('.hg-door-identity .hg-card')).toHaveCount(0);
  });
});

for (const [width, focused] of [
  [375, false],
  [1536, true],
] as const) {
  test.describe(`opening at ${width}`, () => {
    test.use({ viewport: { width, height: width === 375 ? 812 : 1000 } });

    test(`the read answering moves no focus but the code's own${focused ? ', which takes it' : ''}`, async ({
      mount,
      page,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={[]} later={FRAMES.normal} />);
      await expect(code(root)).toBeVisible();
      const first = code(root).locator('input').first();
      if (focused) await expect(first).toBeFocused();
      else expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
    });
  });
}

test.describe('a frame a press takes away', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the ask hands the focus to the next frame’s act', async ({ mount }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.expired} />);
    await root.getByRole('button', { name: words(INVITE_LANDING.ask) }).click();
    await expect(root.getByRole('button', { name: words(INVITE_LANDING.signIn) })).toBeFocused();
  });
});

test.describe('the task at 1536 in reading order', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('Tab from the code reaches Join before the resend', async ({ mount, page }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.wrong} />);
    await code(root).locator('input').last().focus();
    await page.keyboard.press('Tab');
    await expect(root.getByRole('button', { name: words(INVITE_LANDING.join) })).toBeFocused();
  });

  test('a wrong code wraps its line inside the boxes: the column does not move', async ({
    mount,
  }) => {
    const before = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
    const normal = await code(before).boundingBox();
    await before.unmount();
    const after = await mount(<InviteLandingAt reader="en" events={FRAMES.wrong} />);
    const wrong = await code(after).boundingBox();
    expect(wrong?.x).toBeCloseTo(normal?.x ?? 0, 0);
    expect(wrong?.width).toBeCloseTo(normal?.width ?? 0, 0);
  });
});
