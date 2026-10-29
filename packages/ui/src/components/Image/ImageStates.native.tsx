import { theme } from '@heliogrid/theme';
import { Image as RNImage, StyleSheet, View } from 'react-native';
import { GroundProvider } from '../../primitives/Ground/Ground.native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Text } from '../../primitives/Text/Text.native';
import { RetryButton } from '../Button/RetryButton.native';
import type { ImageState } from './Image.logic';
import { missingFaceOf } from './Image.logic';
import type { ImageMissingProps, ImageProps } from './Image.types';
import { Glyph, Skeleton } from './ImageMarks.native';

/**
 * The frame's resting face: no photo, said in words. **Missing is not an error** — the two kinds
 * are different facts, so `not-captured` is neutral and permanent while `unavailable` takes the
 * warning tint and offers the retry. It fills the footprint the frame reserved, so nothing
 * reflows if a photo arrives later.
 */
export function ImageMissing({ onRetry, retryLabel, focusAfter, ...missing }: ImageMissingProps) {
  const face = missingFaceOf(missing);
  const warning = face.tone === 'warning';
  const ink = warning ? theme.colors['warning-text'] : theme.colors['text-secondary'];
  const labelVariant = face.compact ? 'caption' : 'body-sm';
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
        accessibilityLabel={face.name}
        style={styles.missingMark}
      >
        <Glyph name={face.icon} size={face.glyphSize} color={ink} />
        {face.showsLabel ? (
          <Text
            variant={labelVariant}
            color={labelColor}
            align="center"
            style={styles.missingLabel}
          >
            {face.label}
          </Text>
        ) : null}
      </View>
      {face.detail === undefined ? null : (
        <Text variant="caption" color="secondary" align="center" style={styles.missingDetail}>
          {face.detail}
        </Text>
      )}
      {face.offersRetry ? (
        /* A tinted panel holds its retry as a tile does — see `Ground.css`. */
        <GroundProvider ground="tile">
          <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
        </GroundProvider>
      ) : null}
    </View>
  );
}

export interface ImagePhotoProps {
  src?: string;
  alt?: string;
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
          accessible={Boolean(alt)}
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
});
