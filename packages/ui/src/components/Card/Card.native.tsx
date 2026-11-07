import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { FIELD_BOX_EDGE } from '../../primitives/FieldBox/FieldBox.native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Pressable`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import type { CardProps, IconCircleProps } from './Card.types';
import { CardBody } from './CardBody.native';

type NativeCardProps = CardProps & {
  style?: StyleProp<ViewStyle>;
};

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
  selected: { borderColor: colors.accent },
  /* Raised: a white card set on the page, not a tile — a page ground (`GroundProvider ground="page"`).
     Its selected ring is OUTER, as on the web; an outline draws outside the frame, so nothing
     moves. It has no edge to subtract, so the expressive card keeps the whole tile padding. */
  raised: {
    borderRadius: theme.radius['r-lg'],
    // biome-ignore lint/plugin/raw-white: panel — a card raised over the page: a page ground over the page
    backgroundColor: colors.surface,
    ...theme.elevation.e1,
  },
  raisedExpressive: { padding: theme.layout['tile-pad'] },
  raisedSelected: {
    outlineWidth: RAISED_RING,
    outlineColor: colors.accent,
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
  /* The soft tint: the colour itself at the web half's share over what holds it. */
  tint: { opacity: 0.08 },
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
  read,
  loadingLabel,
  focusAfter,
  emptyTitle,
  emptyMessage,
  emptyAction,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  onClick,
  style,
}: NativeCardProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  const ref = useRef<View>(null);
  const raised = surface === 'raised';
  const body = (
    <GroundProvider ground={raised ? 'page' : 'tile'}>
      <CardBody
        state={state}
        loadingLabel={loadingLabel}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        emptyAction={emptyAction}
        errorTitle={errorTitle}
        errorMessage={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
        focusAfter={focusAfter ?? ref}
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
        hostRef={ref}
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
  return (
    <View ref={ref} style={frame}>
      {body}
    </View>
  );
}

/**
 * Signature circular icon container — a soft tint of a semantic or brand colour over the ground
 * that holds it: the colour itself, faded, so a scheme change re-tints it with no arithmetic.
 */
export function IconCircle({
  children,
  color = colors.accent,
  size = 40,
  style,
}: NativeIconCircleProps) {
  const shape: ViewStyle = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.circle, shape, style]}>
      <View style={[StyleSheet.absoluteFill, shape, styles.tint, { backgroundColor: color }]} />
      {children}
    </View>
  );
}
