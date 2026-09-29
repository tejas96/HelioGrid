import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { GroundProvider } from '../Ground/Ground.native';
import type { Ground } from '../Ground/Ground.types';
import type {
  Density,
  Elevation,
  SurfaceBackground,
  SurfaceProps,
  SurfaceRadius,
} from './Surface.types';

/** RN-shaped shadow sets from the generated theme; e0 is flat (null in the theme). */
const ELEVATION: Record<Elevation, ViewStyle | undefined> = {
  e0: undefined,
  e1: theme.elevation.e1,
  e2: theme.elevation.e2,
  e3: theme.elevation.e3,
  e4: theme.elevation.e4,
  e5: theme.elevation.e5,
};

/** Radius resolves through the density mode: expressive r-*, functional rf-*. */
const RADIUS: Record<Density, Record<SurfaceRadius, number>> = {
  expressive: {
    xs: theme.radius['r-xs'],
    sm: theme.radius['r-sm'],
    md: theme.radius['r-md'],
    lg: theme.radius['r-lg'],
    xl: theme.radius['r-xl'],
  },
  functional: {
    xs: theme.radius['rf-xs'],
    sm: theme.radius['rf-sm'],
    md: theme.radius['rf-md'],
    lg: theme.radius['rf-lg'],
    xl: theme.radius['rf-xl'],
  },
};

const BACKGROUND: Record<SurfaceBackground, string> = {
  surface: theme.colors.surface,
  'surface-alt': theme.colors['surface-alt'],
  canvas: theme.colors.canvas,
  'canvas-sunken': theme.colors['canvas-sunken'],
};

/** The ground each background IS, so a control inside takes the opposite (`F7-15`). */
const GROUND: Record<SurfaceBackground, Ground> = {
  surface: 'page',
  'surface-alt': 'page',
  canvas: 'tile',
  'canvas-sunken': 'tile',
};

interface NativeSurfaceProps extends SurfaceProps {
  style?: StyleProp<ViewStyle>;
}

/** Elevation, density-resolved radius and background — all values from the theme — and the ground it is. */
export function Surface({
  children,
  elevation = 'e0',
  radius,
  density = 'expressive',
  background = 'surface',
  style,
}: NativeSurfaceProps) {
  const shape: ViewStyle = {
    backgroundColor: BACKGROUND[background],
    ...(radius !== undefined ? { borderRadius: RADIUS[density][radius] } : {}),
  };
  return (
    <View style={[shape, ELEVATION[elevation], style]}>
      <GroundProvider ground={GROUND[background]}>{children}</GroundProvider>
    </View>
  );
}
