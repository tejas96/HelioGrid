import { createTranslator, presetName, SIGN_IN, TEAM, teamStatusWord } from '@heliogrid/i18n';
import { Avatar, Badge, Button, ProgressBar, RecordCard, TileAction } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { settledBox } from '../support/layout';
import { resolvedColour, resolvedLength } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

/** A person's name is data, not a word: it reads the same in every language. */
const PERSON = 'Anjali Kulkarni';

/** Three roles, one of each kind, in their kind's iris tone — the longest presets wrap first. */
const ROLES = [
  ['sales_manager', 'violet'],
  ['survey_engineer', 'blue'],
  ['installation_team_member', 'magenta'],
] as const;

async function box(locator: Locator) {
  const drawn = await settledBox(locator);
  if (drawn === null) throw new Error('the part is drawn');
  return drawn;
}

test('a record card is a tile and its controls are white', async ({ mount, page }) => {
  const card = await mount(
    <RecordCard
      name={tryAgain}
      action={
        <Button variant="secondary" size="sm">
          {tryAgain}
        </Button>
      }
    />,
  );

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(card).toHaveCSS('box-shadow', 'none');
  await expect(card.getByRole('button', { name: tryAgain })).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
});

test('a tappable record card is ringed under the pointer, never lifted', async ({
  mount,
  page,
}) => {
  const card = await mount(<RecordCard name={tryAgain} onClick={() => undefined} />);

  await card.hover();
  await expect(card).toHaveCSS(
    'box-shadow',
    `${await resolvedColour(page, '--mark-subtle')} 0px 0px 0px 2px`,
  );
  await expect(card).toHaveCSS('transform', 'none');
});

test('an inline card with none of the new parts draws its name as it always did', async ({
  mount,
}) => {
  const card = await mount(<RecordCard name={tryAgain} />);

  await expect(card).toHaveAttribute('data-layout', 'inline');
  await expect(card.locator('.hg-record-card-head > .hg-record-card-name')).toHaveCount(1);
  await expect(card.locator('.hg-record-card-avatar')).toHaveCount(1);
  await expect(
    card.locator(
      '.hg-record-card-who, .hg-record-card-title, .hg-record-card-line, .hg-record-card-face, ' +
        '.hg-record-card-detail, .hg-record-card-actions, .hg-tile-actions',
    ),
  ).toHaveCount(0);
});

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 900 } });

  for (const reader of ['en', 'hi', 'mr'] as const) {
    test(`a stacked person card holds its face, name, roles, invite and act in ${reader}`, async ({
      mount,
      page,
    }) => {
      const { t } = await createTranslator(reader);
      const you = t(TEAM.you);
      const invited = teamStatusWord(t, 'invited');
      const act = t(SIGN_IN.tryAgain);
      let opened = 0;
      let acted = 0;
      const card = await mount(
        <RecordCard
          layout="stacked"
          name={PERSON}
          onClick={() => {
            opened += 1;
          }}
          avatar={<Avatar name={PERSON} size={48} mark="info" />}
          badge={
            <Badge tone="accent" density="functional">
              {you}
            </Badge>
          }
          line={invited}
          marks={ROLES.map(([preset, tone]) => (
            <Badge key={preset} tone={tone} density="functional">
              {presetName(t, preset)}
            </Badge>
          ))}
          detail={<ProgressBar value={(3 / 7) * 100} />}
          action={
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => {
                acted += 1;
              }}
            >
              {act}
            </Button>
          }
        />,
      );
      const gap = await resolvedLength(page, '--sp-3');
      const hair = await resolvedLength(page, '--sp-0-5');

      /* The head: the face and the name block on one row, centred, 12 apart. */
      const lead = await box(card.locator('.hg-record-card-lead'));
      const face = await box(card.locator('.hg-record-card-face'));
      const who = await box(card.locator('.hg-record-card-who'));
      expect(Math.abs(face.y + face.height / 2 - (who.y + who.height / 2))).toBeLessThanOrEqual(1);
      expect(Math.round(who.x - (face.x + face.width))).toBe(gap);

      /* The face takes an iris hue from the name, and its standing mark sits 2 out at its foot. */
      const disc = card.locator('.hg-avatar');
      await expect(disc).toHaveAttribute('data-iris', /^(violet|blue|magenta)$/);
      const ring = card.locator('.hg-avatar-mark');
      await expect(ring).toHaveAttribute('aria-hidden', 'true');
      await expect(ring).toHaveCSS('background-color', await resolvedColour(page, '--canvas'));
      await expect(card.locator('.hg-avatar-mark-dot')).toHaveCSS(
        'background-color',
        await resolvedColour(page, '--info'),
      );
      const discBox = await box(disc);
      const ringBox = await box(ring);
      expect(ringBox.width).toBe(18);
      expect(Math.round(ringBox.x + ringBox.width - (discBox.x + discBox.width))).toBe(hair);
      expect(Math.round(ringBox.y + ringBox.height - (discBox.y + discBox.height))).toBe(hair);

      /* You beside the name; the line 2 under them, in the secondary words. */
      const title = card.locator('.hg-record-card-title');
      await expect(title.getByText(you)).toBeVisible();
      const line = card.locator('.hg-record-card-line');
      await expect(line).toHaveText(invited);
      await expect(line).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
      const titleBox = await box(title);
      expect(Math.round((await box(line)).y - (titleBox.y + titleBox.height))).toBe(hair);

      /* Three role badges, each whole inside the card, in three different iris washes. */
      const roles = card.locator('.hg-record-card-marks .hg-badge');
      await expect(roles).toHaveCount(ROLES.length);
      const washes = new Set<string>();
      for (let i = 0; i < ROLES.length; i += 1) {
        const role = roles.nth(i);
        const roleBox = await box(role);
        expect(roleBox.x).toBeGreaterThanOrEqual(lead.x - 0.5);
        expect(roleBox.x + roleBox.width).toBeLessThanOrEqual(lead.x + lead.width + 0.5);
        expect(await role.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
        await expect(role).toHaveCSS('font-weight', '600');
        washes.add(await role.evaluate((el) => getComputedStyle(el).backgroundColor));
      }
      expect(washes.size).toBe(ROLES.length);

      /* The roles, the invite bar and the act take the full width, 12 apart. */
      const marks = await box(card.locator('.hg-record-card-marks'));
      const detail = await box(card.locator('.hg-record-card-detail'));
      const action = await box(card.locator('.hg-record-card-action'));
      for (const slot of [marks, detail, action]) {
        expect(Math.round(slot.x)).toBe(Math.round(lead.x));
        expect(Math.round(slot.width)).toBe(Math.round(lead.width));
      }
      expect(Math.round(marks.y - (lead.y + lead.height))).toBe(gap);
      expect(Math.round(detail.y - (marks.y + marks.height))).toBe(gap);
      expect(Math.round(action.y - (detail.y + detail.height))).toBe(gap);

      /* The invite bar is not a control: a tap on it opens the row. The act fires only itself. */
      await page.mouse.click(detail.x + detail.width / 2, detail.y + detail.height / 2);
      await expect.poll(() => opened).toBe(1);
      await card.getByRole('button', { name: act }).click();
      await expect.poll(() => acted).toBe(1);
      expect(opened).toBe(1);
    });
  }
});

test('the foot draws labelled pills below a thin rule, each in a 44px target', async ({
  mount,
  page,
}) => {
  const you = en.t(TEAM.you);
  const all = en.t(TEAM.all);
  let pressed = 0;
  const card = await mount(
    <RecordCard
      name={PERSON}
      actions={
        <>
          <TileAction
            label={tryAgain}
            on={false}
            onClick={() => {
              pressed += 1;
            }}
          />
          <TileAction label={you} onLabel={all} on />
        </>
      }
    />,
  );

  const foot = card.locator('.hg-tile-actions');
  await expect(foot).toHaveCSS('border-top-width', '1px');
  await expect(foot).toHaveCSS('border-top-color', await resolvedColour(page, '--line-tile'));
  const cardBox = await box(card);
  const pad = await resolvedLength(page, '--sp-4');
  expect(Math.round((await box(foot)).width)).toBe(Math.round(cardBox.width - 2 * pad));

  const off = foot.getByRole('button', { name: tryAgain });
  const on = foot.getByRole('button', { name: all });
  await expect(off).toHaveAttribute('aria-pressed', 'false');
  await expect(on).toHaveAttribute('aria-pressed', 'true');
  await expectTouchFloor([off, on]);

  const offPill = off.locator('.hg-tile-action-pill');
  expect((await box(offPill)).height).toBe(36);
  await expect(offPill).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(offPill).toHaveCSS('font-size', `${await resolvedLength(page, '--fs-body-sm')}px`);
  const onPill = on.locator('.hg-tile-action-pill');
  await expect(onPill).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--action-primary'),
  );
  await expect(onPill).toHaveCSS('color', await resolvedColour(page, '--text-inverse'));

  await off.click();
  await expect.poll(() => pressed).toBe(1);
});
