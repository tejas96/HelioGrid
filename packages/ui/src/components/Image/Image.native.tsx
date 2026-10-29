import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import {
  aspectRatioOf,
  IMAGE_DEFAULTS,
  imageRadiusOf,
  imageView,
  isCompact,
  THUMBNAIL_DEFAULTS,
} from './Image.logic';
import type { ImageProps, ThumbnailProps } from './Image.types';
import { ImageCaption } from './ImageCaption.native';
import { Glyph } from './ImageMarks.native';
import { ImageMissing, ImagePhoto } from './ImageStates.native';
import { usePhotoCredit } from './use-photo-credit';

interface NativeImageProps extends ImageProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeThumbnailProps extends ThumbnailProps {
  style?: StyleProp<ViewStyle>;
}

/** "4 / 3" → 1.333…. A caller's own CSS ratio string is parsed the same way. */
function aspect(ratio: string): number {
  const parts = aspectRatioOf(ratio).split('/');
  const w = Number(parts[0]);
  const h = parts[1] === undefined ? 1 : Number(parts[1]);
  return Number.isFinite(w) && Number.isFinite(h) && h !== 0 ? w / h : 4 / 3;
}

/* RN understands a number of dp or a percentage; a CSS length like "20rem" has no native meaning
   and is dropped rather than guessed at. */
function dim(v: number | string | undefined): DimensionValue | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return v;
  return v.trim().endsWith('%') ? (v.trim() as DimensionValue) : undefined;
}

/**
 * Three-state photo surface: loading · present · permanently missing, all in one footprint that is
 * fixed before anything loads. **Missing is a resting state, not an error.**
 *
 * Platform notes: `position` (CSS object-position) and `lazy` have no React Native equivalent and
 * are ignored here; RN decodes on mount, so the web half's "already-complete cached image" guard
 * is unnecessary — `onLoad` always fires.
 */
export function Image({
  src,
  alt,
  status = IMAGE_DEFAULTS.status,
  ratio = IMAGE_DEFAULTS.ratio,
  width = IMAGE_DEFAULTS.width,
  height,
  fit = IMAGE_DEFAULTS.fit,
  radius,
  caption,
  credit,
  attribution,
  meta,
  staleAt,
  referenceOnly = false,
  words,
  referenceLabel = words.referenceOnly,
  referenceNote = words.neverMeasured,
  missingReason = IMAGE_DEFAULTS.missingReason,
  missingLabel,
  missingDetail,
  onRetry,
  retryLabel,
  onClick,
  density = IMAGE_DEFAULTS.density,
  style,
}: NativeImageProps) {
  /* THE STATE BELONGS TO A SOURCE, not to the component: remembering WHICH src decoded means a
     new src is back at its skeleton with no reset effect to keep in step. */
  /* The frame holds every face, so focus lands on it once a retry has left. */
  const frameRef = useRef<View>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>(undefined);
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);
  const loaded = src !== undefined && loadedSrc === src;
  const failed = src !== undefined && failedSrc === src;

  const who = usePhotoCredit(credit, attribution);

  const { state, reason } = imageView(status, src, loaded, failed, missingReason);

  const r = imageRadiusOf(radius, density);
  const compact = isCompact(width);

  const frame: ViewStyle = {
    borderRadius: r,
    ...(height !== undefined ? { height: dim(height) } : { aspectRatio: aspect(ratio) }),
  };

  const body = (
    <View style={[{ width: dim(width) }, style]}>
      <View ref={frameRef} style={[styles.frame, frame]}>
        {state === 'missing' ? (
          <ImageMissing
            alt={alt}
            width={width}
            reason={reason}
            missingLabel={missingLabel}
            missingDetail={missingDetail}
            onRetry={onRetry}
            retryLabel={retryLabel}
            words={words}
            focusAfter={frameRef}
          />
        ) : (
          <ImagePhoto
            src={src}
            alt={alt}
            state={state}
            fit={fit}
            onLoad={() => setLoadedSrc(src)}
            onError={() => setFailedSrc(src)}
          />
        )}
        {/* The web half's inset white highlight — a masked photo, never a border. */}
        <View style={styles.sheen} importantForAccessibility="no" pointerEvents="none" />
        {referenceOnly ? (
          <View style={styles.reference}>
            <Glyph name="eye" size={13} color={theme.colors['text-secondary']} />
            <Text variant="overline" color="secondary">
              {compact ? words.referenceShort : referenceLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <ImageCaption
        caption={caption}
        density={density}
        credit={who}
        meta={meta}
        referenceOnly={referenceOnly}
        referenceNote={referenceNote}
        staleAt={staleAt}
        missing={state === 'missing'}
        words={words}
      />
    </View>
  );

  if (!onClick) return body;
  return (
    <Pressable onPress={onClick} accessibilityLabel={alt || caption} style={styles.target}>
      {body}
    </Pressable>
  );
}

/** Thumbnail — the same three states in a small square. */
export function Thumbnail({
  size = THUMBNAIL_DEFAULTS.size,
  ratio = THUMBNAIL_DEFAULTS.ratio,
  radius,
  density = THUMBNAIL_DEFAULTS.density,
  ...rest
}: NativeThumbnailProps) {
  return (
    <Image
      width={size}
      ratio={ratio}
      radius={radius ?? THUMBNAIL_DEFAULTS.radius}
      density={density}
      {...rest}
    />
  );
}

/** The same component under a name that cannot shadow a global `Image`. Prefer this. */
export const ImageFrame = Image;

const styles = StyleSheet.create({
  target: { alignItems: 'stretch', justifyContent: 'flex-start' },
  frame: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.colors['canvas-sunken'],
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
    backgroundColor: theme.colors['text-inverse'],
    opacity: 0.45,
  },
  reference: {
    position: 'absolute',
    left: theme.spacing['sp-2'],
    bottom: theme.spacing['sp-2'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: theme.spacing['sp-6'],
    paddingHorizontal: 10,
    borderRadius: theme.radius['r-pill'],
    // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
});
