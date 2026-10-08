import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { FindingList } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const title = en.t(COMPANY_SIGNUP.yourCompany);
const jumpLabel = en.t(COMPANY_SIGNUP.useDifferentNumber);
const findings = [
  { id: 'name', title: en.t(COMPANY_SIGNUP.companyName), status: 'blocking' as const },
];

test('a finding list is a heading on the page — no fill, no shadow', async ({ mount }) => {
  const list = await mount(<FindingList title={title} findings={findings} />);

  await expect(list).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(list).toHaveCSS('box-shadow', 'none');
  await expect(list).toHaveCSS('border-radius', '0px');
});

test('a finding is a grey tile with no shadow and its controls are white', async ({
  mount,
  page,
}) => {
  const list = await mount(
    <FindingList
      title={title}
      findings={findings}
      onJump={() => undefined}
      jumpLabel={jumpLabel}
    />,
  );
  const finding = list.getByRole('listitem');

  await expect(finding).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(finding).toHaveCSS('box-shadow', 'none');
  await expect(finding.getByRole('button', { name: jumpLabel })).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
});
