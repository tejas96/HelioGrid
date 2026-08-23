import { theme } from '@heliogrid/theme';
import { useEffect, useState } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { imageView, isCompact } from './Image.logic';
import { IMAGE_RATIOS } from './Image.missing';
import type { ImageProps, ThumbnailProps } from './Image.types';
import { ImageCaption } from './ImageCaption.native';
import { Glyph } from './ImageMarks.native';
import { ImageMissing, ImagePhoto } from './ImageStates.native';

interface NativeImageProps extends ImageProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeThumbnailProps extends ThumbnailProps {
  style?: StyleProp<ViewStyle>;
}

/** "4 / 3" → 1.333…. A caller's own CSS ratio string is parsed the same way. */
function aspect(ratio: string): number {
  const raw = IMAGE_RATIOS[ratio] ?? ratio;
  const parts = raw.split('/');
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
  alt = '',
  status = 'auto',
  ratio = 'photo',
  width = '100%',
  height,
  fit = 'cover',
  radius,
  caption,
  credit,
  attribution,
  meta,
  staleAt,
  referenceOnly = false,
  referenceLabel = 'Reference only',
  referenceNote = 'Never measured from',
  missingReason = 'not-captured',
  missingLabel,
  missingDetail,
  onRetry,
  retryLabel = 'Try again',
  onClick,
  density = 'expressive',
  style,
}: NativeImageProps) {
  /* THE STATE BELONGS TO A SOURCE, not to the component: remembering WHICH src decoded means a
     new src is back at its skeleton with no reset effect to keep in step. */
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>(undefined);
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);
  const loaded = src !== undefined && loadedSrc === src;
  const failed = src !== undefined && failedSrc === src;

  /* THE PHOTO CREDIT IS `credit`, NOT `attribution` — that word is the system's ValueSource slot,
     and an image frame has no such fact. The old name still works and warns. */
  const who = credit ?? attribution;
  useEffect(() => {
    if (attribution !== undefined) {
      console.warn(
        'Image: `attribution` is now `credit` (who took the photograph). `attribution` is the system’s ValueSource slot — which layer supplied a value — and an image frame does not have one.',
      );
    }
  }, [attribution]);

  const { state, reason } = imageView(status, src, loaded, failed, missingReason);

  const r = radius ?? (density === 'functional' ? 12 : 20);
  const compact = isCompact(width);

  const frame: ViewStyle = {
    borderRadius: r,
    ...(height !== undefined ? { height: dim(height) } : { aspectRatio: aspect(ratio) }),
  };

  const body = (
    <View style={[{ width: dim(width) }, style]}>
      <View style={[styles.frame, frame]}>
        {state === 'missing' ? (
          <ImageMissing
            alt={alt}
            width={width}
            reason={reason}
            missingLabel={missingLabel}
            missingDetail={missingDetail}
            onRetry={onRetry}
            retryLabel={retryLabel}
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
              {compact ? 'Ref' : referenceLabel}
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
  size = 64,
  ratio = 'square',
  radius,
  density = 'functional',
  ...rest
}: NativeThumbnailProps) {
  return <Image width={size} ratio={ratio} radius={radius ?? 12} density={density} {...rest} />;
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
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
});
