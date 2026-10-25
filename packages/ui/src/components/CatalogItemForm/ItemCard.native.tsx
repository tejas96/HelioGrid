import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { raisedCard } from '../CatalogImport/CatalogImport.surfaces.native';
import { IrisTile } from '../IrisTile/IrisTile.native';
import type { ItemCardProps } from './CatalogItemForm.parts.types';

/**
 * One raised card of the add sheet (`SCR-M01-16`, the 375 frames): its glyph on its iris, its title
 * as the section's heading, then its fields. A page ground, so a field in it takes the well.
 */
export function ItemCard({ glyph, iris, title, trailing, children }: ItemCardProps) {
  return (
    <View style={styles.card}>
      <GroundProvider ground="page">
        <View style={styles.head}>
          <IrisTile glyph={glyph} iris={iris} size={32} stroke={1.6} />
          <View style={styles.title} accessibilityRole="header">
            <Text variant="body" bold>
              {title}
            </Text>
          </View>
          {trailing}
        </View>
        {children}
      </GroundProvider>
    </View>
  );
}

/** A card's closing line — the scheme note, the price note. */
export function ItemCardNote({ children }: { children: string }) {
  return (
    <Text variant="caption" color="secondary">
      {children}
    </Text>
  );
}

/* The board's 375 card: white at e2, its corner 20, 16 around and between. */
const styles = StyleSheet.create({
  card: {
    ...raisedCard,
    gap: theme.spacing['sp-4'],
    padding: theme.spacing['sp-4'],
    borderRadius: 20,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  title: { flex: 1, minWidth: 0 },
});
