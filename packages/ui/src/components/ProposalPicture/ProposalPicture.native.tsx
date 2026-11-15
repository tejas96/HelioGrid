import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';
import { PictureShade } from './PictureShade.native';
import type { ProposalPictureProps } from './ProposalPicture.types';
import { pictureSource } from './picture-files.native';

interface NativeProposalPictureProps extends ProposalPictureProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * A proposal picture filling the box its caller gives it. Decoration, so a screen reader passes it
 * by; with no file to draw, the sky colour under it shows. Words over it are the caller's, in the
 * fixed white ink (`PICTURE_INK`): a photograph does not follow the scheme.
 */
export function ProposalPicture({
  name,
  src,
  shade = 'none',
  children,
  style,
}: NativeProposalPictureProps) {
  const source =
    src === undefined ? (name === undefined ? undefined : pictureSource(name)) : { uri: src };
  return (
    <View style={[styles.box, style]}>
      {source === undefined ? null : (
        <Image
          source={source}
          resizeMode="cover"
          accessible={false}
          importantForAccessibility="no"
          style={styles.file}
        />
      )}
      {shade === 'none' ? null : <PictureShade shade={shade} />}
      {children === undefined ? null : <View style={styles.over}>{children}</View>}
    </View>
  );
}

/** The ink words on a picture take, in light and dark alike. */
export const PICTURE_INK: string = theme.palettes.light['text-inverse'];

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    backgroundColor: theme.palettes.light['brand-ocean'],
  },
  over: { flex: 1 },
  /* A bundled picture carries its own size, which `Image` applies before this style, so the
     edges alone leave it at 612 × 820: the size states the box to fill. */
  file: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
});
