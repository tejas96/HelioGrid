import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import type { BoxProps, Space, StackAlign, StackJustify, StackProps } from './Box.types';

/** Spacing step → dp from the generated theme. `Record` so a new step fails to compile. */
const SPACE: Record<Space, number> = {
  '0': theme.spacing['sp-0'],
  '0-5': theme.spacing['sp-0-5'],
  '1': theme.spacing['sp-1'],
  '2': theme.spacing['sp-2'],
  '3': theme.spacing['sp-3'],
  '4': theme.spacing['sp-4'],
  '5': theme.spacing['sp-5'],
  '6': theme.spacing['sp-6'],
  '8': theme.spacing['sp-8'],
  '10': theme.spacing['sp-10'],
  '12': theme.spacing['sp-12'],
  '16': theme.spacing['sp-16'],
  '20': theme.spacing['sp-20'],
  '24': theme.spacing['sp-24'],
};

const ALIGN: Record<StackAlign, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

const JUSTIFY: Record<StackJustify, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
};

interface NativeBoxProps extends BoxProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeStackProps extends StackProps {
  style?: StyleProp<ViewStyle>;
}

function paddingStyle({ padding, paddingX, paddingY }: BoxProps): ViewStyle {
  const resolved: ViewStyle = {};
  if (padding !== undefined) {
    resolved.padding = SPACE[padding];
  }
  if (paddingX !== undefined) {
    resolved.paddingHorizontal = SPACE[paddingX];
  }
  if (paddingY !== undefined) {
    resolved.paddingVertical = SPACE[paddingY];
  }
  return resolved;
}

/** Layout block. Spacing comes from the scale — theme dp values, never raw numbers. */
export function Box({ children, padding, paddingX, paddingY, style }: NativeBoxProps) {
  return <View style={[paddingStyle({ padding, paddingX, paddingY }), style]}>{children}</View>;
}

/** Box with flow: direction, scale-stepped gap, alignment. */
export function Stack({
  children,
  padding,
  paddingX,
  paddingY,
  direction = 'column',
  gap,
  align,
  justify,
  wrap = false,
  style,
}: NativeStackProps) {
  const flow: ViewStyle = {
    flexDirection: direction,
    ...(gap !== undefined ? { gap: SPACE[gap] } : {}),
    ...(align !== undefined ? { alignItems: ALIGN[align] } : {}),
    ...(justify !== undefined ? { justifyContent: JUSTIFY[justify] } : {}),
    ...(wrap ? { flexWrap: 'wrap' as const } : {}),
  };
  return (
    <View style={[paddingStyle({ padding, paddingX, paddingY }), flow, style]}>{children}</View>
  );
}
