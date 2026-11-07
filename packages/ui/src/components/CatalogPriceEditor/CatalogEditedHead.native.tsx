import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { CATALOG_KIND_LEADING } from '../CatalogItems/CatalogItems.rows';
import { Badge, Chip } from '../Chip/Chip.native';
import { HueTile } from '../HueTile/HueTile.native';
import type { CatalogEditedItem, CatalogEditedSpec } from './CatalogPriceEditor.types';

/**
 * The item at the detail's head on the phone (direction A): its kind tile, *Panel · Platform item*
 * and the explainer over the name in the display face; then its marks and its spec as a two-column
 * grid in a soft well — the web's head, as the phone draws it.
 */
export function CatalogEditedHead({ item, ask }: { item: CatalogEditedItem; ask: ReactNode }) {
  const lead = CATALOG_KIND_LEADING[item.kind];
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <HueTile glyph={lead.glyph} hue={lead.hue} size={40} stroke={1.5} />
        <View style={styles.title}>
          <View style={styles.whose}>
            <Text variant="caption" color="secondary">
              {item.kindWord}
            </Text>
            <View style={styles.dot} />
            <Text variant="caption" color="secondary">
              {item.overline}
            </Text>
            {/* The ask rides the line it explains, clear of the sheet's close in the corner. */}
            <View style={styles.ask}>{ask}</View>
          </View>
          <View accessible accessibilityRole="header">
            <Text variant="figure">{item.name}</Text>
          </View>
        </View>
      </View>
      <View style={styles.marks}>
        {item.provenance === 'representative' ? (
          <Badge tone="warning" density="functional">
            {item.provenanceWord}
          </Badge>
        ) : item.provenance === 'verified_datasheet' ? (
          <Badge tone="success" density="functional">
            {item.provenanceWord}
          </Badge>
        ) : (
          <Chip density="functional">{item.provenanceWord}</Chip>
        )}
        {item.held.map((scheme) => (
          <Badge key={scheme} tone="success" density="functional">
            {scheme}
          </Badge>
        ))}
      </View>
      {item.specs.length === 0 ? null : <SpecGrid specs={item.specs} />}
    </View>
  );
}

/**
 * Two columns in a soft well — the control fill of what holds it — with the holder's own colour as
 * the line between cells; an odd last cell runs the grid's width.
 */
function SpecGrid({ specs }: { specs: readonly CatalogEditedSpec[] }) {
  const ground = useGround();
  return (
    <View style={[styles.grid, { backgroundColor: ground.controlFill }]}>
      {specs.map((spec, index) => {
        const last = index === specs.length - 1;
        const whole = last && index % 2 === 0;
        return (
          <View
            key={spec.label}
            accessible
            style={[
              styles.cell,
              { borderColor: ground.ground },
              whole ? styles.cellWhole : undefined,
              index >= 2 ? styles.cellBelow : undefined,
              index % 2 === 0 && !whole ? styles.cellLeft : undefined,
            ]}
          >
            <Text variant="caption" color="secondary">
              {spec.label}
            </Text>
            <Text variant="mono">{spec.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: theme.spacing['sp-3'] },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  ask: { marginLeft: theme.spacing['sp-1'] },
  title: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  whose: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  /* The dot between the two words is drawn, never typed: a word stays a word. */
  dot: {
    width: theme.spacing['sp-1'] / 2,
    height: theme.spacing['sp-1'] / 2,
    marginHorizontal: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['text-secondary'],
  },
  marks: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-1'] },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: theme.radius['r-tile'],
    overflow: 'hidden',
  },
  cell: {
    width: '50%',
    gap: theme.spacing['sp-0-5'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  cellWhole: { width: '100%' },
  /* The holder's own colour (its ground) between cells, set on each cell above. */
  cellBelow: { borderTopWidth: 1 },
  cellLeft: { borderRightWidth: 1 },
});
