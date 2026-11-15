import { IN_FORMATS } from '@heliogrid/domain';
import { createTranslator, projectBoardWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { ProjectBoardOfOneDue } from './ProjectBoard.story';

const en = await createTranslator('en');
const words = projectBoardWords(en.t, IN_FORMATS, 'en');

const card = {
  id: '018f0000-0000-7000-8000-000000000201',
  number: 'PRJ-0007',
  name: 'Anil Sharma',
  place: 'Pune',
  stage: 'installation',
  enteredOn: '2026-11-01',
  manager: { userId: '018f0000-0000-7000-8000-000000000202', name: 'Suresh Kulkarni' },
  expectedInstallOn: null,
  steps: { ticked: 0, total: 4 },
  wait: null,
  todo: 'money_due',
  earlyProofTo: null,
  missingProofRow: null,
  money: { duePart: { label: 'Delivery', outstanding: '19057.50', dueOn: '2026-11-10' } },
};

/* What a project still owes is never rounded (§9): its to-do line prints the paise. */
test('the board’s due amount prints a paise amount exactly — ₹19,057.50, never ₹19,058', async ({
  mount,
}) => {
  const frame = await mount(<ProjectBoardOfOneDue card={card} />);
  const line = words.todoLine('money_due', {
    ...card,
    money: { part: 'Delivery', amount: '₹19,057.50' },
  });
  await expect(frame.getByRole('listitem').getByText(line, { exact: true })).toBeVisible();
  await expect(frame.getByText('₹19,058', { exact: false })).toHaveCount(0);
});
