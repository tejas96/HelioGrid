import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ResolvedStep } from './resolve-steps';

interface NavButtonProps {
  direction: number;
  disabled: boolean;
  name: string;
  onPress: () => void;
}

function NavButton({ direction, disabled, name, onPress }: NavButtonProps) {
  return (
    <Pressable accessibilityLabel={name} disabled={disabled} onPress={onPress} style={styles.nav}>
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={disabled ? theme.colors['text-disabled'] : theme.colors['text-primary']}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d={direction < 0 ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </Svg>
    </Pressable>
  );
}

interface NativeStepperIndicatorProps {
  index: number;
  onOpenStepList?: () => void;
  onStepClick?: (index: number) => void;
  resolved: readonly ResolvedStep[];
  style?: StyleProp<ViewStyle>;
}

/**
 * The compact mobile bar: `‹ 3 / 9 · Panel layout ›`, with a total error count when any step has
 * one. Back is always available (M05-03), and under the default `free` mode so is Next.
 */
export function StepperIndicator({
  index,
  onOpenStepList,
  onStepClick,
  resolved,
  style,
}: NativeStepperIndicatorProps) {
  const total = resolved.length;
  const step = resolved[index];
  const next = resolved[index + 1];
  const nextReachable = next?.reachable === true;
  const errors = resolved.filter((entry) => entry.state === 'errors').length;
  return (
    <View style={[styles.bar, style]}>
      <NavButton
        direction={-1}
        disabled={index === 0 || onStepClick === undefined}
        name="Previous step"
        onPress={() => onStepClick?.(index - 1)}
      />
      {/* Web's button has no aria-label, so its name is its contents — including the "2 to fix"
          span. An explicit label here overrides the children, so the count has to be spelled into
          it or the one urgent word on this bar is announced nowhere. */}
      <Pressable
        accessibilityLabel={`${index + 1} of ${total}, ${step === undefined ? '' : step.label}${
          errors > 0 ? `, ${errors} to fix` : ''
        }`}
        disabled={onOpenStepList === undefined}
        onPress={onOpenStepList}
        style={styles.open}
      >
        <Text variant="body-sm" style={styles.count}>
          {`${index + 1} / ${total}`}
        </Text>
        <View style={styles.dotSep} />
        <Text variant="body-sm" style={styles.current}>
          {step === undefined ? '' : step.label}
        </Text>
        {errors > 0 ? (
          <Text variant="caption" color="danger" style={styles.errors}>
            {`${errors} to fix`}
          </Text>
        ) : null}
        <Svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors['text-tertiary']}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="m6 9 6 6 6-6" />
        </Svg>
      </Pressable>
      <NavButton
        direction={1}
        disabled={!nextReachable || onStepClick === undefined}
        name="Next step"
        onPress={() => onStepClick?.(index + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-pill'],
    padding: theme.spacing['sp-1'],
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  nav: {
    width: 44,
    height: 44,
    minWidth: 44,
    borderRadius: theme.radius['r-pill'],
  },
  open: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  count: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['mark-subtle'],
    flexShrink: 0,
  },
  current: {
    flexShrink: 1,
    fontSize: 14,
  },
  errors: {
    flexShrink: 0,
    fontWeight: '700',
  },
});
