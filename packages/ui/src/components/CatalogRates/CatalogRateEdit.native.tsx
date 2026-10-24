import { PRICE_BOOK_RATE_BASES } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Input } from '../Input/Input.native';
import { Select } from '../Select/Select.native';
import type { CatalogRateEditProps } from './CatalogRates.types';

/**
 * The rate sheet's body on the phone (owner ruling 2026-10-24): the rate's name in English, Hindi
 * and Marathi — an empty Hindi or Marathi name says English stands in (`F3-10`) — its basis, *Remove*.
 */
export function CatalogRateEdit(props: CatalogRateEditProps) {
  return (
    <View style={styles.body}>
      {props.names.map((name) => (
        <Input
          key={name.language}
          label={name.label}
          value={name.value}
          onChange={(value) => props.onName(name.language, value)}
          placeholder={name.placeholder}
          density="functional"
          {...(name.missing === null ? {} : { helper: name.missing })}
        />
      ))}
      <Select
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
