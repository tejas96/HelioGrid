import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Avatar } from '../Avatar/Avatar.native';
import { initialsOf } from '../Avatar/Avatar.types';
import { Button } from '../Button/Button.native';
import type { PhotoFieldProps } from './PhotoField.types';

interface NativePhotoFieldProps extends PhotoFieldProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-4'],
    minWidth: 0,
  },
  mark: { flexShrink: 0, borderRadius: theme.radius['r-pill'] },
  /* The refusal rings the CIRCLE, not the screen — a screen-level banner would put a name that
     saved in doubt. RN cannot inset a ring, so it is a border of the same weight. */
  markError: { borderWidth: 2, borderColor: theme.colors.danger },
  /* A nameless circle is NEUTRAL: an empty tinted disc reads as a rendering fault rather than as
     "no name yet", and `F7-19` forbids inventing an image to fill it. */
  nameless: {
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  acts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minWidth: 0,
  },
  message: { flexBasis: '100%' },
});

/**
 * ONE image, captured into the circle it will live in.
 *
 * The fallback is on screen, which is what makes "optional" honest: with no photo the circle shows
 * the caller's initials, so the frame shows the exact result of not choosing one. There is no
 * `Skip` act — a photo has no gate to skip past, and a second control would invent a decision
 * nobody has to make.
 *
 * `Avatar` derives its fallback from `name`, so an EMPTY name renders an empty tinted circle. That
 * is a rendering fault rather than "no name yet", so a nameless field draws a neutral mark instead.
 */
export function PhotoField({
  label,
  src,
  name = '',
  size = 72,
  onChoose,
  onRemove,
  chooseLabel,
  replaceLabel,
  removeLabel,
  error,
  helper,
  loading = false,
  disabled = false,
  style,
}: NativePhotoFieldProps) {
  const message = error ?? helper;
  const hasPhoto = src !== undefined;
  const nameless = initialsOf(name).length === 0;

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="none"
      accessibilityLabel={label}
      // The group is named, and its parts stay individually reachable — `accessible` on a wrapper
      // holding controls folds them into one element and takes the acts out of reach.
      accessible={false}
    >
      <View style={[styles.mark, error === undefined ? undefined : styles.markError]}>
        {nameless && !hasPhoto ? (
          <View style={[styles.nameless, { width: size, height: size }]} />
        ) : (
          <Avatar src={src} name={name} size={size} />
        )}
      </View>
      <View style={styles.acts}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onChoose}
          disabled={disabled || loading || onChoose === undefined}
        >
          {hasPhoto && replaceLabel !== undefined ? replaceLabel : chooseLabel}
        </Button>
        {/* Removing destroys nothing — the file is still the person's and the initials come back —
            so it needs no confirmation (`N8`). It appears only when there is something to remove. */}
        {hasPhoto && onRemove !== undefined && removeLabel !== undefined ? (
          <Button variant="ghost" size="sm" onClick={onRemove} disabled={disabled || loading}>
            {removeLabel}
          </Button>
        ) : null}
      </View>
      {message === undefined ? null : (
        <Text
          variant="caption"
          color={error === undefined ? 'secondary' : 'danger'}
          live={error !== undefined}
          style={styles.message}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
