import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { ActionReasonSpec } from './ActionReason.types';

interface NativeActionReasonProps extends ActionReasonSpec {
  style?: StyleProp<ViewStyle>;
}

/* A barred circle: "not yet". Not UnavailableNote's slashed circle ("not a thing here"), not an
   exclamation — nothing has gone wrong. */
function BarredCircle({ size }: { size: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme.colors['text-tertiary']}
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="M8 12h8" />
    </Svg>
  );
}

const ALIGN: Record<'left' | 'center' | 'right', ViewStyle['justifyContent']> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

/** The precondition sentence beside a control that is off. Renders nothing without a reason. */
export function ActionReason({
  reason,
  size = 12,
  align = 'left',
  style,
}: NativeActionReasonProps) {
  if (!reason) {
    return null;
  }
  const step = Math.max(12, size);
  const words: TextStyle = { lineHeight: step * 1.45 };
  return (
    <View style={[styles.root, { justifyContent: ALIGN[align] }, style]}>
      <View style={styles.glyph}>
        <BarredCircle size={step + 1} />
      </View>
      <Text
        variant={step >= 13 ? 'body-sm' : 'caption'}
        color="secondary"
        align={align === 'left' ? 'start' : align === 'right' ? 'end' : 'center'}
        style={words}
      >
        {reason}
      </Text>
    </View>
  );
}

/** What every `disabledReason` host prop runs through: a string, a spec, or a ready node. */
export function renderActionReason(
  spec?: ReactNode | ActionReasonSpec,
  extra: Partial<ActionReasonSpec> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    return <ActionReason reason={spec} {...extra} />;
  }
  if (typeof spec !== 'object' || !('reason' in spec) || !spec.reason) {
    return null;
  }
  return <ActionReason {...spec} {...extra} />;
}

ActionReason.render = renderActionReason;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  glyph: {
    flexShrink: 0,
    marginTop: theme.spacing['sp-0-5'],
  },
});
