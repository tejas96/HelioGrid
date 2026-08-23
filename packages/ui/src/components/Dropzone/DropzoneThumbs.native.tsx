import { theme } from '@heliogrid/theme';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { DropzoneFile } from './Dropzone.types';
import { FileGlyph } from './DropzoneGlyphs.native';

const THUMB = 84;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-3'],
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: theme.radius['r-sm'],
    overflow: 'hidden',
    backgroundColor: theme.colors['canvas-sunken'],
  },
  image: { width: '100%', height: '100%' },
  glyph: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: theme.spacing['sp-1'],
    right: theme.spacing['sp-1'],
    bottom: theme.spacing['sp-1'],
    height: 4,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
  /* 44dp target around the 28dp circle — the two-rectangles rule. The overhang is deliberate. */
  remove: { position: 'absolute', top: -4, right: -4, width: 44, height: 44 },
  removeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
});

interface DropzoneThumbsProps {
  files: DropzoneFile[];
  onRemove?: (file: DropzoneFile, index: number) => void;
}

/** The captured files, and a 44dp remove target around a 28dp circle. */
export function DropzoneThumbs({ files, onRemove }: DropzoneThumbsProps) {
  return (
    <View style={styles.grid}>
      {files.map((file, index) => (
        <View key={file.id ?? file.name ?? index} style={styles.thumb}>
          {file.url === undefined ? (
            <View style={styles.glyph}>
              <FileGlyph />
            </View>
          ) : (
            <Image
              accessibilityLabel={file.name ?? 'Uploaded photo'}
              source={{ uri: file.url }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          {file.progress !== undefined && file.progress < 100 ? (
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${Math.max(0, Math.min(100, file.progress))}%` }]}
              />
            </View>
          ) : null}
          {onRemove === undefined ? null : (
            <Pressable
              accessibilityLabel={`Remove ${file.name ?? 'photo'}`}
              onPress={() => onRemove(file, index)}
              style={styles.remove}
            >
              <View style={styles.removeCircle}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6 6 18M6 6l12 12"
                    stroke={theme.colors['text-secondary']}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}
