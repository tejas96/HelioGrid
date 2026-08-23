import { theme } from '@heliogrid/theme';
import { Image as RNImage, StyleSheet, View } from 'react-native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ImageState } from './Image.logic';
import { isCompact, missingSpec, showsMissingLabel } from './Image.logic';
import type { ImageMissingReason, ImageProps } from './Image.types';
import { Glyph, Skeleton } from './ImageMarks.native';

export interface ImageMissingProps {
  alt: string;
  width?: number | string;
  reason: ImageMissingReason;
  missingLabel?: string;
  missingDetail?: string;
  onRetry?: () => void;
  retryLabel: string;
}

/**
 * The frame's resting face: no photo, said in words. **Missing is not an error** — the two kinds
 * are different facts, so `not-captured` is neutral and permanent while `unavailable` takes the
 * warning tint and offers the retry. It fills the footprint the frame reserved, so nothing
 * reflows if a photo arrives later.
 */
export function ImageMissing({
  alt,
  width,
  reason,
  missingLabel,
  missingDetail,
  onRetry,
  retryLabel,
}: ImageMissingProps) {
  const miss = missingSpec(reason);
  const warning = miss.tone === 'warning';
  const compact = isCompact(width);
  const text = missingLabel || miss.label;
  const detail = missingDetail ?? miss.detail;
  const ink = warning ? theme.colors['warning-text'] : theme.colors['text-tertiary'];
  const labelVariant = compact ? 'caption' : 'body-sm';
  const labelColor = warning ? 'primary' : 'secondary';
  return (
    <View style={[styles.missing, warning ? styles.missingWarning : null]}>
      {/* THE NAME GOES ON THE PICTURE, NEVER ON THE PANEL. `accessible` folds its whole subtree
          into ONE element: name the panel and the 44dp retry inside it stops being reachable and
          the detail sentence is swallowed into the concatenated label. The web half's `role="img"`
          names the glyph-and-words mark; this View IS that mark, and the sentence and the retry
          stay their own elements beside it. Same name, same words, nothing folded away. */}
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={alt ? `${alt} — ${text}` : text}
        style={styles.missingMark}
      >
        <Glyph name={miss.icon} size={compact ? 20 : 24} color={ink} />
        {showsMissingLabel(width) ? (
          <Text
            variant={labelVariant}
            color={labelColor}
            align="center"
            style={styles.missingLabel}
          >
            {text}
          </Text>
        ) : null}
      </View>
      {!compact && detail ? (
        <Text variant="caption" color="tertiary" align="center" style={styles.missingDetail}>
          {detail}
        </Text>
      ) : null}
      {!compact && reason === 'unavailable' && onRetry ? (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text variant="body-sm" style={styles.retryWords}>
            {retryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface ImagePhotoProps {
  src?: string;
  alt: string;
  state: ImageState;
  fit: NonNullable<ImageProps['fit']>;
  onLoad: () => void;
  onError: () => void;
}

/**
 * The photograph, and the pulse that holds its box until it decodes — the skeleton sits under the
 * image and is revealed by its opacity, so the box is never empty.
 */
export function ImagePhoto({ src, alt, state, fit, onLoad, onError }: ImagePhotoProps) {
  return (
    <>
      {state === 'loading' ? <Skeleton /> : null}
      {src ? (
        <RNImage
          source={{ uri: src }}
          accessible={alt !== ''}
          accessibilityLabel={alt || undefined}
          resizeMode={fit}
          onLoad={onLoad}
          onError={onError}
          style={[styles.photo, { opacity: state === 'present' ? 1 : 0 }]}
        />
      ) : null}
    </>
  );
}

/** The absolute-fill four, spelled out: this RN typing does not expose `absoluteFillObject`. */
const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  photo: { ...FILL, width: '100%', height: '100%' },
  missing: {
    ...FILL,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-3'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  missingWarning: { backgroundColor: theme.colors['warning-bg'] },
  /* Same gap as the panel, so nesting the mark inside it changes nothing a sighted reader sees. */
  missingMark: { alignItems: 'center', gap: theme.spacing['sp-2'] },
  missingLabel: { fontWeight: '700', letterSpacing: -0.13 },
  missingDetail: { maxWidth: 260 },
  retry: {
    marginTop: theme.spacing['sp-0-5'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  retryWords: { fontWeight: '500' },
});
