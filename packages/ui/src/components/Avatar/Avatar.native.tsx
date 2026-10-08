import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import type { AvatarGroupProps, AvatarProps } from './Avatar.types';
import { initialsOf, initialsSize, keyedAvatars, overflowSize } from './Avatar.types';

interface NativeAvatarProps extends AvatarProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeAvatarGroupProps extends AvatarGroupProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors['accent-subtle'],
  },
  initials: {
    fontFamily: theme.type.families.sans,
    fontWeight: '500',
    color: theme.colors.accent,
  },
  image: { width: '100%', height: '100%' },
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

/** Perfect-circle avatar. Fallback = initials on a soft brand tint. */
export function Avatar({ src, name = '', size = 40, style }: NativeAvatarProps) {
  const circle: ViewStyle = { width: size, height: size, borderRadius: size / 2 };
  const type: TextStyle = { fontSize: initialsSize(size) };
  return (
    <View style={[styles.avatar, circle, style]}>
      {src !== undefined ? (
        <Image accessibilityLabel={name} source={{ uri: src }} style={styles.image} />
      ) : (
        // The initials keep their drawn size: grown by the system text size they overflow the
        // fixed circle and are clipped to an arc.
        <Text allowFontScaling={false} style={[styles.initials, type]}>
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

/** Overlapping avatar group with a 2px ring in the ground; the stack overlaps 30% of the diameter. */
export function AvatarGroup({ people = [], size = 32, max = 4, style }: NativeAvatarGroupProps) {
  const { ground } = useGround();
  const shown = keyedAvatars(people.slice(0, max));
  const extra = people.length - shown.length;
  const ring: ViewStyle = { borderRadius: (size + 4) / 2, borderColor: ground };
  const pill: ViewStyle = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.group, style]}>
      {shown.map(({ key, person }, index) => (
        <View key={key} style={[styles.ring, ring, index > 0 ? { marginLeft: -size * 0.3 } : null]}>
          <Avatar {...person} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View
          style={[
            styles.overflow,
            styles.ring,
            pill,
            { marginLeft: -size * 0.3, borderColor: ground },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: overflowSize(size) }]}>{`+${extra}`}</Text>
        </View>
      ) : null}
    </View>
  );
}
