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
  Text,
  useFormat,
} from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/**
 * The find step on the phone: the family's other record by name, phone or city — only customers
 * the person may open, never the record that stays. A row picks it, and the compare opens.
 */
export function MergeFindStep({ find }: { find: CustomerMergeFind }) {
  const t = useTranslate();
  const format = useFormat();
  const all = customerMergeWords(t);
  const words = all.find;
  const { read } = find;
  return (
    <View style={styles.stack}>
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
        <Text variant="body-sm" color="secondary">
          {words.noMatch(find.searched)}
        </Text>
      ) : read.kind === 'ready' ? (
        <Card>
          {read.value.map((customer) => (
            <ListRow
              key={customer.id}
              icon={<ShellGlyph name="user" size="md" />}
              title={customer.name ?? <NamedGap gap={all.noName} scale="cell" />}
              subtitle={
                <View style={styles.row}>
                  <Text variant="mono" color="secondary">
                    {format.phone(customer.phoneE164)}
                  </Text>
                  {customer.city === null ? null : (
                    <Text variant="body-sm" color="secondary">
                      {customer.city}
                    </Text>
                  )}
                </View>
              }
              onClick={() => find.pick(customer.id)}
            />
          ))}
        </Card>
      ) : null}
    </View>
  );
}
