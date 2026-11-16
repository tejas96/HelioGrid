import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { useFormat } from '../MarketProvider';
import { SegmentBar } from '../SegmentBar/SegmentBar.native';
import { HUE_INK, HUE_WASH } from './ShareFilter.inks';
import type { ShareFilterItem, ShareFilterProps } from './ShareFilter.types';

type ShareBarProps = Pick<ShareFilterProps, 'label' | 'barLabel' | 'items' | 'pressed' | 'onPress'>;

/** The web half's three-column grid: RN has no grid, so the buttons go in rows of three. */
const COLUMNS = 3;

/** The empty cells a short last row keeps, so its buttons stay one column wide. */
const SPARE_CELLS = ['spare-second', 'spare-third'] as const;

function rowsOf(items: readonly ShareFilterItem[]): ShareFilterItem[][] {
  const rows: ShareFilterItem[][] = [];
  for (let start = 0; start < items.length; start += COLUMNS) {
    rows.push(items.slice(start, start + COLUMNS));
  }
  return rows;
}

/**
 * `layout="bar"`: one stacked bar over rows of count buttons, each a toggle that scopes the list to
 * its part. The bar is one image named by `barLabel`; without that sentence it is hidden, since the
 * buttons say every count. A short last row keeps its columns, as the web half's grid does.
 */
export function ShareBar({ label, barLabel, items, pressed, onPress }: ShareBarProps) {
  const { number } = useFormat();
  const { controlFill } = useGround();
  return (
    <View role="group" accessibilityLabel={label} style={styles.shell}>
      <SegmentBar
        parts={items.map((item) => ({ key: item.id, count: item.count, ink: HUE_INK[item.hue] }))}
        size="lg"
        label={barLabel}
      />
      {rowsOf(items).map((row) => (
        <View key={row.map((item) => item.id).join(' ')} style={styles.row}>
          {row.map((item) => {
            const on = pressed === item.id;
            const hue = HUE_INK[item.hue];
            return (
              <Pressable
                key={item.id}
                accessibilityLabel={item.accessibleLabel}
                accessibilityState={{ selected: on }}
                accessibilityHint={label}
                onPress={() => onPress(item.id)}
                style={[
                  styles.count,
                  { backgroundColor: controlFill },
                  on
                    ? {
                        backgroundColor: HUE_WASH[item.hue],
                        borderColor: hue,
                      }
                    : undefined,
                ]}
              >
                <View style={[styles.dot, { backgroundColor: hue }]} />
                <Text variant="body-sm" style={styles.label}>
                  {item.label}
                </Text>
                <Text variant="body" bold style={styles.figure}>
                  {number(item.count)}
                </Text>
                <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
              </Pressable>
            );
          })}
          {SPARE_CELLS.slice(row.length - 1).map((spare) => (
            <View key={spare} style={styles.spare} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'column',
    gap: theme.spacing['sp-3'],
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  count: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-control'],
    /* The web half's inset 1.5px ring: a border kept clear at rest, so pressing moves nothing. */
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  spare: {
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius['r-pill'],
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
  figure: {
    fontVariant: ['tabular-nums'],
  },
});
