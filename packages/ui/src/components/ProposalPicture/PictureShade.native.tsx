import { theme } from '@heliogrid/theme';
import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { ProposalPictureShade } from './ProposalPicture.types';

/* A photograph does not follow the scheme: its shade is the light palette's ink in light and dark. */
const INK = theme.palettes.light.ink;

/** The shade's stops, top to bottom: where on the picture, and how much ink. */
const STOPS: Record<
  Exclude<ProposalPictureShade, 'none'>,
  readonly (readonly [number, number])[]
> = {
  cover: [
    [0, 0.5],
    [0.17, 0],
    [0.42, 0],
    [0.68, 0.72],
    [1, 0.94],
  ],
  foot: [
    [0, 0],
    [0.3, 0],
    [1, 0.85],
  ],
};

/** The shade words on a picture sit on — the web half's gradient, drawn as one vector fill. */
export function PictureShade({ shade }: { shade: Exclude<ProposalPictureShade, 'none'> }) {
  const id = useId();
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {STOPS[shade].map(([offset, opacity]) => (
            <Stop key={offset} offset={offset} stopColor={INK} stopOpacity={opacity} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
