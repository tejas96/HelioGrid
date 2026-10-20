import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Svg } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';

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
  label: string;
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

interface MapControlsProps {
  zoom?: number;
  minZoom: number;
  maxZoom: number;
  showZoomLevel: boolean;
  onStepZoom: (delta: number) => void;
  onRecenter?: (info: { zoom?: number }) => void;
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
}: MapControlsProps) {
  return (
    <View style={styles.controls}>
      <View style={styles.group}>
        <Ctrl
          label={zoom === undefined ? 'Zoom in' : `Zoom in — level ${zoom}`}
          onPress={() => onStepZoom(1)}
          disabled={zoom !== undefined && zoom >= maxZoom}
          glyph="plus"
        />
        <Ctrl
          label={zoom === undefined ? 'Zoom out' : `Zoom out — level ${zoom}`}
          onPress={() => onStepZoom(-1)}
          disabled={zoom !== undefined && zoom <= minZoom}
          glyph="minus"
        />
      </View>
      {showZoomLevel && zoom !== undefined ? (
        <View style={styles.level}>
          <Text variant="mono" color="secondary" style={styles.levelText}>
            {`Zoom ${zoom}`}
          </Text>
        </View>
      ) : null}
      {onRecenter === undefined ? null : (
        <View style={styles.group}>
          <Ctrl
            label="Recentre — keeps this zoom"
            onPress={() => onRecenter({ zoom })}
            glyph="recentre"
          />
        </View>
      )}
    </View>
  );
}
