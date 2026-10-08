import { createTranslator, SHELL } from '@heliogrid/i18n';
import type { BannerForm } from '@heliogrid/ui';
import { Banner, BannerAction } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { MIN_TOUCH_TARGET } from '../support/touch-target';

/**
 * Where a banner puts its action is decided by the banner's OWN width, never the viewport (the
 * design system's `actionBelow`, default 400): below it the action takes its own line under the
 * body, its 44px target kept, so the copy keeps the whole width.
 */
const en = await createTranslator('en');
const title = en.t(SHELL.nothingAssigned);
const body = en.t(SHELL.grievanceNotPublished);
const actionWords = en.t(SHELL.signOut);

/** True when the action sits beside the copy: its left edge is past the copy's right edge. */
async function actionBesideCopy(screen: Locator): Promise<boolean> {
  const copy = await screen.getByText(body).boundingBox();
  const action = await screen.getByRole('button', { name: actionWords }).boundingBox();
  return (action?.x ?? 0) > (copy?.x ?? 0) + (copy?.width ?? 0);
}

/** Resizes the wrapper and waits two frames, so the banner's observer has measured the new width. */
async function widen(screen: Locator, width: number): Promise<void> {
  await screen.evaluate(
    (wrapper, next) =>
      new Promise<void>((settled) => {
        wrapper.style.width = `${next}px`;
        requestAnimationFrame(() => requestAnimationFrame(() => settled()));
      }),
    width,
  );
}

function banner(props: { actionBelow?: number; onFormChange?: (form: BannerForm) => void }) {
  return (
    <Banner
      kind="review-needed"
      title={title}
      action={<BannerAction>{actionWords}</BannerAction>}
      {...props}
    >
      {body}
    </Banner>
  );
}

test('at 600 the action sits beside the copy', async ({ mount }) => {
  const screen = await mount(<div style={{ width: 600 }}>{banner({})}</div>);

  expect(await actionBesideCopy(screen)).toBe(true);
});

test('at 343 the action drops under the body and keeps its 44px target', async ({ mount }) => {
  const screen = await mount(<div style={{ width: 343 }}>{banner({})}</div>);
  const copy = (await screen.getByText(body).boundingBox()) ?? undefined;
  const action =
    (await screen.getByRole('button', { name: actionWords }).boundingBox()) ?? undefined;

  expect(action?.y).toBeGreaterThanOrEqual((copy?.y ?? 0) + (copy?.height ?? 0));
  expect(action?.x).toBeLessThan((copy?.x ?? 0) + 4);
  expect(action?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
});

test('a lower actionBelow keeps the action beside the copy at 343', async ({ mount }) => {
  const screen = await mount(<div style={{ width: 343 }}>{banner({ actionBelow: 300 })}</div>);

  expect(await actionBesideCopy(screen)).toBe(true);
});

test('onFormChange reports each change of place once, with the own width', async ({ mount }) => {
  const forms: BannerForm[] = [];
  const screen = await mount(
    <div style={{ width: 600 }}>{banner({ onFormChange: (form) => forms.push(form) })}</div>,
  );
  await expect.poll(() => forms.length).toBe(1);

  await widen(screen, 343);
  await expect.poll(() => forms.length).toBe(2);
  /* Still under 400: the action stays under the body, so nothing is reported. */
  await widen(screen, 360);
  expect(forms.length).toBe(2);
  await widen(screen, 600);
  await expect.poll(() => forms.length).toBe(3);

  expect(forms).toEqual([
    { actionStacked: false, width: 600 },
    { actionStacked: true, width: 343 },
    { actionStacked: false, width: 600 },
  ]);
});

test('a pill has no action row and reports no form', async ({ mount }) => {
  const forms: BannerForm[] = [];
  const screen = await mount(
    <div style={{ width: 343 }}>
      <Banner
        kind="review-needed"
        variant="pill"
        title={title}
        action={<BannerAction>{actionWords}</BannerAction>}
        onFormChange={(form) => forms.push(form)}
      />
    </div>,
  );

  await screen.getByRole('button', { name: actionWords }).waitFor();
  await widen(screen, 343);
  expect(forms).toEqual([]);
});
