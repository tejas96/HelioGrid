import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { Provenance } from '../Provenance/Provenance.native';
import { UsageMeter } from '../UsageMeter/UsageMeter.native';
import type { BillingHomeProps, BillingUsageView } from './BillingHome.types';

type Words = BillingHomeProps['words'];

/** SCR-M12-04's meters, nearest a limit first, with where the counts and the limits come from. */
export function BillingUsage({
  usage,
  words,
  onAllUsage,
}: {
  usage: BillingUsageView;
  words: Words;
  onAllUsage: (() => void) | undefined;
}) {
  return (
    <Block
      style={styles.flushRegion}
      density="expressive"
      title={words.usageThisCycle}
      action={
        <Button
          variant="ghost"
          size="sm"
          iconRight={<ShellGlyph name="chevron-right" size="sm" tone="secondary" />}
          disabled={onAllUsage === undefined}
          {...(onAllUsage === undefined ? {} : { onClick: onAllUsage })}
        >
          {words.allUsage}
        </Button>
      }
      footer={
        <View style={styles.sources}>
          {usage.sources.map((source) => (
            <Provenance key={source} source={source} size={12} />
          ))}
        </View>
      }
    >
      <View style={styles.meters}>
        {usage.meters.map((meter) => (
          <View key={meter.key} style={styles.meterTile}>
            <GroundProvider ground="tile">
              <UsageMeter
                label={meter.label}
                words={words.usageMeter}
                value={meter.value}
                limit={meter.limit}
                {...(meter.unit === null ? {} : { unit: meter.unit })}
                density="expressive"
                form="tile"
                glyph={meter.glyph}
              />
            </GroundProvider>
          </View>
        ))}
      </View>
    </Block>
  );
}

const styles = StyleSheet.create({
  /* A region under the hero stands on the page's own edges, as the web's does. */
  flushRegion: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: theme.spacing['sp-2'] },
  /* The meters as small tiles, two to a row on a phone: the figure stands over its denominator,
     which wraps under it in a narrow tile rather than running into its edge. */
  meters: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.layout['tile-gap'] },
  meterTile: {
    ...tileSurface,
    flexGrow: 1,
    flexBasis: theme.spacing['sp-24'] + theme.spacing['sp-12'],
    padding: theme.layout['tile-pad'],
    borderRadius: theme.radius['r-tile'],
  },
  sources: { gap: theme.spacing['sp-0-5'] },
});
