import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { closingPress, type FocusHandle } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import type { PhotoRemoval } from './PhotoField.logic';
import { actLabel, drawsNamelessMark, isDesktopComposition, removalOf } from './PhotoField.logic';
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
  wide: { gap: theme.spacing['sp-6'] },
  mark: { flexShrink: 0, borderRadius: theme.radius['r-pill'], overflow: 'hidden' },
  /* The photo is being written: the web half sweeps a shimmer; RN has no CSS gradient loop, so the
     circle rests dimmed until the write answers. */
  waiting: { opacity: 0.5 },
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
  column: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 240,
    minWidth: 0,
    alignItems: 'flex-start',
    gap: theme.spacing['sp-3'],
  },
  across: { flexBasis: '100%', minWidth: 0 },
});

interface ActsProps {
  icon: NonNullable<PhotoFieldProps['actIcon']>;
  label: TranslatedText;
  onChoose?: () => void;
  /** Given only when a photo is chosen. */
  removal: PhotoRemoval | null;
  inert: boolean;
}

function Acts({ icon, label, onChoose, removal, inert }: ActsProps) {
  // *Remove* goes away once pressed: the focus stays in the group, on the act that takes its place.
  const chooseRef = useRef<FocusHandle>(null);
  return (
    <View style={styles.acts}>
      <Button
        ref={chooseRef}
        variant="secondary"
        size="md"
        icon={<ShellGlyph name={icon} size="md" tone="primary" />}
        onClick={onChoose}
        disabled={inert || onChoose === undefined}
      >
        {label}
      </Button>
      {/* Removing destroys nothing — the file is still the person's and the initials come back —
          so it needs no confirmation (`N8`). It appears only when there is something to remove. */}
      {removal !== null ? (
        <Button
          variant="ghost"
          size="md"
          onClick={closingPress(chooseRef)(removal.remove)}
          disabled={inert}
        >
          {removal.label}
        </Button>
      ) : null}
    </View>
  );
}

/**
 * ONE image, captured into the circle it will live in.
 *
 * The fallback is on screen, which is what makes "optional" honest: with no photo the circle shows
 * the caller's initials, so the frame shows the exact result of not choosing one. There is no
 * `Skip` act — a photo has no gate to skip past, and a second control would invent a decision
 * nobody has to make. Nothing drags on a phone, so `onDrop` is not read here.
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
  actIcon = 'camera',
  error,
  errorTitle,
  helper,
  loading = false,
  disabled = false,
  style,
}: NativePhotoFieldProps) {
  const hasPhoto = src !== undefined;
  const wide = isDesktopComposition(size);

  const circle = drawsNamelessMark(src, name) ? (
    <View style={[styles.nameless, { width: size, height: size }]} />
  ) : (
    <Avatar src={src} name={name} size={size} />
  );
  const banner =
    error === undefined ? null : (
      <Banner kind="validation" title={errorTitle}>
        {error}
      </Banner>
    );
  const acts = (
    <Acts
      icon={actIcon}
      label={actLabel(hasPhoto, chooseLabel, replaceLabel)}
      onChoose={onChoose}
      removal={removalOf(hasPhoto, onRemove, removeLabel)}
      inert={disabled || loading}
    />
  );
  const message =
    helper === undefined ? null : (
      <Text variant="caption" color="secondary" style={wide ? undefined : styles.across}>
        {helper}
      </Text>
    );

  return (
    <View
      style={[styles.row, wide ? styles.wide : undefined, style]}
      accessibilityRole="none"
      accessibilityLabel={label}
      // The group is named, and its parts stay individually reachable — `accessible` on a wrapper
      // holding controls folds them into one element and takes the acts out of reach.
      accessible={false}
    >
      <View style={[styles.mark, loading ? styles.waiting : undefined]}>{circle}</View>
      {wide ? (
        <View style={styles.column}>
          {banner}
          {acts}
          {message}
        </View>
      ) : (
        <>
          {acts}
          {banner === null ? null : <View style={styles.across}>{banner}</View>}
          {message}
        </>
      )}
    </View>
  );
}
