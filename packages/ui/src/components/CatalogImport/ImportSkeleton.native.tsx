import { theme } from '@heliogrid/theme';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ProgressRing } from '../OperationProgress/ProgressRing.native';
import { SHARE_RING } from '../OperationProgress/progress-ring';
import type { ImportFormats } from './CatalogImport.logic';
import { fileOf } from './CatalogImport.steps';
import { CARD_RADIUS, raisedCard, rowDivider } from './CatalogImport.surfaces.native';
import type { CatalogImportProps } from './CatalogImport.types';
import { ImportFind } from './ImportOverview.native';

const RINGS = ['first', 'second', 'third'] as const;
const FIRST_LIST = ['first', 'second'] as const;
const SECOND_LIST = ['first', 'second', 'third'] as const;

/**
 * A kept report reopening (m17-j): the overview's and the lists' own loading form, under a stamp
 * that is already true and a search that is already live. The blocks hold no words; the region
 * says what is happening.
 */
export function ImportSkeleton(props: CatalogImportProps & { formats: ImportFormats }) {
  const { job, words } = props;
  const stamp = job === null ? null : fileOf(job, words, props.formats, props.mapping).stamp;
  return (
    <View style={styles.step}>
      <View style={styles.overview}>
        <View style={styles.top}>
          <Block style={styles.heading} />
          {stamp === null ? null : (
            <Text variant="caption" color="secondary">
              {stamp}
            </Text>
          )}
        </View>
        <Block style={styles.line} />
        <View style={styles.rings}>
          {RINGS.map((ring) => (
            <View key={ring} style={styles.ring}>
              <RingTrack />
              <Block style={styles.label} />
            </View>
          ))}
        </View>
        <View style={styles.find}>
          <ImportFind words={words} query={props.query} onQuery={props.onQuery} />
        </View>
      </View>
      {/* The region names the wait; its blocks are drawn, never read. */}
      <View
        accessible
        accessibilityLabel={words.opening}
        accessibilityLiveRegion="polite"
        style={styles.lists}
      >
        <Block style={styles.head} />
        <SkeletonList rows={FIRST_LIST} />
        <Block style={styles.headLong} />
        <SkeletonList rows={SECOND_LIST} />
      </View>
    </View>
  );
}

function Block({ style }: { style: StyleProp<ViewStyle> }) {
  return <View style={[styles.block, style]} />;
}

/** A ring's track alone, at the share rings' own size: the run ring part with nothing drawn. */
function RingTrack() {
  return <ProgressRing geometry={SHARE_RING} share={0} ink={theme.colors['canvas-sunken']} />;
}

function SkeletonList({ rows }: { rows: readonly string[] }) {
  return (
    <View style={styles.list}>
      {rows.map((row, index) => (
        <View key={row} style={index === 0 ? styles.row : [styles.row, rowDivider]}>
          <Block style={styles.name} />
          <Block style={styles.sub} />
          <Block style={styles.reason} />
          <View style={styles.foot}>
            <Block style={styles.chip} />
            <Block style={styles.price} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* The board's m17-j blocks: every block radius 6 on the sunken well, at the sizes it draws them. */
/** The share rings' box: the skeleton's labels and chips are as wide as a ring. */
const RING = SHARE_RING.box;

const styles = StyleSheet.create({
  step: { gap: theme.spacing['sp-3'] },
  overview: {
    ...raisedCard,
    borderRadius: theme.radius['r-tile'],
    paddingVertical: 14,
    paddingHorizontal: theme.spacing['sp-3'],
    gap: 6,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  rings: { flexDirection: 'row', gap: theme.spacing['sp-1'] },
  ring: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  find: { paddingTop: 6 },
  lists: { gap: theme.spacing['sp-3'] },
  list: { ...raisedCard, borderRadius: CARD_RADIUS },
  row: { gap: theme.spacing['sp-2'], padding: 14 },
  foot: { flexDirection: 'row', justifyContent: 'space-between' },
  block: { borderRadius: theme.radius['rf-sm'], backgroundColor: theme.colors['canvas-sunken'] },
  heading: { width: 72, height: 14 },
  line: { width: '62%', height: 10 },
  label: { width: RING, height: 10 },
  head: { width: 104, height: 12 },
  headLong: { width: 120, height: 12 },
  name: { width: '70%', height: 12 },
  sub: { width: '50%', height: 10 },
  reason: { width: '88%', height: 10 },
  chip: { width: RING, height: 18 },
  price: { width: 120, height: 12 },
});
