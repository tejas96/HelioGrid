import { createTranslator, LEAD_DETAIL } from '@heliogrid/i18n';
import { LeadActionDock } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

/**
 * A closed lead (`M02-32`, disqualified or junk) offers Reopen alone in both layouts — the phone's
 * dock and the wide web's grid — so nobody calls or books a closed lead by mistake.
 */
const { t } = await createTranslator('en');
const ACTS = [
  { action: 'message', label: t(LEAD_DETAIL.message), short: t(LEAD_DETAIL.message) },
  { action: 'log', label: t(LEAD_DETAIL.logActivity), short: t(LEAD_DETAIL.log) },
  { action: 'visit', label: t(LEAD_DETAIL.bookVisit), short: t(LEAD_DETAIL.visit) },
] as const;

for (const layout of ['dock', 'grid'] as const) {
  test(`a closed lead in the ${layout} offers Reopen alone`, async ({ mount, page }) => {
    await page.setViewportSize({ width: layout === 'grid' ? 1536 : 375, height: 800 });
    const dock = await mount(
      <LeadActionDock
        layout={layout}
        call={{ kind: 'dial', phoneE164: '+919876500011' }}
        callLabel={t(LEAD_DETAIL.call)}
        acts={ACTS.map((act) => ({ ...act, disabledReason: null, onPress: () => undefined }))}
        stateActs={[{ act: 'reopen', label: t(LEAD_DETAIL.reopen), onPress: () => undefined }]}
        standing={null}
        closed
      />,
    );
    await expect(dock.getByRole('button', { name: t(LEAD_DETAIL.reopen) })).toBeVisible();
    await expect(dock.getByText(t(LEAD_DETAIL.call), { exact: true })).toHaveCount(0);
    await expect(dock.getByText(t(LEAD_DETAIL.logActivity), { exact: true })).toHaveCount(0);
  });
}
