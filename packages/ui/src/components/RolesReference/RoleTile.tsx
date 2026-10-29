import type { TranslatedText } from '@heliogrid/contracts';
import type { ReadKind } from '@heliogrid/domain';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { IconCircle } from '../Card/Card';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { NamedGap } from '../NamedGap/NamedGap';
import { PRESET_GLYPH } from '../SettingsList/SettingsList.logic';
import { spokenName } from './RolesReference.logic';
import type { RolesReferencePreset } from './RolesReference.types';

interface RoleTileProps {
  preset: RolesReferencePreset;
  counts: ReadKind;
  countGap: TranslatedText;
  open: boolean;
  onOpen: () => void;
}

/** One role's tile: its glyph, its name and its count — the figure, its wait, or the named gap. */
export function RoleTile({ preset, counts, countGap, open, onOpen }: RoleTileProps) {
  return (
    <Pressable
      className="hg-role-tile"
      onPress={onOpen}
      accessibilityState={{ expanded: open, busy: counts === 'loading' }}
      accessibilityLabel={spokenName(preset, counts, countGap)}
    >
      <IconCircle size={36} color={open ? 'var(--accent)' : 'var(--text-secondary)'}>
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
