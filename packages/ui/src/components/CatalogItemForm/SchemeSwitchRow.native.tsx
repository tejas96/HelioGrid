import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, useGround } from '../../primitives/Ground/Ground.native';
import { Input } from '../Input/Input.native';
import { Switch } from '../Switch/Switch.native';
import type { SchemeSwitchRowProps } from './CatalogItemForm.parts.types';

/**
 * One declared scheme (`SCR-M01-16`, the 375 frames): its switch across the row, words first;
 * switched on, a list scheme asks for its reference under it. On, the row takes the success wash
 * and holds its controls as a tint does; off, it lies on the card's own white inside a thin edge.
 */
export function SchemeSwitchRow({
  scheme,
  words,
  held,
  error,
  focusRequest,
  onChange,
}: SchemeSwitchRowProps) {
  const card = useGround();
  const asksReference = held.on && words.reference !== null;
  return (
    <View
      style={[
        styles.row,
        held.on ? styles.on : [styles.off, { backgroundColor: card.ground }],
        asksReference ? styles.withReference : undefined,
      ]}
    >
      <GroundProvider ground={held.on ? 'tile' : 'page'}>
        <Switch
          label={words.label}
          checked={held.on}
          onChange={(on) => onChange({ type: 'scheme', scheme, on })}
          style={styles.switch}
        />
        {asksReference ? (
          <Input
            label={words.reference ?? undefined}
            value={held.reference}
            onChange={(value) => onChange({ type: 'reference', scheme, value })}
            density="functional"
            error={error}
            focusRequest={focusRequest}
          />
        ) : null}
      </GroundProvider>
    </View>
  );
}

/* The board's rows: corner 16, 14 at each side and under a reference field, 10 between. The
   wash is `success-bg`, the success hue's own light wash, so no tint is mixed here. */
const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius['r-md'],
  },
  on: { backgroundColor: theme.colors['success-bg'] },
  off: { borderWidth: 1, borderColor: theme.colors['line-soft'] },
  withReference: { paddingBottom: 14 },
  switch: { width: '100%', flexDirection: 'row-reverse', justifyContent: 'space-between' },
});
