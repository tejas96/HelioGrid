import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Card } from '../Card/Card.native';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { RollingNumber } from '../RollingNumber/RollingNumber.native';
import { type ForecastRow, forecastRowsOf } from './OwnerDashboard.forecast';
import type { DashboardPartProps } from './OwnerDashboard.logic';
import { ForecastTile } from './WonCard.native';

/** The chart's first hues, in the order the stages take them. */
const HUE = [colors['chart-1'], colors['chart-2'], colors['chart-3']] as const;

function RowFace({ row }: { row: ForecastRow }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: HUE[row.hue] }]} />
      <View style={styles.words}>
        <Text variant="body-sm" bold>
          {row.name}
        </Text>
        <Text variant="mono" color="secondary">
          {row.line}
        </Text>
      </View>
      <Text variant="mono">{row.expected}</Text>
    </View>
  );
}

/**
 * The forecast on the phone (`M13-03`, `T-M13-007`): the expected figure with its tier, the count
 * behind it, one bar split by stage and a row per stage. Expected, never promised, never added to
 * won. An api built before proposals sends no forecast: the card is then the honest gap.
 */
export function ForecastCard({ view, words, onForecastStage }: DashboardPartProps) {
  const format = useFormat();
  const { forecast } = view;
  if (forecast === undefined) return <ForecastTile words={words} />;
  const rows = forecastRowsOf(forecast, words, format);
  return (
    <Card tile="glass">
      <View
        style={styles.body}
        accessibilityLabel={words.forecastTitle}
        role="region"
        collapsable={false}
      >
        <View style={styles.head}>
          <Text variant="overline" color="secondary">
            {words.forecastTitle}
          </Text>
          <ProvenanceTier tier={forecast.tier} />
        </View>
        <View style={styles.figure}>
          <RollingNumber value={format.moneyPlain(forecast.expected)} variant="figure" />
          <Text variant="body-sm" color="secondary">
            {words.forecastFrom(forecast.count)}
          </Text>
        </View>
        {rows.length === 0 ? null : (
          <>
            <View
              style={styles.bar}
              accessibilityRole="image"
              accessibilityLabel={words.forecastBarName}
            >
              {rows.map((row) => (
                <View
                  key={row.key}
                  style={[styles.part, { flexGrow: row.weight, backgroundColor: HUE[row.hue] }]}
                />
              ))}
            </View>
            <View>
              {rows.map((row) =>
                onForecastStage === undefined ? (
                  <RowFace key={row.key} row={row} />
                ) : (
                  <Pressable key={row.key} onPress={() => onForecastStage(row.key)}>
                    <RowFace row={row} />
                  </Pressable>
                ),
              )}
            </View>
          </>
        )}
        <View style={styles.note}>
          <ShellGlyph name="info" size="sm" tone="secondary" />
          <Text variant="caption" color="secondary" style={styles.noteWords}>
            {words.forecastHonest}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  figure: { gap: theme.spacing['sp-1'] },
  bar: {
    flexDirection: 'row',
    gap: theme.spacing['sp-0-5'],
    height: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    overflow: 'hidden',
  },
  part: { flexBasis: 0, minWidth: theme.spacing['sp-1'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: 44,
    paddingVertical: theme.spacing['sp-2'],
  },
  dot: {
    width: theme.spacing['sp-2'],
    height: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  words: { flex: 1, minWidth: 0 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  noteWords: { flex: 1, minWidth: 0 },
});
