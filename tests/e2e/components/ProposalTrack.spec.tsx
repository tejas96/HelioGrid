import { proposalSheetsOf } from '@heliogrid/domain';
import { createTranslator, proposalTrackWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { detailAt } from '../support/proposal-after-sample';
import { SNAPSHOT } from '../support/proposal-document-sample';
import { numberedTerms } from '../support/proposal-long-terms';
import { expectTouchFloor } from '../support/touch-target';
import { TrackAsDrawn } from './ProposalAfter.story';
import { TrackOfVersionShown } from './ProposalTrack.story';

/**
 * A proposal after it is built (`SCR-M06-18`): where it stands as a mark and a word, one sentence,
 * the one next act for that standing, the four steps with their times, the line that no delivery
 * is claimed, and the rows. Its loading and failed reads.
 */
const en = await createTranslator('en');
const words = proposalTrackWords(en.t, {
  when: (instant) => `${instant.slice(8, 10)} Nov, ${instant.slice(11, 16)}`,
  // The story prints every "ago" alike (`ProposalAfter.story.tsx`'s formats).
  ago: () => '2 hours ago',
});
const at = (page: Page, width: number) => page.setViewportSize({ width, height: 900 });

for (const width of [375, 1536]) {
  test(`at ${width} a ready proposal offers Share, names its four steps and claims no delivery`, async ({
    mount,
    page,
  }) => {
    await at(page, width);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const detail = detailAt('ready');
    const frame = await mount(<TrackAsDrawn standing="ready" />);
    const hero = page.getByRole('region', { name: words.heroName });
    await expect(hero.getByText(words.standing('ready'))).toBeVisible();
    await expect(hero.getByRole('heading', { name: words.story(detail).title })).toBeVisible();
    const steps = hero.getByRole('list', { name: words.trackName }).getByRole('listitem');
    await expect(steps).toHaveText(
      words.nodes(detail.tracking).map((node) => new RegExp(`^${node.name}`)),
    );
    await expect(hero.getByText(words.neverDelivered)).toBeVisible();
    const share = hero.getByRole('button', { name: words.act('share', detail) });
    await expectTouchFloor([share]);
    await share.click();
    await expect(frame).toHaveAttribute('data-act', 'share');
    await expect(page.getByText(words.row('links', detail, null).title)).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
}

test('each standing offers its own next act, and an opened or declined one a second', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  for (const [standing, main, second] of [
    ['shared', 'share_again', null],
    ['opened', 'call', 'share_again'],
    ['negotiating', 'new_version', null],
    ['accepted', 'confirm_won', null],
    ['declined', 'call', 'share_again'],
    ['won', 'open_project', null],
  ] as const) {
    const detail = detailAt(standing);
    const frame = await mount(<TrackAsDrawn standing={standing} />);
    await page.getByRole('button', { name: words.act(main, detail) }).click();
    await expect(frame).toHaveAttribute('data-act', main);
    if (second !== null) {
      await expect(page.getByRole('button', { name: words.act(second, detail) })).toBeVisible();
    }
    await frame.unmount();
  }
});

test('a proposal that cannot be shared says why in words, offers no share and offers the new version', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  for (const [standing, main] of [
    ['ready', 'new_version'],
    ['shared', 'new_version'],
    ['opened', 'call'],
  ] as const) {
    const detail = { ...detailAt(standing), shareBlockedBy: 'stale' };
    const frame = await mount(<TrackAsDrawn standing={standing} blockedBy="stale" />);
    await expect(page.getByText(words.blockedTitle)).toBeVisible();
    await expect(page.getByText(words.blockedLine('stale'))).toBeVisible();
    await expect(page.getByText('stale', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: words.act('share', detail) })).toHaveCount(0);
    await expect(page.getByRole('button', { name: words.act('share_again', detail) })).toHaveCount(
      0,
    );
    await page.getByRole('button', { name: words.act(main, detail) }).click();
    await expect(frame).toHaveAttribute('data-act', main);
    await expect(
      page.getByRole('button', { name: words.act('new_version', detail) }),
    ).toBeVisible();
    await frame.unmount();
  }
});

test('a draft ticks no step: each reads Not yet and none is marked done', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  await mount(<TrackAsDrawn standing="ready" draft />);
  const steps = page.getByRole('list', { name: words.trackName }).getByRole('listitem');
  await expect(steps).toHaveCount(4);
  for (const step of await steps.all()) {
    await expect(step).toHaveAttribute('data-at', 'ahead');
  }
});

test('an accepted proposal offers the thank-you, and the installation message when it is due', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  const detail = detailAt('accepted');
  const frame = await mount(<TrackAsDrawn standing="accepted" crew />);
  await page
    .getByRole('button', { name: new RegExp(words.row('thank', detail, null).title) })
    .click();
  await expect(frame).toHaveAttribute('data-act', 'thank');
  await page
    .getByRole('button', { name: new RegExp(words.row('crew', detail, null).title) })
    .click();
  await expect(frame).toHaveAttribute('data-act', 'crew');
});

test('the wait is named, and a failed read says what happened and asks again', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  const loading = await mount(<TrackAsDrawn standing="ready" frame="loading" />);
  await expect(page.getByRole('status', { name: words.loading })).toBeVisible();
  await loading.unmount();
  const frame = await mount(<TrackAsDrawn standing="ready" frame="failed" />);
  await expect(page.getByText(words.failedTitle)).toBeVisible();
  await page.getByRole('button', { name: words.retry }).click();
  await expect(frame).toHaveAttribute('data-act', 'retry');
});

/*
 * After a new version, the document row counts the sheets the version on the link prints — its
 * long terms run over a second sheet — never the draft's page count.
 */
test('the document row counts the shown version’s sheets after a new version', async ({
  mount,
  page,
}) => {
  const clauses = 18;
  const terms = numberedTerms(clauses);
  const sheets = proposalSheetsOf(SNAPSHOT.pages, { ...SNAPSHOT.fields, terms }).length;
  const detail = detailAt('shared');
  expect(sheets).toBeGreaterThan(detail.document.pages.length);
  await mount(<TrackOfVersionShown clauses={clauses} />);
  await expect(page.getByText(words.row('document', detail, sheets).title)).toBeVisible();
});
