import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { IconCircle } from '../Card/Card.native';
import { renderMarks } from '../ChipGroup/ChipGroup.native';
import { renderGap } from '../NamedGap/NamedGap.native';
import { renderPending } from '../PendingAction/PendingAction.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { renderAttribution } from '../ValueSource/ValueSource.native';
import { isPendingInFlight } from './ListRow.pending';
import type { ListRowProps } from './ListRow.types';

interface NativeListRowProps extends ListRowProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * List row: circular leading, two-line text, provenance slot, trailing action. No divider lines —
 * rows separate by luminance and gap.
 *
 * Platform mapping: the web half lifts on hover, which a touch screen has no state for, so the
 * row's resting edge is the whole of its treatment here, and the pressed transform is the touch
 * feedback.
 *
 * `aria-busy` MAPS TO `accessibilityState.busy`, AND IT GOES ON THE NODE THAT IS THE ACCESSIBILITY
 * ELEMENT. The web half puts `aria-busy` on the row container; here the row container is a
 * pressable when `onClick` is given, so the state sits on that pressable, with `busy` announced
 * alongside the row's own name. It is NOT set on the plain-`View` row: a `View` with neither
 * `accessible` nor a role is not an accessibility element at all, so the attribute would be inert
 * — present in the source and announced nowhere — and making the wrapper `accessible` to fix that
 * would fold the row's children into one element and take `trailing`'s 44dp control out of reach.
 * A row with no `onClick` has no element of its own to carry the state (the control that fired the
 * act lives in `trailing` and is the caller's), and there the `PendingAction` line is the whole
 * answer: it renders as a polite live region and names the act in words.
 *
 * AND IT GOES THROUGH THE PRIMITIVE. This row used to reach past `Pressable` to RN's own, on the
 * stated ground that the primitive "carries only `disabled` in its accessibility state" — no longer
 * true: `PressableAccessibilityState` carries `busy` alongside `disabled`, `selected`, `checked`
 * and `expanded`, and the primitive maps it to `accessibilityState` on this half and to `aria-*` on
 * the web one. Going through it also restores the 44dp floor and the single pressed treatment from
 * the one place that owns them, instead of this file re-declaring both.
 */
export function ListRow({
  icon,
  iconColor = theme.colors.accent,
  avatar,
  title,
  subtitle,
  gap,
  marks,
  provenance,
  attribution,
  pending,
  trailing,
  density = 'expressive',
  onClick,
  style,
}: NativeListRowProps) {
  const isExpr = density === 'expressive';
  const gapNode = renderGap(gap, { scale: 'field' });
  const prov = renderProvenance(provenance, { size: 12 });
  const attr = renderAttribution(attribution, { size: 12 });
  const pend = renderPending(pending);

  const body: ReactNode = (
    <>
      {avatar ||
        (icon ? (
          <IconCircle color={iconColor} size={isExpr ? 40 : 32}>
            {icon}
          </IconCircle>
        ) : null)}
      <View style={styles.bodyColumn}>
        <Text variant={isExpr ? 'body' : 'body-sm'} style={styles.title}>
          {title}
        </Text>
        {gapNode ? (
          <View style={styles.gap}>{gapNode}</View>
        ) : subtitle ? (
          <Text variant="body-sm" color="secondary">
            {subtitle}
          </Text>
        ) : null}
        {marks ? <View style={styles.marks}>{renderMarks(marks)}</View> : null}
        {attr ? <View style={styles.line}>{attr}</View> : null}
        {prov ? <View style={styles.line}>{prov}</View> : null}
        {pend ? <View style={styles.marks}>{pend}</View> : null}
      </View>
      {trailing}
    </>
  );

  const frame = [styles.row, isExpr ? styles.expressive : styles.functional, style];
  if (!onClick) return <View style={frame}>{body}</View>;
  return (
    /* No `accessibilityRole`: the primitive's own default IS `button` (Pressable.types.ts), which
       is the same word the web half's clickable row carries, so neither half writes it twice. */
    <Pressable
      accessibilityState={{ busy: isPendingInFlight(pending) }}
      onPress={onClick}
      style={frame}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    backgroundColor: 'transparent',
    minWidth: MIN_TOUCH_TARGET,
  },
  /* The 6/10dp paddings have no step on the 4dp scale — they are the DS's own row rhythm. */
  expressive: {
    minHeight: theme.spacing['sp-16'],
    paddingVertical: 10,
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-md'],
  },
  functional: {
    minHeight: 44,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-md'],
  },
  bodyColumn: { flex: 1, minWidth: 0 },
  title: { fontWeight: '700', letterSpacing: -0.15 },
  gap: { marginTop: 1 },
  marks: { marginTop: theme.spacing['sp-1'] },
  line: { marginTop: theme.spacing['sp-0-5'] },
});
