import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_PROFILE_STANDING_WORD,
  COMPANY_SIGNUP,
  createTranslator,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import {
  bottomOf,
  expectNoSidewaysScroll,
  expectNothingClipped,
  expectSharedEdge,
} from '../support/layout';
import { resolvedColour, resolvedLength } from '../support/token';
import { MIN_TOUCH_TARGET } from '../support/touch-target';
import { CompanyProfileAsHeld } from './CompanyProfile.story';

/**
 * The company profile at the board's phone width (`SCR-M01-05`): five flat parts with where each
 * stands beside its title, one part open, and one act that is live with nothing filled in. The
 * tax and what-you-sell parts have their own specs; the 1536 arrangement is a later part's.
 */
const en = await createTranslator('en');

const HEIGHT = 812;
test.use({ viewport: { width: 375, height: HEIGHT } });

/** The board's column at 375: the frame less the screen's padding on both sides. */
const COLUMN = 335;
/** A flat section's shut header, and a field's box (`SCR-M01-05`, record list 5, N2). */
const HEADER = 56;
const FIELD = 54;
const ACT = 48;

const TITLE = {
  identity: en.t(COMPANY_PROFILE_PART_TITLE.identity),
  address: en.t(COMPANY_PROFILE_PART_TITLE.address),
  tax: en.t(COMPANY_PROFILE_PART_TITLE.tax),
  bank: en.t(COMPANY_PROFILE_PART_TITLE.bank),
  declarations: en.t(COMPANY_PROFILE_PART_TITLE.declarations),
};
const PUNE_ONLY = en.t(COMPANY_PROFILE_STANDING_WORD.city_only, { city: 'Pune' });
const NAME_ONLY = en.t(COMPANY_PROFILE_STANDING_WORD.name_only);
const NOT_ADDED = en.t(COMPANY_PROFILE_STANDING_WORD.not_added);
const ADDED = en.t(COMPANY_PROFILE_STANDING_WORD.added);
const ANSWERED = en.t(COMPANY_PROFILE_STANDING_WORD.answered);
const NOT_DECLARED = en.t(COMPANY_PROFILE_STANDING_WORD.not_declared);
const SAVE = en.t(COMPANY_PROFILE.saveSpoken);
const FROM_SIGNUP = en.t(COMPANY_PROFILE.fromSignup);

const header = (profile: Locator, title: string) =>
  profile.locator('.hg-accordion-toggle').filter({ hasText: title });

test('a new company meets five flat parts, the first open on its name, and a live act with no line', async ({
  mount,
  page,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" />);
  await expect(profile.locator('.hg-door-wordmark')).toBeVisible();
  await expect(profile.getByRole('heading', { level: 1 })).toHaveText(en.t(COMPANY_PROFILE.title));
  await expect(profile.getByText(en.t(COMPANY_PROFILE.lede))).toBeVisible();

  const headers = profile.locator('.hg-accordion-toggle');
  await expect(headers).toHaveCount(5);
  for (const [index, title] of Object.values(TITLE).entries()) {
    await expect(headers.nth(index)).toContainText(title);
    const box = await headers.nth(index).boundingBox();
    expect(box?.width).toBe(COLUMN);
    expect(box?.height).toBeGreaterThanOrEqual(HEADER);
  }

  await expect(header(profile, TITLE.identity)).toHaveAttribute('aria-expanded', 'true');
  await expect(header(profile, TITLE.identity)).not.toContainText(NAME_ONLY);
  await expect(header(profile, TITLE.address)).toContainText(PUNE_ONLY);
  await expect(header(profile, TITLE.tax)).toContainText(NOT_ADDED);
  await expect(header(profile, TITLE.bank)).toContainText(NOT_ADDED);
  await expect(header(profile, TITLE.declarations)).toContainText(ANSWERED);

  const dots = profile.locator('.hg-accordion-standing-dot');
  await expect(dots).toHaveCount(4);
  const success = await resolvedColour(page, '--success');
  await expect(header(profile, TITLE.declarations).locator('.hg-accordion-standing-dot')).toHaveCSS(
    'background-color',
    success,
  );
  const addressDot = header(profile, TITLE.address).locator('.hg-accordion-standing-dot');
  await expect(addressDot).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--mark-subtle'),
  );
  const dotSize = await resolvedLength(page, '--sp-2');
  expect(await addressDot.boundingBox()).toMatchObject({ width: dotSize, height: dotSize });

  const name = profile.getByRole('textbox', { name: en.t(COMPANY_SIGNUP.companyName) });
  await expect(name).toHaveValue('Suryodaya Solar Solutions Pvt Ltd');
  const line = profile.getByText(FROM_SIGNUP);
  await expect(line).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
  const field = profile.locator('.hg-input');
  await expect(field).toHaveCount(1);
  expect(((await line.boundingBox())?.y ?? 0) - (await bottomOf(field))).toBe(
    await resolvedLength(page, '--sp-2'),
  );

  const act = profile.getByRole('button', { name: SAVE });
  await expect(act).toBeEnabled();
  await expect(act).toHaveText(en.t(COMPANY_PROFILE.save));
  expect(await act.boundingBox()).toMatchObject({ width: COLUMN, height: ACT });
  expect(await bottomOf(act)).toBeLessThanOrEqual(HEIGHT);
  await expect(profile.getByText(en.t(COMPANY_PROFILE.reseedScope))).toHaveCount(0);
  await act.click();
  await expect(profile.getByTestId('pressed')).toHaveText('save');
  await expectNoSidewaysScroll(page);
});

test('one part is open at a time: an open part shows no standing, and pressing it again shuts it', async ({
  mount,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" />);
  await header(profile, TITLE.address).click();
  await expect(profile.getByTestId('open')).toHaveText('address');
  await expect(header(profile, TITLE.address)).toHaveAttribute('aria-expanded', 'true');
  await expect(header(profile, TITLE.address)).not.toContainText(PUNE_ONLY);
  await expect(header(profile, TITLE.address).locator('.hg-accordion-standing-dot')).toHaveCount(0);
  await expect(header(profile, TITLE.identity)).toHaveAttribute('aria-expanded', 'false');
  await expect(header(profile, TITLE.identity)).toContainText(NAME_ONLY);

  await header(profile, TITLE.address).click();
  await expect(profile.getByTestId('open')).toHaveText('');
  await expect(header(profile, TITLE.address)).toContainText(PUNE_ONLY);
});

test('a part that owes something opens itself, keeps its word while open, and lets every other part open', async ({
  mount,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" undeclared open={null} />);
  const owed = header(profile, TITLE.declarations);
  await expect(profile.getByTestId('open')).toHaveText('declarations');
  await expect(owed).toHaveAttribute('aria-expanded', 'true');
  await expect(owed).toHaveAttribute('aria-invalid', 'true');
  await expect(owed).toContainText(NOT_DECLARED);

  await header(profile, TITLE.address).click();
  await expect(profile.getByTestId('open')).toHaveText('address');
  await expect(header(profile, TITLE.address)).toHaveAttribute('aria-expanded', 'true');
  await expect(owed).toHaveAttribute('aria-expanded', 'false');
  await expect(owed).toContainText(NOT_DECLARED);
});

test('the address part asks the street, reads back the city and asks the PIN code, each reporting its own field', async ({
  mount,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" open="address" />);
  const street = profile.getByRole('textbox', { name: en.t(COMPANY_PROFILE.street) });
  const city = profile.getByRole('textbox', { name: en.t(COMPANY_SIGNUP.city) });
  const pin = profile.getByRole('textbox', { name: en.t(COMPANY_PROFILE.postalCode) });
  await expectSharedEdge([street, city, pin], 'left');
  expect(await bottomOf(street)).toBeLessThan((await city.boundingBox())?.y ?? 0);
  expect(await bottomOf(city)).toBeLessThan((await pin.boundingBox())?.y ?? 0);

  await expect(street).toHaveAttribute('placeholder', en.t(COMPANY_PROFILE.streetExample));
  await expect(pin).toHaveAttribute('placeholder', en.t(COMPANY_PROFILE.postalCodeExample));
  await expect(city).toHaveValue('Pune');
  await expect(profile.getByText(FROM_SIGNUP)).toBeVisible();
  await expect(pin).toHaveCSS('font-family', /Mono/);
  await expect(street).not.toHaveCSS('font-family', /Mono/);
  const boxes = profile.locator('.hg-input-shell');
  await expect(boxes).toHaveCount(3);
  for (const index of [0, 1, 2]) {
    expect(await boxes.nth(index).boundingBox()).toMatchObject({ width: COLUMN, height: FIELD });
  }
  const purpose = profile.getByText(en.t(COMPANY_PROFILE.addressPurpose));
  expect((await purpose.boundingBox())?.y).toBeGreaterThan(await bottomOf(pin));

  await street.fill('Plot 14, Baner Road');
  await pin.fill('411045');
  await expect(profile.getByTestId('edits')).toHaveText(
    /address=Plot 14, Baner Road\|.*postalCode=411045$/,
  );
  await street.fill('');
  await expect(profile.getByTestId('edits')).toHaveText(/address=$/);
  await header(profile, TITLE.address).click();
  await expect(header(profile, TITLE.address)).toContainText(PUNE_ONLY);
});

test('a typed street makes the shut address read Added, with the success dot', async ({
  mount,
  page,
}) => {
  const profile = await mount(
    <CompanyProfileAsHeld reader="en" typed={{ address: 'Plot 14, Baner Road' }} />,
  );
  await expect(header(profile, TITLE.address)).toContainText(ADDED);
  await expect(header(profile, TITLE.address).locator('.hg-accordion-standing-dot')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--success'),
  );
});

test('the bank part holds four facts in order, the holder already the company, and says what was checked', async ({
  mount,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" open="bank" />);
  const names = [
    en.t(COMPANY_PROFILE.bankName),
    en.t(COMPANY_PROFILE.accountHolder),
    en.t(COMPANY_PROFILE.accountNumber),
    'IFSC',
  ];
  const fields = names.map((name) => profile.getByRole('textbox', { name }));
  for (const [index, field] of fields.entries()) {
    await expect(field).toBeVisible();
    const next = fields[index + 1];
    if (next !== undefined) {
      expect(await bottomOf(field)).toBeLessThan((await next.boundingBox())?.y ?? 0);
    }
  }
  const [bank, holder, number, routing] = fields as [Locator, Locator, Locator, Locator];
  await expect(bank).toHaveAttribute('placeholder', en.t(COMPANY_PROFILE.bankNameExample));
  await expect(holder).toHaveValue('Suryodaya Solar Solutions Pvt Ltd');
  await expect(bank).not.toHaveCSS('font-family', /Mono/);
  await expect(number).toHaveCSS('font-family', /Mono/);
  await expect(routing).toHaveCSS('font-family', /Mono/);
  await expect(number).toHaveAttribute('placeholder', en.t(COMPANY_PROFILE.accountNumberExample));
  await expect(routing).toHaveAttribute('placeholder', en.t(COMPANY_PROFILE.routingExample));

  const checked = profile.getByText(en.t(COMPANY_PROFILE.formatChecked));
  const purpose = profile.getByText(en.t(COMPANY_PROFILE.bankPurpose));
  expect((await checked.boundingBox())?.y).toBeGreaterThan(await bottomOf(routing));
  expect((await purpose.boundingBox())?.y).toBeGreaterThan(await bottomOf(checked));

  await bank.fill('HDFC Bank');
  await holder.fill('Suryodaya Solar');
  await number.fill('50200012344821');
  await routing.fill('HDFC0001234');
  await expect(profile.getByTestId('edits')).toHaveText(
    /bankName=HDFC Bank\|.*accountName=Suryodaya Solar\|.*accountNumber=50200012344821\|.*bankRoutingIdentifier=HDFC0001234$/,
  );
  await header(profile, TITLE.bank).click();
  await expect(header(profile, TITLE.bank)).toContainText(ADDED);
});

for (const reader of ['hi', 'mr'] as const) {
  test(`in ${reader} every standing stays inside its header, nothing is clipped and nothing scrolls sideways`, async ({
    mount,
    page,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader={reader} open="address" />);
    const headers = profile.locator('.hg-accordion-toggle');
    await expect(headers).toHaveCount(5);
    for (const index of [0, 1, 2, 3, 4]) {
      const box = await headers.nth(index).boundingBox();
      expect(box?.width).toBe(COLUMN);
      const standing = headers.nth(index).locator('.hg-accordion-standing');
      if ((await standing.count()) > 0) {
        expect(await bottomOf(standing)).toBeLessThanOrEqual(await bottomOf(headers.nth(index)));
      }
    }
    await expectNothingClipped(page, '.hg-text, .hg-accordion-toggle, .hg-input-label');
    const act = profile.locator('.hg-door-footer').getByRole('button');
    await expect(act).toHaveCount(1);
    await expect(act).toBeInViewport();
    await expectNoSidewaysScroll(page);
  });
}

for (const state of [
  { name: 'at rest', props: { open: 'bank' } },
  { name: 'after a failed read', props: { status: 'unread' } },
  { name: 'after a failed save', props: { status: 'save-failed' } },
] as const) {
  test(`${state.name}, every header, field and act meets the touch floor`, async ({ mount }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" {...state.props} />);
    const targets = [
      ...(await profile.locator('.hg-accordion-toggle').all()),
      ...(await profile.locator('.hg-input-shell').all()),
      ...(await profile.locator('.hg-button').all()),
    ];
    expect(targets.length).toBeGreaterThan(1);
    for (const target of targets) {
      const box = await target.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    }
  });
}
