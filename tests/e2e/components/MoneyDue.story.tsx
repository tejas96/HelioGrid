import type { MoneyDue as Due, MoneyDueRow } from '@heliogrid/contracts';
import { createTranslator, moneyDueWords } from '@heliogrid/i18n';
import { MoneyDue } from '@heliogrid/ui';

const en = await createTranslator('en');

/** Money due over one late part, its words and acts bound in the browser (its lines are functions it calls while it renders). */
export function MoneyDueOfOnePart({ due }: { due: Due }) {
  const rows: readonly MoneyDueRow[] = due.rows.items;
  return (
    <MoneyDue
      read={{ kind: 'ready', value: due }}
      words={moneyDueWords(en.t)}
      groups={[
        { group: 'late', count: rows.length, amount: due.groups.late.amount, rows, hidden: 0 },
      ]}
      onShowAll={() => undefined}
      onOpen={() => undefined}
      focusAfter={{ current: null }}
    />
  );
}
