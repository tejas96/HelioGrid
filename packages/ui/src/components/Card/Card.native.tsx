import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { FIELD_BOX_EDGE } from '../../primitives/FieldBox/FieldBox.native';
import { GroundProvider, tileSurface, useGround } from '../../primitives/Ground/Ground.native';
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

/** The raised card's selected ring — the web half's `0 0 0 2px var(--accent)`. */
const RAISED_RING = 2;

const styles = StyleSheet.create({
  card: {
    /* The tile's look is `tileSurface` (`F7-49`). The web ring is an inset box-shadow; RN has none,
       so the ring is the field's inset edge, always present and only changing colour — the frame
       must not move between selected and unselected. */
    borderWidth: FIELD_BOX_EDGE,
    borderColor: 'transparent',
  },
  selected: { borderColor: theme.colors.accent },
  /* Raised: a white card set on the page, not a tile — a page ground (`GroundProvider ground="page"`).
     Its selected ring is OUTER, as on the web; an outline draws outside the frame, so nothing
     moves. It has no edge to subtract, so the expressive card keeps the whole tile padding. */
  raised: {
    borderRadius: theme.radius['r-lg'],
    // biome-ignore lint/plugin/raw-white: panel — a card raised over the page: a page ground over the page
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  raisedExpressive: { padding: theme.layout['tile-pad'] },
  raisedSelected: {
    outlineWidth: RAISED_RING,
    outlineColor: theme.colors.accent,
    outlineStyle: 'solid',
  },
  /* The edge sits inside the tile's padding, so the words start where the web's do. */
  expressive: {
    borderRadius: theme.radius['r-tile'],
    padding: theme.layout['tile-pad'] - FIELD_BOX_EDGE,
  },
  functional: {
    borderRadius: theme.radius['r-card-functional'],
    padding: theme.spacing['sp-4'],
  },
  /* Pressable centres its children for icon targets; a card stretches them instead. */
  pressableReset: { alignItems: 'stretch', justifyContent: 'flex-start', width: '100%' },
  circle: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

/**
 * The tile (`F7-49`): one record, grey on the white page, no shadow; a control inside it turns
 * white. `surface="raised"` is the white card set on the page instead. Ships loading / empty /
 * error / unavailable, like every surface (law 1).
 */
export function Card({
  children,
  density = 'expressive',
  interactive = false,
  selected = false,
  surface = 'tile',
  label,
  state = 'ready',
  emptyTitle,
  emptyMessage = 'Nothing here yet.',
  emptyAction,
  errorTitle = "Couldn't load this",
  errorMessage = 'Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  retryLabel,
  unavailableTitle = 'Not available here',
  unavailableMessage,
  onClick,
  style,
}: NativeCardProps) {
  const raised = surface === 'raised';
  const body = (
    <GroundProvider ground={raised ? 'page' : 'tile'}>
      <CardBody
        state={state}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        emptyAction={emptyAction}
        errorTitle={errorTitle}
        errorMessage={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
      >
        {children}
      </CardBody>
    </GroundProvider>
  );

  const frame: StyleProp<ViewStyle> = [
    raised ? null : tileSurface,
    raised ? null : styles.card,
    density === 'functional' ? styles.functional : styles.expressive,
    raised ? styles.raised : null,
    raised && density !== 'functional' ? styles.raisedExpressive : null,
    selected ? (raised ? styles.raisedSelected : styles.selected) : null,
    /* Hover has no touch equivalent; Pressable owns the pressed feedback. */
    style,
  ];

  /* `label` names the card as one control and puts its selected state on that node — the DS's
     opt-in. Without it the pressable is the unnamed one it always was. */
  if (onClick !== undefined || interactive) {
    return (
      <Pressable
        style={[styles.pressableReset, frame]}
        onPress={onClick}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={label !== undefined ? { current: selected } : undefined}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={frame}>{body}</View>;
}

/** A `#rrggbb` theme value as its three channels, or `undefined` for anything else. */
function channels(color: string): [number, number, number] | undefined {
  const packed = /^#([0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (packed === undefined) return undefined;
  const value = Number.parseInt(packed, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * Mixes a 6% tint of `color` over `ground` — the web half's
 * `color-mix(in srgb, c 6%, var(--hg-ground))`.
 */
function tint6(color: string, ground: string): string {
  const tint = channels(color);
  const under = channels(ground);
  if (tint === undefined || under === undefined) return ground;
  const mix = (channel: number, beneath: number) => Math.round(channel * 0.06 + beneath * 0.94);
  return `rgb(${mix(tint[0], under[0])},${mix(tint[1], under[1])},${mix(tint[2], under[2])})`;
}

/**
 * Signature circular icon container — a soft 6% tint of a semantic/brand colour over the ground
 * that holds it. `color` must be a resolved theme value on native (there are no CSS custom
 * properties to dereference).
 */
export function IconCircle({
  children,
  color = theme.colors.accent,
  size = 40,
  style,
}: NativeIconCircleProps) {
  const { ground } = useGround();
  const shape: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: tint6(color, ground),
  };
  return <View style={[styles.circle, shape, style]}>{children}</View>;
}
