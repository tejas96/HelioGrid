import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Svg } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { zoomStepsOf } from './MapSurface.logic';
import type { MapControlsProps } from './MapSurface.types';

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    top: theme.spacing['sp-3'],
    right: theme.spacing['sp-3'],
    zIndex: 2,
    alignItems: 'flex-end',
    gap: theme.spacing['sp-2'],
  },
  group: {
    overflow: 'hidden',
    borderRadius: theme.radius['r-md'],
    // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e3,
  },
  ctrl: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  level: {
    paddingVertical: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  levelText: { fontWeight: '700' },
});

interface CtrlProps {
  label: TranslatedText;
  onPress: () => void;
  glyph: ShellGlyphName;
  disabled?: boolean;
}

function Ctrl({ label, onPress, glyph, disabled = false }: CtrlProps) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} disabled={disabled} style={styles.ctrl}>
      <Icon
        size="md"
        color={disabled ? theme.colors['text-disabled'] : theme.colors['text-primary']}
      >
        <Svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ShellGlyphMarks name={glyph} />
        </Svg>
      </Icon>
    </Pressable>
  );
}

/**
 * The 44px controls. The level is legible on the surface — "Zoom 20" is a fact a surveyor
 * checks, not chrome — and re-centre hands the current level back rather than changing it.
 */
export function MapControls({
  zoom,
  minZoom,
  maxZoom,
  showZoomLevel,
  onStepZoom,
  onRecenter,
  words,
}: MapControlsProps) {
  return (
    <View style={styles.controls}>
      <View style={styles.group}>
        {zoomStepsOf(zoom, minZoom, maxZoom, words).map((step) => (
          <Ctrl
            key={step.glyph}
            label={step.label}
            onPress={() => onStepZoom(step.delta)}
            disabled={step.disabled}
            glyph={step.glyph}
          />
        ))}
      </View>
      {showZoomLevel && zoom !== undefined ? (
        <View style={styles.level}>
          <Text variant="mono" color="secondary" style={styles.levelText}>
            {words.zoomLevel(zoom)}
          </Text>
        </View>
      ) : null}
      {onRecenter === undefined ? null : (
        <View style={styles.group}>
          <Ctrl label={words.recentre} onPress={() => onRecenter({ zoom })} glyph="recentre" />
        </View>
      )}
    </View>
  );
}
