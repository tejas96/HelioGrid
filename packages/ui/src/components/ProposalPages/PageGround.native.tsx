import { theme } from '@heliogrid/theme';
import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { DEEP_GROUND, mixHex } from '../ProposalBlocks/block-ink.native';

const LIGHT = theme.palettes.light;
const TEAL_LIGHT: string = mixHex(LIGHT['brand-teal'], LIGHT.ink, 0.72);
const BLUE_LIGHT: string = mixHex(LIGHT['brand-blue'], LIGHT.ink, 0.72);

/**
 * The deep page's ground: its deep colour under two soft lights, teal from the top corner and blue
 * from the foot — the web half's two radial gradients, drawn as one vector fill behind the page.
 */
export function DeepGround() {
  const teal = useId();
  const blue = useId();
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <RadialGradient id={teal} cx="100%" cy="0%" rx="90%" ry="60%" fx="100%" fy="0%">
          <Stop offset="0" stopColor={TEAL_LIGHT} stopOpacity={1} />
          <Stop offset="0.6" stopColor={TEAL_LIGHT} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={blue} cx="0%" cy="100%" rx="80%" ry="60%" fx="0%" fy="100%">
          <Stop offset="0" stopColor={BLUE_LIGHT} stopOpacity={1} />
          <Stop offset="0.62" stopColor={BLUE_LIGHT} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={DEEP_GROUND} />
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${teal})`} />
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${blue})`} />
    </Svg>
  );
}
