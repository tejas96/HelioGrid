import { theme } from '@heliogrid/theme';
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Line,
  LinearGradient,
  Mask,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '../../primitives/Color/colors';
import { usePalette } from '../../primitives/Color/use-palette.native';
import { Text } from '../../primitives/Text/Text.native';
import { BrandGradientDefs } from '../../utils/brand-gradient.native';
import type { HeroPanelProps } from './HeroPanel.types';

const CELL = 44;

/** The glass, drawn once behind the content: its ground, the logo's light, the masked cell grid. */
function Glass({ id }: { id: string }) {
  const palette = usePalette();
  const dark = palette === theme.palettes.dark;
  const strength = dark ? [0.34, 0.42, 0.34] : [0.22, 0.24, 0.16];
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id={`${id}-ground`} x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0" stopColor={palette.panel} />
          <Stop offset="1" stopColor={palette['panel-deep']} />
        </LinearGradient>
        <RadialGradient id={`${id}-green`} cx="0.96" cy="-0.12" r="0.8">
          <Stop offset="0" stopColor={theme.brand.green} stopOpacity={strength[0]} />
          <Stop offset="0.58" stopColor={theme.brand.green} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${id}-teal`} cx="1" cy="0" r="1.1">
          <Stop offset="0" stopColor={theme.brand.teal} stopOpacity={strength[1]} />
          <Stop offset="0.62" stopColor={theme.brand.teal} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${id}-blue`} cx="0" cy="1.1" r="1">
          <Stop offset="0" stopColor={theme.brand.blue} stopOpacity={strength[2]} />
          <Stop offset="0.6" stopColor={theme.brand.blue} stopOpacity={0} />
        </RadialGradient>
        <Pattern id={`${id}-cells`} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
          <Line
            x1={0}
            y1={0.75}
            x2={CELL}
            y2={0.75}
            stroke={palette['panel-line']}
            strokeWidth={1.5}
          />
          <Line
            x1={0.75}
            y1={0}
            x2={0.75}
            y2={CELL}
            stroke={palette['panel-line']}
            strokeWidth={1.5}
          />
        </Pattern>
        <RadialGradient id={`${id}-light`} cx="0.88" cy="0" r="1">
          <Stop offset="0" stopColor={palette.panel} stopOpacity={1} />
          <Stop offset="0.38" stopColor={palette.panel} stopOpacity={0.55} />
          <Stop offset="0.72" stopColor={palette.panel} stopOpacity={0} />
        </RadialGradient>
        <Mask id={`${id}-mask`}>
          <Rect width="100%" height="100%" fill={`url(#${id}-light)`} />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id}-ground)`} />
      <Rect width="100%" height="100%" fill={`url(#${id}-blue)`} />
      <Rect width="100%" height="100%" fill={`url(#${id}-teal)`} />
      <Rect width="100%" height="100%" fill={`url(#${id}-green)`} />
      <Rect width="100%" height="100%" fill={`url(#${id}-cells)`} mask={`url(#${id}-mask)`} />
    </Svg>
  );
}

export function HeroPanel({ label, labelAside, name, children }: HeroPanelProps) {
  const id = `hg-hero-${useId().replaceAll(':', '')}`;
  return (
    <View style={styles.hero} accessibilityLabel={name ?? label} accessibilityRole="summary">
      <Glass id={id} />
      <Svg style={styles.line} width="100%" height={2}>
        <BrandGradientDefs id={`${id}-line`} />
        <Rect width="100%" height={2} fill={`url(#${id}-line)`} />
      </Svg>
      {label === undefined && labelAside === undefined ? null : (
        <View style={styles.head}>
          {label === undefined ? null : (
            <Text variant="overline" style={styles.label}>
              {label}
            </Text>
          )}
          {labelAside}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    gap: theme.spacing['sp-4'],
    padding: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-card-expressive'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    backgroundColor: colors.panel,
  },
  line: { position: 'absolute', top: 0, left: 0, right: 0 },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  label: { color: colors['on-panel-muted'] },
});
