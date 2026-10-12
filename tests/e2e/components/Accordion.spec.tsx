import { COMPANY_SIGNUP, companyFieldRefusal, createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Accordion } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { bottomOf, expectNoSidewaysScroll, rightOf } from '../support/layout';
import { resolvedColour, resolvedLength } from '../support/token';

/**
 * The open page's section list (the design system's `Accordion`; `SCR-M01-05`'s five parts): flat
 * sections with a thin line between them, where a section stands read beside its title as a word
 * and a dot, and the chevron last. The words are borrowed: the list has none of its own.
 */
const en = await createTranslator('en');
const hi = await createTranslator('hi');
const title = en.t(COMPANY_SIGNUP.yourCompany);
const second = en.t(COMPANY_SIGNUP.companyName);
const third = en.t(COMPANY_SIGNUP.city);
const standing = en.t(SIGN_IN.tryAgain);
const toFix = en.t(SIGN_IN.wrongTitle);
const body = en.t(COMPANY_SIGNUP.companyNameExample);
const act = en.t(SIGN_IN.tryAgain);

/** A closed header's height: the board's 56, and 57 under a section's line. */
const HEADER = 56;
const LINE = 1;
/** The open panel's bottom padding in the settings density: the header's 14 and 6. */
const FUNCTIONAL_PANEL_FOOT = 20;

test('an accordion item is a heading on the page — no fill, no shadow', async ({ mount }) => {
  const accordion = await mount(
    <Accordion items={[{ key: 'company', title, content: body }]} defaultOpen={['company']} />,
  );
  const item = accordion.locator('.hg-accordion-item');

  await expect(item).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(item).toHaveCSS('box-shadow', 'none');
  await expect(item).toHaveCSS('border-radius', '0px');
});

test('the sections are flat: a thin line above every section after the first, no gap, no side padding', async ({
  mount,
  page,
}) => {
  const accordion = await mount(
    <Accordion
      items={[
        { key: 'company', title, content: body },
        { key: 'name', title: second, content: body },
        { key: 'city', title: third, content: body },
      ]}
    />,
  );
  const items = accordion.locator('.hg-accordion-item');
  const line = await resolvedColour(page, '--line-soft');

  await expect(items.nth(0)).toHaveCSS('border-top-width', '0px');
  for (const later of [items.nth(1), items.nth(2)]) {
    await expect(later).toHaveCSS('border-top-width', `${LINE}px`);
    await expect(later).toHaveCSS('border-top-color', line);
  }
  expect((await items.nth(0).boundingBox())?.height).toBe(HEADER);
  expect((await items.nth(1).boundingBox())?.height).toBe(HEADER + LINE);
  expect((await items.nth(1).boundingBox())?.y).toBe(await bottomOf(items.nth(0)));

  const list = await accordion.boundingBox();
  const header = await accordion.getByRole('button', { name: title }).boundingBox();
  expect(header?.x).toBe(list?.x);
  expect(header?.width).toBe(list?.width);
});

test('where a section stands reads beside its title: the word secondary, an 8px dot before it', async ({
  mount,
  page,
}) => {
  const accordion = await mount(
    <Accordion
      items={[
        { key: 'company', title, state: 'done', stateLabel: standing, content: body },
        { key: 'name', title: second, state: 'empty', stateLabel: standing, content: body },
      ]}
    />,
  );
  const dotSize = await resolvedLength(page, '--sp-2');

  for (const [index, heading, mark] of [
    [0, title, '--success'],
    [1, second, '--mark-subtle'],
  ] as const) {
    const item = accordion.locator('.hg-accordion-item').nth(index);
    const word = item.getByText(standing);
    const dot = item.locator('.hg-accordion-standing-dot');

    await expect(word).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
    await expect(dot).toHaveCSS('background-color', await resolvedColour(page, mark));
    expect(await dot.boundingBox()).toMatchObject({ width: dotSize, height: dotSize });

    const wordBox = await word.boundingBox();
    expect(wordBox?.x).toBeGreaterThan(await rightOf(item.getByText(heading, { exact: true })));
    expect(await rightOf(word)).toBeLessThan(
      (await item.locator('.hg-accordion-chevron').boundingBox())?.x ?? 0,
    );
    /* Beside the title, not pushed to the row's end: the title row holds it. */
    await expect(item.locator('.hg-accordion-title-wrap').getByText(standing)).toBeVisible();
  }
});

test('an item in errors has no tint and its head says so', async ({ mount, page }) => {
  const accordion = await mount(
    <Accordion
      items={[{ key: 'company', title, state: 'errors', stateLabel: toFix, content: body }]}
    />,
  );
  const item = accordion.locator('.hg-accordion-item');

  await expect(item).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(item.getByRole('button', { name: title })).toHaveAttribute('aria-invalid', 'true');
  await expect(item.getByText(toFix)).toHaveCSS(
    'color',
    await resolvedColour(page, '--danger-text'),
  );
  await expect(item.locator('.hg-accordion-dot')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--danger'),
  );
  /* Outside the title row: the errored word closes the header, before the chevron. */
  await expect(item.locator('.hg-accordion-title-wrap').getByText(toFix)).toHaveCount(0);
  expect((await item.getByText(toFix).boundingBox())?.x).toBeGreaterThan(
    await rightOf(item.locator('.hg-accordion-title-wrap')),
  );
});

test('the chevron closes the header in the primary ink and turns when the section opens', async ({
  mount,
  page,
}) => {
  const accordion = await mount(
    <Accordion
      items={[{ key: 'company', title, state: 'done', stateLabel: standing, content: body }]}
    />,
  );
  const header = accordion.getByRole('button', { name: title });
  const chevron = accordion.locator('.hg-accordion-chevron');

  await expect(chevron).toHaveCSS('color', await resolvedColour(page, '--text-primary'));
  expect(await rightOf(chevron)).toBe(await rightOf(header));
  await expect(chevron).not.toHaveAttribute('data-open', 'true');
  await expect(chevron).toHaveCSS('transform', 'none');
  await header.click();
  await expect(chevron).toHaveAttribute('data-open', 'true');
  await expect(chevron).not.toHaveCSS('transform', 'none');
});

test('the settings density keeps the 56 header and tightens the open panel', async ({ mount }) => {
  const accordion = await mount(
    <Accordion
      density="functional"
      defaultOpen={['company']}
      items={[{ key: 'company', title, content: body }]}
    />,
  );

  expect((await accordion.getByRole('button', { name: title }).boundingBox())?.height).toBe(HEADER);
  await expect(accordion.locator('.hg-accordion-panel')).toHaveCSS(
    'padding-bottom',
    `${FUNCTIONAL_PANEL_FOOT}px`,
  );
});

test('in the settings density a header with an act keeps the gap before it', async ({
  mount,
  page,
}) => {
  const accordion = await mount(
    <Accordion
      density="functional"
      items={[{ key: 'company', title, action: <span>{act}</span>, content: body }]}
    />,
  );

  await expect(accordion.getByRole('button', { name: title })).toHaveCSS(
    'padding-right',
    `${await resolvedLength(page, '--sp-2')}px`,
  );
});

test.describe('at 375, in Hindi', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('a title too long for one line wraps and the header grows: nothing clipped, no sideways scroll', async ({
    mount,
    page,
  }) => {
    const longTitle = companyFieldRefusal(hi.t, 'ownerName', { type: 'too_small' }) ?? '';
    const longStanding = hi.t(SIGN_IN.wrongTitle);
    const accordion = await mount(
      <Accordion
        items={[
          {
            key: 'company',
            title: longTitle,
            state: 'empty',
            stateLabel: longStanding,
            content: body,
          },
        ]}
      />,
    );
    const header = accordion.getByRole('button', { name: longTitle });

    await expectNoSidewaysScroll(page);
    expect((await header.boundingBox())?.height).toBeGreaterThan(HEADER);
    for (const words of [longTitle, longStanding]) {
      const text = accordion.getByText(words, { exact: true });
      expect(await rightOf(text)).toBeLessThanOrEqual(await rightOf(header));
      expect(await text.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    }
  });
});
