import { createTranslator, NOTIFICATION_CENTRE, notificationCardName } from '@heliogrid/i18n';
import { NotificationAnnouncement, NotificationCard, NotificationLanding } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

/** The centre's parts (`SCR-SHELL-03`), at the phone's 335 and the web panel's 456. */
const en = await createTranslator('en');
const unread = en.t(NOTIFICATION_CENTRE.unread);
const item = {
  type: 'design_returned',
  title: 'Design v2 for Yeola Sugar Mills is ready',
  body: 'Rooftop design · Yeola, Nashik',
  time: '14:02',
};
const name = notificationCardName(en.t, { ...item, unread: true });
/* Any translated verb stands in for the act its subject's module will supply. */
const actWord = en.t(NOTIFICATION_CENTRE.goToLeads);

for (const width of [335, 456]) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('a card opens once from its face, and its act is a control of its own', async ({
      mount,
    }) => {
      let opened = 0;
      let acted = 0;
      const card = await mount(
        <NotificationCard
          {...item}
          unreadLabel={unread}
          name={name}
          onOpen={() => {
            opened += 1;
          }}
          act={
            <button type="button" onClick={() => (acted += 1)}>
              {actWord}
            </button>
          }
        />,
      );

      await expect(card.getByText(item.title)).toBeVisible();
      await expect(card.getByText(item.body)).toBeVisible();
      await expect(card.getByText(unread)).toBeVisible();
      await card.getByRole('button', { name: actWord }).click();
      await expect.poll(() => acted).toBe(1);
      expect(opened).toBe(0);
      await card.getByRole('button', { name }).click();
      await expect.poll(() => opened).toBe(1);
    });

    test('a card holds the board: a 40 glyph circle, the body 2 under the title', async ({
      mount,
    }) => {
      const card = await mount(<NotificationCard {...item} name={name} />);
      const glyph = await card.locator('.hg-notification-glyph').boundingBox();
      expect(glyph?.width).toBe(40);
      expect(glyph?.height).toBe(40);
      const title = await card.getByText(item.title).boundingBox();
      const body = await card.getByText(item.body).boundingBox();
      if (title === null || body === null) throw new Error('the title and the body both render');
      expect(Math.round(body.y - (title.y + title.height))).toBe(2);
    });

    test('a read card shows no Unread and is not a control without onOpen', async ({ mount }) => {
      const card = await mount(<NotificationCard {...item} name={name} />);
      await expect(card.getByText(unread)).toHaveCount(0);
      await expect(card.getByRole('button')).toHaveCount(0);
    });

    test('a long title, emoji and Devanagari wrap and stay whole', async ({ mount }) => {
      const long = `${'प्रस्ताव खोला गया — '.repeat(8)}☀️`;
      const card = await mount(<NotificationCard {...item} title={long} name={name} />);
      const box = await card.boundingBox();
      const text = await card.getByText(long).boundingBox();
      if (box === null || text === null) throw new Error('the card renders');
      expect(text.x + text.width).toBeLessThanOrEqual(box.x + box.width);
    });

    test('the card is a tile: its fill, padding 16, radius 24, a 10 dot, the foot past the glyph', async ({
      mount,
      page,
    }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      const card = await mount(
        <NotificationCard
          {...item}
          unreadLabel={unread}
          name={name}
          onOpen={() => undefined}
          act={<button type="button">{actWord}</button>}
        />,
      );
      const tile = card;
      const look = await tile.evaluate((node) => {
        const style = getComputedStyle(node);
        return { fill: style.backgroundColor, padding: style.padding, radius: style.borderRadius };
      });
      expect(look).toEqual({
        fill: await resolvedColour(page, '--canvas-sunken'),
        padding: '16px',
        radius: '24px',
      });
      const dot = await card.locator('.hg-notification-dot').boundingBox();
      expect([dot?.width, dot?.height]).toEqual([10, 10]);
      const tileBox = await tile.boundingBox();
      const act = await card.getByRole('button', { name: actWord }).boundingBox();
      expect(Math.round((act?.x ?? 0) - (tileBox?.x ?? 0))).toBe(16 + 40 + 12);
      expect(errors).toEqual([]);
    });

    test('product news wears the 32 product tile', async ({ mount }) => {
      const card = await mount(
        <NotificationAnnouncement
          overline={en.t(NOTIFICATION_CENTRE.announcement)}
          title="HelioGrid 2.4"
          body="—"
          time="08:30"
          name="HelioGrid 2.4"
        />,
      );
      const logo = await card.locator('.hg-notification-logo > *').first().boundingBox();
      expect([logo?.width, logo?.height]).toEqual([32, 32]);
    });

    test('product news names who speaks and carries no unread mark', async ({ mount }) => {
      const overline = en.t(NOTIFICATION_CENTRE.announcement);
      const card = await mount(
        <NotificationAnnouncement
          overline={overline}
          title="HelioGrid 2.4"
          body="Your saved designs are untouched."
          time="08:30"
          name="HelioGrid 2.4"
        />,
      );
      await expect(card.getByText(overline)).toBeVisible();
      await expect(card.getByText(unread)).toHaveCount(0);
      await expect(card.locator('.hg-notification-glyph')).toHaveCount(0);
    });

    test('the landing names no one and goes back once', async ({ mount }) => {
      let back = 0;
      const message = en.t(NOTIFICATION_CENTRE.landing);
      const landing = await mount(
        <NotificationLanding
          title={en.t(NOTIFICATION_CENTRE.landingTitle)}
          message={message}
          backLabel={en.t(NOTIFICATION_CENTRE.backToList)}
          onBack={() => {
            back += 1;
          }}
        />,
      );
      await expect(landing.getByText(message)).toBeVisible();
      await landing.getByRole('button', { name: en.t(NOTIFICATION_CENTRE.backToList) }).click();
      await expect.poll(() => back).toBe(1);
    });
  });
}
