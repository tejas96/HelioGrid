import type { TranslatedText } from '@heliogrid/contracts';
import type { ReadKind } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { IconCircle } from '../Card/Card.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { PRESET_GLYPH } from '../SettingsList/SettingsList.logic';
import { spokenName } from './RolesReference.logic';
import type { RolesReferencePreset } from './RolesReference.types';

interface RoleTileProps {
  preset: RolesReferencePreset;
  /** The card's first row draws no hairline above it. */
  first: boolean;
  counts: ReadKind;
  countGap: TranslatedText;
  open: boolean;
  onOpen: () => void;
}

/**
 * One role's row in the roles card: its glyph, its name and its count — the figure, its wait, or
 * the named gap. The web draws it as a tile in a wide room; the phone's room is always narrow.
 */
export function RoleTile({ preset, first, counts, countGap, open, onOpen }: RoleTileProps) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityState={{ expanded: open, busy: counts === 'loading' }}
      accessibilityLabel={spokenName(preset, counts, countGap)}
      style={[styles.row, first ? undefined : styles.after, open ? styles.open : undefined]}
    >
      <IconCircle size={36} color={open ? colors.accent : colors['text-secondary']}>
        <ShellGlyph
          name={PRESET_GLYPH[preset.value]}
          size="md"
          tone={open ? 'accent' : 'secondary'}
        />
      </IconCircle>
      <Text variant="body" bold style={styles.name}>
        {preset.name}
      </Text>
      <Count preset={preset} counts={counts} countGap={countGap} />
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  after: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors['line-soft'] },
  name: { flex: 1, minWidth: 0 },
  open: { backgroundColor: colors['accent-subtle'] },
});
