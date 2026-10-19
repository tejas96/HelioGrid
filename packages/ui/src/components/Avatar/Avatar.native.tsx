import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { avatarIris, irisTintOf } from './Avatar.logic';
import type { AvatarGroupProps, AvatarMark, AvatarProps } from './Avatar.types';
import { initialsOf, initialsSize, keyedAvatars, overflowSize } from './Avatar.types';

interface NativeAvatarProps extends AvatarProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeAvatarGroupProps extends AvatarGroupProps {
  style?: StyleProp<ViewStyle>;
}

/** The diameter when the caller names none — the web half's default too. */
const DEFAULT_SIZE = 40;

/* The mark's ring and dot, from the design system's drawing; neither is on a token scale. */
const MARK_RING = 18;
const MARK_DOT = 11;

const MARK_TONE: Record<AvatarMark, string> = {
  info: theme.colors.info,
  success: theme.colors.success,
  warning: theme.colors.warning,
  neutral: theme.colors.neutral,
};

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors['accent-subtle'],
  },
  /* A thing, not a person (`glyph`): no name to fall back to and no tint. */
  // biome-ignore lint/plugin/raw-white: illustration — a thing's disc is white on every ground, as the design system draws it
  glyph: { backgroundColor: theme.colors.surface },
  initials: {
    fontFamily: theme.type.families.sans,
    fontWeight: '500',
    color: theme.colors.accent,
  },
  /* The design system's iris weight. The theme holds no 600 weight token, so it is written as
     the number. */
  irisInitials: { fontWeight: '600' },
  image: { width: '100%', height: '100%' },
  marked: { position: 'relative', flexShrink: 0 },
  /* 2px out from the disc, in a ring of the page. */
  markRing: {
    position: 'absolute',
    right: -theme.spacing['sp-0-5'],
    bottom: -theme.spacing['sp-0-5'],
    width: MARK_RING,
    height: MARK_RING,
    borderRadius: MARK_RING / 2,
    backgroundColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDot: { width: MARK_DOT, height: MARK_DOT, borderRadius: MARK_DOT / 2 },
  group: { flexDirection: 'row', alignItems: 'center' },
  /* The web half cuts the separating ring with a box-shadow in the ground; RN has no outer ring,
     so the same 2px of ground is drawn as a border and the box grows to keep the diameter. */
  ring: { borderWidth: 2 },
  overflow: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors['canvas-sunken'],
  },
  overflowText: {
    fontFamily: theme.type.families.sans,
    fontWeight: '500',
    color: theme.colors['text-secondary'],
  },
});

/**
 * Perfect-circle avatar. Fallback = initials on a brand iris tint (`hue`, from the name by
 * default). With `mark`, the person's standing sits at the disc's foot and is not an
 * accessibility element: the words beside it already say it. Without one the disc is the whole
 * element.
 */
export function Avatar({ mark, style, ...disc }: NativeAvatarProps) {
  if (mark === undefined) return <AvatarDisc {...disc} style={style} />;
  /* Sized to the disc, so a parent that stretches its children never moves the mark off it. */
  const size = disc.size ?? DEFAULT_SIZE;
  return (
    <View style={[styles.marked, { width: size, height: size }, style]}>
      <AvatarDisc {...disc} />
      <View
        style={styles.markRing}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <View style={[styles.markDot, { backgroundColor: MARK_TONE[mark] }]} />
      </View>
    </View>
  );
}

function AvatarDisc({
  src,
  name = '',
  size = DEFAULT_SIZE,
  hue = 'auto',
  glyph,
  style,
}: Omit<NativeAvatarProps, 'mark'>) {
  const circle: ViewStyle = { width: size, height: size, borderRadius: size / 2 };
  if (glyph !== undefined && glyph !== null) {
    return <View style={[styles.avatar, styles.glyph, circle, style]}>{glyph}</View>;
  }
  const iris = avatarIris(hue, name);
  const tint = iris === null ? null : irisTintOf(iris);
  const type: TextStyle = { fontSize: initialsSize(size) };
  return (
    <View style={[styles.avatar, circle, tint ? { backgroundColor: tint.bg } : null, style]}>
      {src !== undefined ? (
        <Image accessibilityLabel={name} source={{ uri: src }} style={styles.image} />
      ) : (
        // The initials keep their drawn size: grown by the system text size they overflow the
        // fixed circle and are clipped to an arc.
        <Text
          allowFontScaling={false}
          style={[
            styles.initials,
            type,
            tint ? styles.irisInitials : null,
            tint ? { color: tint.fg } : null,
          ]}
        >
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

/** Overlapping avatar group with a 2px ring in the ground (or `ring`); the stack overlaps 30%. */
export function AvatarGroup({
  people = [],
  size = 32,
  max = 4,
  ring,
  style,
}: NativeAvatarGroupProps) {
  const { ground } = useGround();
  const ringColour = ring ?? ground;
  const shown = keyedAvatars(people.slice(0, max));
  const extra = people.length - shown.length;
  const edge: ViewStyle = { borderRadius: (size + 4) / 2, borderColor: ringColour };
  const pill: ViewStyle = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.group, style]}>
      {shown.map(({ key, person }, index) => (
        <View key={key} style={[styles.ring, edge, index > 0 ? { marginLeft: -size * 0.3 } : null]}>
          <Avatar {...person} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View
          style={[
            styles.overflow,
            styles.ring,
            pill,
            { marginLeft: -size * 0.3, borderColor: ringColour },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: overflowSize(size) }]}>{`+${extra}`}</Text>
        </View>
      ) : null}
    </View>
  );
}
