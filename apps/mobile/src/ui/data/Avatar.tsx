import { theme } from '@heliogrid/tokens/theme';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * Perfect-circle avatar; fallback = initials on the accent-subtle tint. AvatarGroup
 * overlaps by 30% of size — the web's `0 0 0 2px var(--surface)` ring becomes a 2dp
 * surface-coloured border around each stacked avatar (RN shadows cannot draw rings).
 */

const FONT_BY_SIZE: Record<number, number> = { 24: 11, 32: 13, 40: 15, 56: 20, 80: 28 };
const RING = theme.spacing['sp-0-5'];

export interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ src, name, size = theme.spacing['sp-10'], style }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const fontSize = FONT_BY_SIZE[size] ?? Math.round(size * 0.38);
  return (
    <View
      accessible
      accessibilityLabel={name}
      style={[styles.circle, { width: size, height: size }, style]}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={styles.img}
          resizeMode="cover"
          accessibilityLabel={name}
        />
      ) : (
        <AppText
          weight="500"
          color={theme.colors.accent}
          style={{ fontSize, lineHeight: fontSize }}
        >
          {initials}
        </AppText>
      )}
    </View>
  );
}

export interface AvatarGroupProps {
  people?: readonly Omit<AvatarProps, 'size'>[];
  size?: number;
  max?: number;
}

export function AvatarGroup({
  people = [],
  size = theme.spacing['sp-8'],
  max = 4,
}: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const overlap = -Math.round(size * 0.3);
  const extraFont = Math.round(size * 0.36);
  return (
    <View style={styles.group}>
      {shown.map((p, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: stacking order is positional by nature
          key={i}
          style={[styles.ring, i > 0 && { marginLeft: overlap }]}
        >
          <Avatar {...p} size={size} />
        </View>
      ))}
      {extra > 0 && (
        <View
          accessible
          accessibilityLabel={`+${extra}`}
          style={[
            styles.ring,
            styles.extra,
            { width: size + RING * 2, height: size + RING * 2, marginLeft: overlap },
          ]}
        >
          {/* --text-primary, not the reference's --text-secondary: on --canvas-sunken that
              measures 3.89:1 and the "+N" count is meaning-bearing text at caption size, so
              it failed WCAG AA (docs/13 UXG-A11Y-01). Lockstep with packages/ui Avatar.css —
              see the longer note there. Do not "restore" the reference value. */}
          <AppText
            weight="500"
            color={theme.colors['text-primary']}
            style={{ fontSize: extraFont, lineHeight: extraFont }}
          >
            {`+${extra}`}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: theme.radius['r-pill'],
    overflow: 'hidden',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors['accent-subtle'],
  },
  img: {
    width: '100%',
    height: '100%',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  ring: {
    borderRadius: theme.radius['r-pill'],
    borderWidth: RING,
    borderColor: theme.colors.surface,
  },
  extra: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors['canvas-sunken'],
  },
});
