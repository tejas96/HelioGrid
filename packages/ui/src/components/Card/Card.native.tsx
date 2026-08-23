import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Pressable`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { CardProps, IconCircleProps } from './Card.types';
import { CardBody } from './CardBody.native';

interface NativeCardProps extends CardProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeIconCircleProps extends IconCircleProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    /* The web ring is a box-shadow; RN has none, so the ring is a border that is always present
       and only changes colour — the frame must not move between selected and unselected. */
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: theme.colors.accent },
  expressive: {
    borderRadius: theme.radius['r-card-expressive'],
    padding: theme.spacing['sp-6'],
  },
  functional: {
    borderRadius: theme.radius['r-card-functional'],
    padding: theme.spacing['sp-4'],
  },
  /* Pressable centres its children for icon targets; a card stretches them instead. */
  pressableReset: { alignItems: 'stretch', justifyContent: 'flex-start', width: '100%' },
  circle: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

/** Floating white card. Ships loading / empty / error / unavailable, like every surface (law 1). */
export function Card({
  children,
  density = 'expressive',
  interactive = false,
  selected = false,
  state = 'ready',
  emptyTitle,
  emptyMessage = 'Nothing here yet.',
  emptyAction,
  errorTitle = "Couldn't load this",
  errorMessage = 'Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'Not available here',
  unavailableMessage,
  onClick,
  style,
}: NativeCardProps) {
  const body = (
    <CardBody
      state={state}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      emptyAction={emptyAction}
      errorTitle={errorTitle}
      errorMessage={errorMessage}
      onRetry={onRetry}
      unavailableTitle={unavailableTitle}
      unavailableMessage={unavailableMessage}
    >
      {children}
    </CardBody>
  );

  const frame: StyleProp<ViewStyle> = [
    styles.card,
    density === 'functional' ? styles.functional : styles.expressive,
    selected ? styles.selected : null,
    /* Hover has no touch equivalent; e2 at rest, and Pressable owns the pressed feedback. */
    theme.elevation.e2,
    style,
  ];

  if (onClick !== undefined || interactive) {
    return (
      <Pressable style={[styles.pressableReset, frame]} onPress={onClick}>
        {body}
      </Pressable>
    );
  }
  return <View style={frame}>{body}</View>;
}

/** Mixes a 6% tint of `color` over white — the web half's `color-mix(in srgb, c 6%, white)`. */
function tint6(color: string): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  const packed = hex?.[1];
  if (packed === undefined) return theme.colors.surface;
  const value = Number.parseInt(packed, 16);
  const mix = (channel: number) => Math.round(channel * 0.06 + 255 * 0.94);
  const r = mix((value >> 16) & 255);
  const g = mix((value >> 8) & 255);
  const b = mix(value & 255);
  return `rgb(${r},${g},${b})`;
}

/**
 * Signature circular icon container — a soft 6% tint of a semantic/brand colour. `color` must be
 * a resolved theme value on native (there are no CSS custom properties to dereference).
 */
export function IconCircle({
  children,
  color = theme.colors.accent,
  size = 40,
  style,
}: NativeIconCircleProps) {
  const shape: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: tint6(color),
  };
  return <View style={[styles.circle, shape, style]}>{children}</View>;
}
