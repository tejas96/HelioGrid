import { PROPOSAL_PAGES } from '@heliogrid/domain';
import {
  createTranslator,
  proposalDefaultsCovers,
  proposalDefaultsPartWords,
  proposalDefaultsWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll } from '../support/layout';
import { PLAN_LINES, PLANS } from '../support/proposal-template-sample';
import { ProposalDefaultsStory } from './ProposalTemplateSettings.story';

/**
 * Proposal defaults (`SCR-M01-19`, `T-M01-030`): seven parts on the builder's frame, the page each
 * feeds drawn by the document's own renderer, and the builder step's own controls as its editor.
 */
const en = await createTranslator('en');
const WORDS = proposalDefaultsWords(en.t);
const STEP = proposalDefaultsPartWords(en.t, {
  owner: '',
  routingLabel: 'IFSC',
  printsBank: false,
});
const COVERS = proposalDefaultsCovers(en.t);
const PARTS = ['look', 'record', 'pages', 'timeline', 'payment', 'terms', 'bank'] as const;

for (const size of [
  { name: '1536', width: 1536, height: 960, wide: true },
  { name: '375', width: 375, height: 812, wide: false },
] as const) {
  test.describe(`at ${size.name}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('the seven parts, each with its title, in one row', async ({ mount, page }) => {
      const body = await mount(<ProposalDefaultsStory wide={size.wide} />);
      for (const part of PARTS) {
        const tab = size.wide
          ? body.getByRole('navigation', { name: WORDS.frame.steps }).getByRole('button', {
              name: WORDS.parts[part].title,
              exact: true,
            })
          : body.getByRole('tab', { name: WORDS.parts[part].title, exact: true });
        await tab.click();
        await expect(
          body.getByRole('heading', { level: 1, name: WORDS.parts[part].heading }),
        ).toBeVisible();
      }
      await expectNoSidewaysScroll(page);
    });

    test('Look offers the four pictures and the company’s own photo', async ({ mount }) => {
      const body = await mount(<ProposalDefaultsStory wide={size.wide} part="look" ownPhoto />);
      const pictures = body.getByRole('radiogroup', { name: WORDS.coverPicture });
      await expect(pictures.getByRole('radio')).toHaveCount(COVERS.length + 1);
      await expect(pictures.getByRole('radio', { name: COVERS[0]?.name })).toBeChecked();
      await pictures.getByRole('radio', { name: COVERS[2]?.name }).click();
      await expect(pictures.getByRole('radio', { name: COVERS[2]?.name })).toBeChecked();
      await pictures.getByRole('radio', { name: WORDS.ownPhoto }).click();
      await expect(pictures.getByRole('radio', { name: WORDS.ownPhoto })).toBeChecked();
      await expect(body.getByRole('button', { name: WORDS.save })).toBeVisible();
    });

    test('Pages: three pages are locked, a switched page leaves the document', async ({
      mount,
      page,
    }) => {
      const body = await mount(<ProposalDefaultsStory wide={size.wide} part="pages" />);
      await expect(body.getByRole('switch')).toHaveCount(PROPOSAL_PAGES.length - 3);
      await expect(body.getByText(WORDS.always, { exact: true })).toHaveCount(3);
      const about = page.getByRole('switch', { name: WORDS.printPage(WORDS.pageName.about) });
      await expect(about).toBeChecked();
      /* The input is drawn as its toggle; a person presses the label that holds it. */
      await page.locator('label').filter({ has: about }).click();
      await expect(about).not.toBeChecked();
      if (size.wide) {
        await expect(body.getByText(WORDS.pageOff(WORDS.pageName.about))).toBeVisible();
        await expect(
          body.getByText(WORDS.pagesPrint(PROPOSAL_PAGES.length - 1, PROPOSAL_PAGES.length)),
        ).toBeVisible();
      }
      await body.getByRole('button', { name: WORDS.discard }).click();
      await expect(about).toBeChecked();
    });

    test('Payment names the plans, the default chosen, and edits it with step 7’s rows', async ({
      mount,
    }) => {
      const body = await mount(<ProposalDefaultsStory wide={size.wide} part="payment" />);
      for (const plan of PLANS) {
        await expect(body.getByRole('button', { name: plan.name })).toBeVisible();
      }
      await body.getByRole('button', { name: PLANS[1].name }).click();
      await expect(body.getByTestId('said')).toHaveText(`plan ${PLANS[1].id}`);
      const first = PLAN_LINES[0].label;
      await body.getByRole('button', { name: STEP.payment.more(first) }).click();
      await expect(body.getByTestId('said')).toHaveText('share 0 15');
      await body.getByRole('button', { name: STEP.payment.add }).click();
      await expect(body.getByTestId('said')).toHaveText('add part');
      await body.getByRole('button', { name: STEP.payment.reset }).click();
      await expect(body.getByTestId('said')).toHaveText('reset plan');
    });

    test('a plan that did not save says so in its part', async ({ mount }) => {
      const body = await mount(
        <ProposalDefaultsStory wide={size.wide} part="payment" planFailed />,
      );
      await expect(body.getByText(STEP.payment.planFailed.title)).toBeVisible();
    });

    test('a failed read says so and offers its retry', async ({ mount }) => {
      const body = await mount(<ProposalDefaultsStory wide={size.wide} read="failed" />);
      await expect(body.getByText(WORDS.unread)).toBeVisible();
      await body.getByRole('button', { name: WORDS.tryAgain }).click();
      await expect(body.getByTestId('said')).toHaveText('retried');
    });

    test('a save that did not land keeps its bar and says what to do', async ({ mount }) => {
      const body = await mount(<ProposalDefaultsStory wide={size.wide} saveFailed />);
      await expect(body.getByText(WORDS.saveFailed)).toBeVisible();
      await expect(body.getByRole('button', { name: WORDS.save })).toBeVisible();
    });

    test('Hindi keeps every part in its room', async ({ mount, page }) => {
      await mount(<ProposalDefaultsStory wide={size.wide} part="pages" reader="hi" />);
      await expectNoSidewaysScroll(page);
    });
  });
}

test.describe('the desktop head', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('a breadcrumb back to Settings, the note, and Done — no close and no Generate', async ({
    mount,
  }) => {
    const body = await mount(<ProposalDefaultsStory wide part="look" />);
    await expect(body.getByText(WORDS.note)).toHaveCount(2);
    await body.getByRole('button', { name: WORDS.settings }).click();
    await expect(body.getByTestId('said')).toHaveText('settings');
    await body.getByRole('button', { name: WORDS.frame.generate, exact: true }).first().click();
    await expect(body.getByTestId('said')).toHaveText('done');
  });
});

test.describe('the phone head', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('back, the page’s name held still, and the eye that opens the page', async ({
    mount,
    page,
  }) => {
    const body = await mount(<ProposalDefaultsStory wide={false} part="record" />);
    await expect(body.getByText(WORDS.title, { exact: true })).toBeVisible();
    await body.getByRole('button', { name: WORDS.frame.preview }).click();
    await expect(page.getByRole('dialog', { name: WORDS.peek })).toBeVisible();
  });
});
