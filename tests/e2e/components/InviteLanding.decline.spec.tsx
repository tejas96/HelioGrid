import type { InviteFacts, InviteLandingEvent } from '@heliogrid/domain';
import { createTranslator, INVITE_DECLINE, INVITE_LANDING, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { bottomOf, expectNoSidewaysScroll } from '../support/layout';
import { animationsSettled } from '../support/motion';
import { resolvedLength } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { InviteLandingAt } from './InviteLanding.story';

/**
 * The invite landing's decline (`SCR-M01-08` declined-notifies-owner): the control on the live
 * invite, the confirm that only its two acts close — a sheet at 375, a danger dialog at 1536 —
 * a decline that did not go through (brief ruling 19), and `m-declined`.
 */
const en = await createTranslator('en');
const INVITE: InviteFacts = {
  inviterName: 'Rajesh Kulkarni',
  companyName: 'Suryodaya Solar',
  phoneE164: '+919845027746',
  roles: ['sales_executive'],
};
const NOW = Date.UTC(2026, 9, 22, 9, 0, 0);
const words = (message: Parameters<typeof en.t>[0]) =>
  en.t(message, { first: 'Rajesh', inviter: INVITE.inviterName, company: INVITE.companyName });

const opened: readonly InviteLandingEvent[] = [
  { type: 'read-ended', read: { kind: 'pending', invite: INVITE } },
  { type: 'request-ended', outcome: 'sent', now: NOW },
];
const FRAMES = {
  normal: opened,
  filled: [...opened, { type: 'code-typed', code: '482913' }],
  joining: [...opened, { type: 'code-typed', code: '482913' }, { type: 'verify' }],
  joinFailed: [
    ...opened,
    { type: 'code-typed', code: '482913' },
    { type: 'verify' },
    { type: 'join-ended', result: { step: 'join', outcome: 'failed' } },
  ],
  confirming: [...opened, { type: 'decline' }],
  expired: [{ type: 'read-ended', read: { kind: 'expired', invite: INVITE } }],
} satisfies Record<string, readonly InviteLandingEvent[]>;

const control = (root: Locator) => root.getByRole('button', { name: words(INVITE_DECLINE.open) });
const confirm = (page: Page) => page.getByRole('dialog', { name: words(INVITE_DECLINE.title) });

for (const [width, height] of [
  [375, 812],
  [1536, 1000],
] as const) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height } });

    test('the live invite offers the control; m-expired offers none', async ({ mount }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
      await expect(control(root)).toBeEnabled();
      await expectTouchFloor([control(root)]);
      await root.unmount();
      const expired = await mount(<InviteLandingAt reader="en" events={FRAMES.expired} />);
      await expect(control(expired)).toHaveCount(0);
    });

    test('the confirm names both consequences and the way back, and only its two acts close it', async ({
      mount,
      page,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
      await control(root).click();
      const dialog = confirm(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(words(INVITE_DECLINE.line))).toBeVisible();
      await expect(dialog.getByRole('button')).toHaveCount(2);
      await page.keyboard.press('Escape');
      await page.mouse.click(4, 4);
      await expect(dialog).toBeVisible();
      await expect(root.getByTestId('pressed')).toHaveText('decline');
    });

    test('Keep closes it, the code kept, and the focus back on the control', async ({
      mount,
      page,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.filled} />);
      await control(root).click();
      await confirm(page)
        .getByRole('button', { name: words(INVITE_DECLINE.keep) })
        .click();
      await expect(confirm(page)).toHaveCount(0);
      await expect(control(root)).toBeFocused();
      await expect(root.getByText(words(INVITE_LANDING.filled))).toBeVisible();
    });

    test('the countdown ticking under the open confirm leaves the focus on the act it is on', async ({
      mount,
      page,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.confirming} />);
      const keep = confirm(page).getByRole('button', { name: words(INVITE_DECLINE.keep) });
      await keep.focus();
      await root.update(
        <InviteLandingAt
          reader="en"
          events={FRAMES.confirming}
          later={[{ type: 'tick', now: NOW + 1000 }]}
        />,
      );
      await expect(
        root.getByRole('button', { name: en.t(SIGN_IN.resendInLabel, { seconds: 29 }) }),
      ).toBeAttached();
      await expect(keep).toBeFocused();
    });

    test('Decline draws m-declined: the inviter named, the way back, and sign in takes the focus', async ({
      mount,
      page,
    }) => {
      const root = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
      await control(root).click();
      await confirm(page)
        .getByRole('button', { name: words(INVITE_DECLINE.go) })
        .click();
      await expect(confirm(page)).toHaveCount(0);
      await expect(root.getByText(words(INVITE_DECLINE.closed))).toBeVisible();
      await expect(root.getByText(words(INVITE_DECLINE.closedLine))).toBeVisible();
      await expect(root.getByText(words(INVITE_LANDING.otherAccountNote))).toBeVisible();
      const signIn = root.getByRole('button', { name: words(INVITE_LANDING.signIn) });
      await expect(signIn).toBeFocused();
      await expect(root.getByRole('group', { name: words(INVITE_LANDING.codeLabel) })).toHaveCount(
        0,
      );
    });

    test('a decline that did not go through keeps the confirm open with the door’s words, and Decline sends again', async ({
      mount,
      page,
    }) => {
      const root = await mount(
        <InviteLandingAt
          reader="en"
          events={FRAMES.confirming}
          declineAnswers={['unreached', 'declined']}
        />,
      );
      const go = confirm(page).getByRole('button', { name: words(INVITE_DECLINE.go) });
      await go.click();
      const reason = confirm(page).getByText(en.t(SIGN_IN.notReached));
      await expect(reason).toBeVisible();
      const line = confirm(page).getByText(words(INVITE_DECLINE.line));
      // Above the words in the sheet; under them at 1536, where they are the dialog's description.
      if (width === 375) expect(await bottomOf(reason)).toBeLessThan(await topOf(line));
      else expect(await topOf(reason)).toBeGreaterThan(await bottomOf(line));
      await go.click();
      await expect(root.getByText(words(INVITE_DECLINE.closed))).toBeVisible();
    });

    test('the acts stack, Decline on top, each the row’s width and on one line (brief ruling 20)', async ({
      mount,
      page,
    }) => {
      await mount(<InviteLandingAt reader="en" events={FRAMES.confirming} />);
      await expectStackedActs(page);
    });

    test('the control waits while the join is out, and is live again after a failed join', async ({
      mount,
    }) => {
      const joining = await mount(<InviteLandingAt reader="en" events={FRAMES.joining} />);
      await expect(control(joining)).toBeDisabled();
      await joining.unmount();
      const failed = await mount(<InviteLandingAt reader="en" events={FRAMES.joinFailed} />);
      await expect(control(failed)).toBeEnabled();
    });
  });
}

test.describe('the decline at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('m-normal: the control is centred under Join in the acts, `sp-3` apart', async ({
    mount,
    page,
  }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
    const join = root.getByRole('button', { name: words(INVITE_LANDING.join) });
    const joinBox = await join.boundingBox();
    const box = await control(root).boundingBox();
    expect((box?.y ?? 0) - (await bottomOf(join))).toBe(await resolvedLength(page, '--sp-3'));
    const centre = (b: typeof box) => (b?.x ?? 0) + (b?.width ?? 0) / 2;
    expect(Math.abs(centre(box) - centre(joinBox))).toBeLessThanOrEqual(1);
  });

  test('m-decline-confirm is a sheet with its words as the body', async ({ mount, page }) => {
    await mount(<InviteLandingAt reader="en" events={FRAMES.confirming} />);
    const line = confirm(page).getByText(words(INVITE_DECLINE.line));
    const size = await line.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    expect(size).toBe(await resolvedLength(page, '--fs-body-sm'));
    await animationsSettled(page);
    expect(await bottomOf(confirm(page))).toBeLessThanOrEqual(812);
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} the confirm and m-declined fit the width`, async ({ mount, page }) => {
      const root = await mount(<InviteLandingAt reader={reader} events={FRAMES.confirming} />);
      await expectNoSidewaysScroll(page);
      await expectStackedActs(page);
      await page.getByRole('dialog').getByRole('button').last().click();
      await expect(root.getByRole('button')).toHaveCount(1);
      await expectNoSidewaysScroll(page);
    });
  }
});

test.describe('the decline at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('d-normal: the control is the task’s last, after the resend', async ({ mount }) => {
    const root = await mount(<InviteLandingAt reader="en" events={FRAMES.normal} />);
    const resend = root.getByRole('button', { name: en.t(SIGN_IN.resendInLabel, { seconds: 30 }) });
    expect(await topOf(control(root))).toBeGreaterThan(await bottomOf(resend));
  });

  test('d-decline-confirm is a danger dialog with the words as its description, no close and no empty body', async ({
    mount,
    page,
  }) => {
    await mount(<InviteLandingAt reader="en" events={FRAMES.confirming} />);
    const dialog = confirm(page);
    await expect(dialog.locator('.hg-modal-description')).toHaveText(words(INVITE_DECLINE.line));
    await expect(dialog.locator('.hg-modal-body')).toHaveCount(0);
    await expect(dialog.getByRole('button')).toHaveCount(2);
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} the dialog holds its description and m-declined fits`, async ({
      mount,
      page,
    }) => {
      const root = await mount(<InviteLandingAt reader={reader} events={FRAMES.confirming} />);
      await expectStackedActs(page);
      const dialog = page.getByRole('dialog');
      const box = await dialog.boundingBox();
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(1000);
      await expectNoSidewaysScroll(page);
      await dialog.getByRole('button').last().click();
      await expect(root.getByRole('button')).toHaveCount(1);
      await expectNoSidewaysScroll(page);
    });
  }
});

/** The confirm's two acts stacked: the last, Decline, on top; both the row's full width; no label wrapped. */
async function expectStackedActs(page: Page): Promise<void> {
  await animationsSettled(page);
  const [keep, go] = await page.getByRole('dialog').getByRole('button').all();
  if (keep === undefined || go === undefined) throw new Error('the confirm draws two acts');
  const keepBox = await keep.boundingBox();
  const goBox = await go.boundingBox();
  expect(await bottomOf(go)).toBeLessThanOrEqual(keepBox?.y ?? 0);
  expect(goBox?.width).toBe(keepBox?.width);
  expect(goBox?.x).toBe(keepBox?.x);
  for (const act of [keep, go]) {
    const lines = await act.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const rows = [...range.getClientRects()].filter((rect) => rect.width > 0);
      return new Set(rows.map((rect) => Math.round(rect.top))).size;
    });
    expect(lines).toBe(1);
  }
}

async function topOf(locator: Locator): Promise<number> {
  return (await locator.boundingBox())?.y ?? 0;
}
