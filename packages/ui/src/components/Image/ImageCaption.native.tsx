import { theme } from '@heliogrid/theme';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Text } from '../../primitives/Text/Text.native';
import type { ImageMetaFacts } from './Image.logic';
import { imageMetaParts } from './Image.logic';
import type { ImageProps } from './Image.types';

export interface ImageCaptionProps extends ImageMetaFacts {
  caption?: string;
  density: NonNullable<ImageProps['density']>;
}

/**
 * The words under the frame: the caption, then the credit / meta / reference / age line, joined
 * by dots that are decoration. Nothing renders when there is nothing to say.
 */
export function ImageCaption({ caption, density, ...facts }: ImageCaptionProps) {
  const parts = imageMetaParts(facts);
  if (!caption && parts.length === 0) return null;
  return (
    <View style={density === 'functional' ? styles.captionFn : styles.caption}>
      {caption ? (
        <Text variant="body-sm" color="secondary">
          {caption}
        </Text>
      ) : null}
      <View style={[styles.meta, caption ? styles.metaAfterCaption : null]}>
        {parts.map((part, i) => (
          <Fragment key={part.key}>
            <Text variant="caption" color="tertiary">
              {part.text}
            </Text>
            {i < parts.length - 1 ? (
              <Text variant="caption" color="tertiary">
                ·
              </Text>
            ) : null}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { marginTop: theme.spacing['sp-2'] },
  captionFn: { marginTop: 6 },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  metaAfterCaption: { marginTop: 3 },
});
