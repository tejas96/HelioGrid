import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { Fragment } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextColor } from '../../primitives/Text/Text.types';
import { renderActorClass } from '../ActorClass/ActorClass.native';
import { renderMarks } from '../ChipGroup/ChipGroup.native';
import { renderOverride } from '../FieldOverride/FieldOverride.native';
import { isPendingInFlight } from '../ListRow/ListRow.pending';
import { renderPending } from '../PendingAction/PendingAction.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { recordInitials } from './NextAction.initials';
import type { NextActionProps, NextActionTone, RecordCardProps } from './NextAction.types';

interface NativeNextActionProps extends NextActionProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeRecordCardProps extends RecordCardProps {
  style?: StyleProp<ViewStyle>;
}

/* EVERY WARNING MARK TAKES warning-text: `warning` itself clears no contrast floor anywhere. */
const DOT: Record<NextActionTone, string> = {
  due: theme.colors['success-text'],
  overdue: theme.colors['danger-text'],
  soon: theme.colors['warning-text'],
  scheduled: theme.colors.accent,
  snoozed: theme.colors['text-tertiary'],
  done: theme.colors['text-tertiary'],
};

/**
 * "What happens next" — a muted semantic dot plus plain text. `tone="overdue"` is the only case
 * that turns red, which is what keeps red meaningful; snoozed records go tertiary rather than
 * disappearing. Same words, same order and same two attribution slots as the web half.
 */
export function NextAction({
  label,
  meta,
  tone = 'due',
  muted = false,
  origin,
  correction,
  size = 13,
  style,
}: NativeNextActionProps) {
  const color: TextColor =
    tone === 'overdue' ? 'danger' : muted || tone === 'snoozed' ? 'tertiary' : 'primary';
  const stacked = Boolean(origin) || Boolean(correction);
  const words: TextStyle = { fontSize: size };
  return (
    <View style={[stacked ? styles.stacked : styles.inline, style]}>
      <View style={styles.line}>
        <View style={[styles.dot, { backgroundColor: DOT[tone] }]} importantForAccessibility="no" />
        <Text variant="body-sm" color={color} style={words}>
          {`${label}${meta ? ` · ${meta}` : ''}`}
        </Text>
      </View>
      {/* The origin sits under the task, indented to the WORDS rather than to the dot. */}
      {origin ? (
        <View style={styles.indent}>{renderActorClass(origin, { form: 'origin', size: 12 })}</View>
      ) : null}
      {correction ? <View style={styles.indent}>{renderOverride(correction)}</View> : null}
    </View>
  );
}

/**
 * The phone form of a table row: initials circle, name + chip, mono meta, next action.
 *
 * Platform mapping: the web half's absolutely-positioned sibling button exists because an HTML
 * control may not nest inside a `role="button"`. React Native has no such rule — a nested
 * Pressable in `action` swallows its own touch — so the card IS the Pressable here, and a control
 * in a slot still fires only itself. The raised hover/focus state has no touch equivalent; the
 * Pressable primitive's pressed state is the feedback.
 */
export function RecordCard({
  name,
  initials,
  avatarTone = theme.colors.accent,
  chip,
  marks,
  meta = [],
  action,
  onClick,
  ariaLabel,
  provenance,
  pending,
  muted = false,
  density = 'expressive',
  style,
}: NativeRecordCardProps) {
  const ini = initials || recordInitials(name);
  const pend = renderPending(pending);

  const body: ReactNode = (
    <>
      <View style={styles.avatar} importantForAccessibility="no-hide-descendants">
        {/* RN has no color-mix: the 10% tint is the tone itself, at a tenth of its opacity. */}
        <View style={[styles.avatarTint, { backgroundColor: avatarTone }]} />
        <Text variant="caption" style={[styles.avatarWords, { color: avatarTone }]}>
          {ini}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.head}>
          <Text variant="body" style={styles.name}>
            {name}
          </Text>
          {chip}
        </View>
        {marks ? <View style={styles.marks}>{renderMarks(marks)}</View> : null}
        {meta.length > 0 ? (
          <View style={styles.meta}>
            {meta.map((m, i) => (
              /* `meta` is a fixed positional list of caller nodes with no identity of their
                 own — it is never reordered, filtered or keyed by the caller. */
              // biome-ignore lint/suspicious/noArrayIndexKey: positional list, never reordered.
              <Fragment key={`meta-${i}`}>
                {i > 0 ? (
                  <Text variant="mono" style={styles.metaSep}>
                    ·
                  </Text>
                ) : null}
                <Text variant="mono" color="secondary" style={styles.metaWords}>
                  {m}
                </Text>
              </Fragment>
            ))}
          </View>
        ) : null}
        {provenance ? (
          <View style={styles.provenance}>{renderProvenance(provenance, { size: 12 })}</View>
        ) : null}
        {pend ? <View style={styles.action}>{pend}</View> : null}
        {action ? <View style={[styles.action, styles.actionRow]}>{action}</View> : null}
      </View>
    </>
  );

  const frame = [
    styles.card,
    density === 'functional' ? styles.functional : styles.expressive,
    muted ? styles.muted : null,
    style,
  ];
  if (!onClick) return <View style={frame}>{body}</View>;
  return (
    /* AN ACT IN FLIGHT IS SAID, NOT ONLY DRAWN (F7-12). The web half puts `aria-busy` on the card;
       here the card IS the target, so `busy` rides the primitive's `accessibilityState` and is
       announced beside the record's name. A card with no `onClick` has no element of its own to
       carry it — a `View` with neither `accessible` nor a role is not an accessibility element, so
       the state would be present in the source and announced nowhere — and there the `PendingAction`
       line is the whole answer: it is a live region and it names the act in words. */
    <Pressable
      onPress={onClick}
      accessibilityLabel={ariaLabel || name}
      accessibilityState={{ busy: isPendingInFlight(pending) }}
      style={frame}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  stacked: { flexDirection: 'column', alignItems: 'flex-start', gap: theme.spacing['sp-1'] },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minWidth: 0,
  },
  dot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  indent: { paddingLeft: 14 },

  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    minHeight: 44,
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  expressive: {
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
  functional: {
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-card-functional'],
  },
  /* `muted` is PARKED, and it is never the pending treatment. */
  muted: { opacity: 0.6 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 },
  avatarWords: { fontWeight: '700', letterSpacing: 0.24 },
  body: { flex: 1, minWidth: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  name: { fontWeight: '700', letterSpacing: -0.15 },
  marks: { marginTop: 6 },
  meta: {
    marginTop: theme.spacing['sp-1'],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaWords: { fontSize: theme.type.roles.caption.fontSize },
  /* The middot is a MARK, not a word: mark-subtle sits on WCAG's 3:1 non-text floor. */
  metaSep: { color: theme.colors['mark-subtle'], fontSize: theme.type.roles.caption.fontSize },
  provenance: { marginTop: 6 },
  action: { marginTop: theme.spacing['sp-2'] },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
