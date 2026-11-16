import { IN_FORMATS } from '@heliogrid/domain';
import { createTranslator, leadsListWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNothingClipped } from '../support/layout';
import { NamedLeadCard } from './LeadListRow.story';

/**
 * A lead's card (`SCR-M02-03`) holds every field the desktop's table does — the number under the
 * name, when it was last touched and who owns it — so the phone and a narrow web column lose
 * nothing the table shows.
 */
const en = await createTranslator('en');
const words = leadsListWords(en.t, { pack: IN_FORMATS, language: 'en', now: Date.now() });
const OWNER = 'Meera Kulkarni';
/** The story's lead was last touched six hours ago. */
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

test('a named lead shows its number, its last activity and its owner by name', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const card = await mount(<NamedLeadCard name="Asha Kulkarni" owner={OWNER} />);

  await expect(card.getByText('Asha Kulkarni', { exact: true })).toBeVisible();
  await expect(card.getByText(/98765\s*00011/)).toBeVisible();
  await expect(card.getByText(words.lastActivity(SIX_HOURS_MS), { exact: true })).toBeVisible();
  await expect(card.getByText(OWNER, { exact: true })).toBeVisible();
  await expectNothingClipped(page, '.hg-lead-list-row-owner-name, .hg-lead-list-row-since');
});
