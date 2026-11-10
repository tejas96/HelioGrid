'use client';
import type { CustomerMergeFind } from '@heliogrid/data/react';
import { customerMergeWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Card,
  ListRow,
  LoadingBars,
  NamedGap,
  SearchField,
  ShellGlyph,
  useFormat,
} from '@heliogrid/ui';

/**
 * The find step: the family's other record by name, phone or city — only customers the person may
 * open, never the record that stays. A row picks it, and the compare opens.
 */
export function MergeFindPart({ find }: { find: CustomerMergeFind }) {
  const t = useTranslate();
  const format = useFormat();
  const all = customerMergeWords(t);
  const words = all.find;
  const { read } = find;
  return (
    <section className="hg-customer-merge-find" aria-label={words.title}>
      <h2 className="hg-customer-merge-heading">{words.title}</h2>
      <p className="hg-customer-merge-line">{words.line}</p>
      <SearchField
        value={find.query}
        onChange={find.setQuery}
        placeholder={words.placeholder}
        ariaLabel={words.placeholder}
        onClear={() => find.setQuery('')}
        clearLabel={words.clear}
      />
      {read.kind === 'loading' ? (
        <LoadingBars bars={['row', 'row', 'row']} label={words.searching} />
      ) : read.kind === 'failed' ? (
        <Card
          read={read}
          loadingLabel={words.searching}
          errorTitle={words.failed}
          retryLabel={all.tryAgain}
        />
      ) : read.kind === 'empty' ? (
        <p className="hg-customer-merge-line">{words.noMatch(find.searched)}</p>
      ) : read.kind === 'ready' ? (
        <Card>
          {read.value.map((customer) => (
            <ListRow
              key={customer.id}
              icon={<ShellGlyph name="user" size="md" />}
              title={customer.name ?? <NamedGap gap={all.noName} scale="cell" />}
              subtitle={
                <span className="hg-customer-merge-found">
                  <span className="hg-customer-merge-mono">{format.phone(customer.phoneE164)}</span>
                  {customer.city === null ? null : <span>{customer.city}</span>}
                </span>
              }
              onClick={() => find.pick(customer.id)}
            />
          ))}
        </Card>
      ) : null}
    </section>
  );
}
