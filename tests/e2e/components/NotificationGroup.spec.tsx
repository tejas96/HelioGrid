import { createTranslator, groupSentence, NOTIFICATION_CENTRE } from '@heliogrid/i18n';
import { IconButton, NotificationGroup } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';
import { MIN_TOUCH_TARGET } from '../support/touch-target';

/** A group of notifications (`SCR-SHELL-03`, `F6-12`), at the phone's 335 and the web panel's 456. */
const en = await createTranslator('en');
const showThree = en.t(NOTIFICATION_CENTRE.showGroup, { count: 3 });
const hideThree = en.t(NOTIFICATION_CENTRE.hideGroup, { count: 3 });

for (const width of [335, 456]) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('a member that opens takes --fill-hover under the pointer', async ({ mount, page }) => {
      const title = 'Deshmukh Textiles · v4';
      const group = await mount(
        <NotificationGroup
          type="proposal_opened"
          sentence={groupSentence(en.t, 'proposal_opened', 1)}
          latest={en.t(NOTIFICATION_CENTRE.latest, { time: '15:48' })}
          unreadLabel={en.t(NOTIFICATION_CENTRE.groupUnread, { count: 1 })}
          onToggle={() => undefined}
          open
          toggleLabel={hideThree}
          members={[
            {
              id: 'm0',
              title,
              line: 'Opened 15:40 · Nashik',
              name: title,
              onOpen: () => undefined,
            },
          ]}
        />,
      );
      const member = page.locator('.hg-notification-member');

      await group.getByRole('button', { name: title }).hover();
      await expect(member).toHaveCSS(
        'background-color',
        await resolvedColour(page, '--fill-hover'),
      );
    });

    test('a group: closed it holds its count, opened it lists each member as its own link', async ({
      mount,
    }) => {
      const sentence = groupSentence(en.t, 'proposal_opened', 3);
      const members = ['Deshmukh Textiles · v4', 'Yeola Sugar Mills · v2', 'Panchavati · v1'].map(
        (title, index) => ({
          id: `m${index}`,
          title,
          line: `Opened 15:4${index} · Nashik`,
          name: title,
          onOpen: () => undefined,
        }),
      );
      const words = {
        type: 'proposal_opened',
        sentence,
        latest: en.t(NOTIFICATION_CENTRE.latest, { time: '15:48' }),
        unreadLabel: en.t(NOTIFICATION_CENTRE.groupUnread, { count: 2 }),
        onToggle: () => undefined,
        members,
      };

      const closed = await mount(
        <NotificationGroup {...words} open={false} toggleLabel={showThree} />,
      );
      await expect(closed.getByText(sentence)).toBeVisible();
      const show = closed.getByRole('button', { name: showThree });
      await expect(show).toHaveAttribute('aria-expanded', 'false');
      await expect(closed.getByRole('button', { name: members[0]?.name })).toHaveCount(0);
      await closed.unmount();

      const opened = await mount(<NotificationGroup {...words} open toggleLabel={hideThree} />);
      await expect(opened.getByRole('button', { name: hideThree })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      for (const member of members) {
        const link = opened.getByRole('button', { name: member.name });
        const box = await link.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      }
    });

    test('an icon act on a member is its own control: it fires, and the member does not open', async ({
      mount,
    }) => {
      let opened = 0;
      let called = 0;
      const callName = en.t(NOTIFICATION_CENTRE.goToLeads);
      const group = await mount(
        <NotificationGroup
          type="proposal_opened"
          sentence={groupSentence(en.t, 'proposal_opened', 2)}
          latest={en.t(NOTIFICATION_CENTRE.latest, { time: '15:48' })}
          open
          onToggle={() => undefined}
          toggleLabel={en.t(NOTIFICATION_CENTRE.hideGroup, { count: 2 })}
          members={['A · v1', 'B · v2'].map((title, index) => ({
            id: `m${index}`,
            title,
            line: '15:40',
            name: title,
            onOpen: () => {
              opened += 1;
            },
            sideAct:
              index === 0 ? (
                <IconButton
                  label={callName}
                  onClick={() => {
                    called += 1;
                  }}
                >
                  ·
                </IconButton>
              ) : undefined,
          }))}
        />,
      );
      await group.getByRole('button', { name: callName }).click();
      await expect.poll(() => called).toBe(1);
      expect(opened).toBe(0);
    });

    test('opened members stand 8 apart with padding 12/12/12/16, under the card by 8', async ({
      mount,
    }) => {
      const members = ['A · v1', 'B · v2'].map((title, index) => ({
        id: `m${index}`,
        title,
        line: '15:40',
        name: title,
        onOpen: () => undefined,
      }));
      const group = await mount(
        <NotificationGroup
          type="survey_submitted"
          sentence={groupSentence(en.t, 'survey_submitted', 2)}
          latest={en.t(NOTIFICATION_CENTRE.latest, { time: '17:30' })}
          open
          onToggle={() => undefined}
          toggleLabel={en.t(NOTIFICATION_CENTRE.hideGroup, { count: 2 })}
          members={members}
        />,
      );
      const rows = group.locator('.hg-notification-member');
      const first = await rows.nth(0).boundingBox();
      const second = await rows.nth(1).boundingBox();
      const card = await group.locator('.hg-notification-card').boundingBox();
      if (first === null || second === null || card === null) throw new Error('all render');
      expect(Math.round(second.y - (first.y + first.height))).toBe(8);
      expect(Math.round(first.y - (card.y + card.height))).toBe(8);
      expect(await rows.nth(0).evaluate((node) => getComputedStyle(node).padding)).toBe(
        '12px 12px 12px 16px',
      );
    });

    test('in Hindi at twice the text size, the group fits its width and nothing overlaps', async ({
      mount,
      page,
    }) => {
      const hi = await createTranslator('hi');
      /* 200% text is the browser's zoom, and a zoomed page lays out at half its width. */
      await page.setViewportSize({ width: Math.round(width / 2), height: 800 });
      const group = await mount(
        <NotificationGroup
          type="proposal_opened"
          sentence={groupSentence(hi.t, 'proposal_opened', 3)}
          latest={hi.t(NOTIFICATION_CENTRE.latest, { time: '15:48' })}
          unreadLabel={hi.t(NOTIFICATION_CENTRE.groupUnread, { count: 2 })}
          open={false}
          onToggle={() => undefined}
          toggleLabel={hi.t(NOTIFICATION_CENTRE.showGroup, { count: 3 })}
          members={[]}
        />,
      );
      const overflow = await group.evaluate((node) => {
        const edge = node.getBoundingClientRect().right;
        return [...node.querySelectorAll('*')]
          .filter((child) => child.getBoundingClientRect().right > edge + 0.5)
          .map((child) => child.className);
      });
      expect(overflow).toEqual([]);
      const title = await group.getByText(groupSentence(hi.t, 'proposal_opened', 3)).boundingBox();
      const toggle = await group.getByRole('button').boundingBox();
      if (title === null || toggle === null) throw new Error('both render');
      expect(title.y + title.height).toBeLessThanOrEqual(toggle.y);
    });
  });
}
