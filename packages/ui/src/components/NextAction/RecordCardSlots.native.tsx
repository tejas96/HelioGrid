import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { Fragment } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { Text } from '../../primitives/Text/Text.native';
import { renderMarks } from '../ChipGroup/ChipGroup.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { recordInitials } from './NextAction.initials';
import type { RecordCardProps } from './NextAction.types';

/** The card's face: the caller's `avatar`, or the initials circle in the card's tone. */
export function RecordFace({
  avatar,
  initials,
  name,
  tone,
}: Pick<RecordCardProps, 'avatar' | 'initials' | 'name'> & { tone: string }) {
  if (avatar) {
    return (
      <View
        style={styles.face}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {avatar}
      </View>
    );
  }
  return (
    <View style={styles.avatar} importantForAccessibility="no-hide-descendants">
      {/* RN has no color-mix: the 10% tint is the tone itself, at a tenth of its opacity. */}
      <View style={[styles.avatarTint, { backgroundColor: tone }]} />
      <Text variant="caption" style={[styles.avatarWords, { color: tone }]}>
        {initials || recordInitials(name)}
      </Text>
    </View>
  );
}

/**
 * Everything under the name, in order. Inline, a slot sits its own distance under the one above;
 * stacked, the card's gap spaces them. Nothing is drawn around a slot that is absent.
 */
export function RecordSlots({
  marks,
  meta,
  provenance,
  detail,
  pending,
  action,
  stacked,
}: Pick<RecordCardProps, 'marks' | 'provenance' | 'detail' | 'action'> & {
  meta: ReactNode[];
  pending: ReactNode;
  stacked: boolean;
}) {
  const spaced = (distance: ViewStyle) => (stacked ? null : distance);
  return (
    <>
      {marks ? <View style={spaced(styles.marks)}>{renderMarks(marks)}</View> : null}
      {meta.length > 0 ? (
        <View style={[styles.meta, spaced(styles.metaSpaced)]}>
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
        <View style={spaced(styles.provenance)}>{renderProvenance(provenance, { size: 12 })}</View>
      ) : null}
      {detail ? <View style={spaced(styles.action)}>{detail}</View> : null}
      {pending ? <View style={spaced(styles.action)}>{pending}</View> : null}
      {action ? <View style={[styles.actionRow, spaced(styles.action)]}>{action}</View> : null}
    </>
  );
}

const styles = StyleSheet.create({
  face: { flexShrink: 0 },
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
  marks: { marginTop: 6 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaSpaced: { marginTop: theme.spacing['sp-1'] },
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
