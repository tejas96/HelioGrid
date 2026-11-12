import { theme } from '@heliogrid/theme';
import { Children, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
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
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { BrandGradientDefs } from '../../utils/brand-gradient.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { IconButton } from '../IconButton/IconButton.native';
import { Menu } from '../Menu/Menu.native';
import type { HeroPanelEdit, HeroPanelMenu, HeroPanelProps } from './HeroPanel.types';

const CELL = 44;

interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * The glass, drawn behind the content at the hero's measured size: a percentage size is read once,
 * before the content grows the card, so the glass would stop short of its foot.
 */
function Glass({ id, size }: { id: string; size: Size }) {
  const palette = usePalette();
  const dark = palette === theme.palettes.dark;
  const strength = dark ? [0.34, 0.42, 0.34] : [0.22, 0.24, 0.16];
  return (
    <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
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

/**
 * One slow band of light crosses the glass as the hero arrives, then rests (the web's
 * `.hg-hero-sweep`): a transform on the UI thread, once; nothing under reduced motion.
 */
function Sweep({ id, size }: { id: string; size: Size }) {
  const reduced = useReducedMotion();
  const travel = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const run = Animated.timing(travel, {
      toValue: 1,
      delay: theme.motion.durations.emphasised,
      duration: theme.motion.ambient.settle,
      easing: Easing.bezier(...theme.motion.easings.standard),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [reduced, travel]);
  if (reduced) return null;
  const band = size.width * 0.6;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sweep,
        {
          width: band,
          opacity: travel.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
          transform: [
            {
              translateX: travel.interpolate({
                inputRange: [0, 1],
                outputRange: [-band, size.width],
              }),
            },
          ],
        },
      ]}
    >
      <Svg width={band} height={size.height}>
        <Defs>
          <LinearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0.2">
            <Stop offset="0" stopColor={theme.brand.teal} stopOpacity={0} />
            <Stop offset="0.45" stopColor={theme.brand.teal} stopOpacity={0.16} />
            <Stop offset="0.55" stopColor={theme.brand.green} stopOpacity={0.12} />
            <Stop offset="1" stopColor={theme.brand.green} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={band} height={size.height} fill={`url(#${id}-sweep)`} />
      </Svg>
    </Animated.View>
  );
}

export function HeroPanel({ label, labelAside, name, menu, edit, children }: HeroPanelProps) {
  const corner = (menu === undefined ? 0 : 1) + (edit === undefined ? 0 : 1);
  const id = `hg-hero-${useId().replaceAll(':', '')}`;
  const [size, setSize] = useState<Size | null>(null);
  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (size?.width !== width || size?.height !== height) setSize({ width, height });
  };
  return (
    <View
      style={styles.hero}
      onLayout={measure}
      accessibilityLabel={name ?? label}
      accessibilityRole="summary"
    >
      {/* Keyed on the size: react-native-svg keeps a gradient's first geometry when only the
          size changes, so a hero whose content grows after its first layout would stop its light
          short. A new size draws the light afresh. */}
      {size === null ? null : <Glass key={`${size.width}x${size.height}`} id={id} size={size} />}
      {size === null ? null : <Sweep id={id} size={size} />}
      {size === null ? null : (
        <Svg style={styles.line} width={size.width} height={2}>
          <BrandGradientDefs id={`${id}-line`} />
          <Rect width={size.width} height={2} fill={`url(#${id}-line)`} />
        </Svg>
      )}
      <Rows corner={corner}>
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
      </Rows>
      {corner === 0 ? null : <Corner menu={menu} edit={edit} />}
    </View>
  );
}

/** The hero's rows; the first leaves the corner's controls their room, so nothing runs under them. */
function Rows({ corner, children }: { corner: number; children: ReactNode }) {
  const [first, ...rest] = Children.toArray(children);
  if (corner === 0 || first === undefined) return <>{children}</>;
  return (
    <>
      <View style={corner === 1 ? styles.reserve : styles.reserveTwo}>{first}</View>
      {rest}
    </>
  );
}

/**
 * The corner: the pencil, then the ⋯ — each in the chips' glass and hairline, so they read as
 * controls on the glass.
 */
function Corner({
  menu,
  edit,
}: {
  menu: HeroPanelMenu | undefined;
  edit: HeroPanelEdit | undefined;
}) {
  const { controlFill } = useGround();
  const glass = [styles.control, { backgroundColor: controlFill }];
  return (
    <View style={styles.corner}>
      {edit === undefined ? null : (
        <IconButton label={edit.label} onClick={edit.onPress} style={glass}>
          <ShellGlyph name="pencil" size="sm" tone="primary" />
        </IconButton>
      )}
      {menu === undefined ? null : (
        <Menu
          label={menu.label}
          items={menu.items}
          disabled={menu.disabled ?? false}
          style={glass}
        />
      )}
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
  line: { position: 'absolute', top: 0, left: 0 },
  sweep: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  label: { color: colors['on-panel-muted'] },
  reserve: { paddingRight: theme.spacing['sp-12'] },
  reserveTwo: { paddingRight: theme.spacing['sp-12'] * 2 + theme.spacing['sp-2'] },
  corner: {
    position: 'absolute',
    top: theme.spacing['sp-3'],
    right: theme.spacing['sp-3'],
    flexDirection: 'row',
    gap: theme.spacing['sp-2'],
  },
  control: {
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
});
