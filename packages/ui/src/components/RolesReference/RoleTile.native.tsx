import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { IconCircle } from '../Card/Card.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { PRESET_GLYPH } from '../SettingsList/SettingsList.logic';
import { spokenName } from './RolesReference.logic';
import type { RolesReferenceCounts, RolesReferencePreset } from './RolesReference.types';

interface RoleTileProps {
  preset: RolesReferencePreset;
  counts: RolesReferenceCounts;
  countGap: string;
  open: boolean;
  onOpen: () => void;
}

/** One role's tile: its glyph, its name and its count — the figure, its wait, or the named gap. */
export function RoleTile({ preset, counts, countGap, open, onOpen }: RoleTileProps) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityState={{ expanded: open, busy: counts === 'loading' }}
      accessibilityLabel={spokenName(preset, counts, countGap)}
      style={[tileSurface, styles.tile, open ? styles.open : undefined]}
    >
      <GroundProvider ground="tile">
        <IconCircle size={36} color={open ? theme.colors.accent : theme.colors['text-secondary']}>
          <ShellGlyph
            name={PRESET_GLYPH[preset.value]}
            size="md"
            tone={open ? 'accent' : 'secondary'}
          />
        </IconCircle>
        <Text variant="body" bold>
          {preset.name}
        </Text>
        <Count preset={preset} counts={counts} countGap={countGap} />
      </GroundProvider>
    </Pressable>
  );
}

function Count({
  preset,
  counts,
  countGap,
}: Pick<RoleTileProps, 'preset' | 'counts' | 'countGap'>) {
  /* Inside the button, which carries the wait in its name: the bar is decoration. */
  if (counts === 'loading') return <LoadingBars bars={['count']} inBusyRegion />;
  if (counts === 'failed' || preset.count === null) {
    return <NamedGap gap={countGap} scale="cell" />;
  }
  return (
    <Text variant="caption" color="secondary">
      {preset.count}
    </Text>
  );
}

/* The board's tile height, so a two-line name and a one-line name stand level. */
const TILE_MIN_HEIGHT = 104;

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: TILE_MIN_HEIGHT,
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
    padding: theme.layout['tile-pad'],
    borderRadius: theme.radius['r-tile'],
  },
  open: { backgroundColor: theme.colors['accent-subtle'] },
});
