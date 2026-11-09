import { PRICE_BOOK_RATE_BASES } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Input } from '../Input/Input.native';
import { Select } from '../Select/Select.native';
import type { CatalogRateEditProps } from './CatalogRates.types';

/** The rate sheet's body on the phone: the rate's one name, how it is charged, and *Remove*. */
export function CatalogRateEdit(props: CatalogRateEditProps) {
  return (
    <View style={styles.body}>
      <Input
        label={props.nameLabel}
        value={props.name}
        onChange={props.onName}
        density="functional"
      />
      <Select
        {...props.select}
        label={props.basisLabel}
        value={props.basis}
        onChange={(value) => {
          const next = PRICE_BOOK_RATE_BASES.find((each) => each === value);
          if (next !== undefined) props.onBasis(next);
        }}
        options={PRICE_BOOK_RATE_BASES.map((basis) => ({
          value: basis,
          label: props.bases[basis],
        }))}
        density="functional"
      />
      {props.remove === null ? null : (
        <View style={styles.remove}>
          <Button
            variant="ghost"
            size="sm"
            tone="danger"
            icon={<ShellGlyph name="trash" size="md" tone="danger" />}
            onClick={props.remove.onRemove}
          >
            {props.remove.label}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  remove: { alignItems: 'flex-start' },
});
