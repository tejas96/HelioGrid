import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { raisedCard } from '../CatalogImport/CatalogImport.surfaces.native';
import { IrisTile } from '../IrisTile/IrisTile.native';
import type { SheetAcceleratorProps } from './CatalogItemForm.parts.types';

/**
 * *Add many at once from a spreadsheet* (`SCR-M01-16`, the 375 frames): the add sheet's one
 * accelerator, a raised tile on its own full-width row that hands the person to the import sheet.
 */
export function SheetAccelerator({ title, sub, onPress }: SheetAcceleratorProps) {
  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <IrisTile glyph="spreadsheet" iris="blue" size={40} stroke={1.6} />
      <View style={styles.words}>
        <Text variant="body-sm" bold>
          {title}
        </Text>
        <Text variant="caption" color="secondary">
          {sub}
        </Text>
      </View>
      <ShellGlyph name="chevron-right" size="md" tone="secondary" />
    </Pressable>
  );
}

/* The board's tile: white at e2, its corner 18, 12 by 14 inside, 12 between its parts. */
const styles = StyleSheet.create({
  tile: {
    ...raisedCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
