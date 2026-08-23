/* VersionDiff (native) — ONE THING AT TWO TIMES. Same four states, same per-side tiers, same
   change note, same counted collapse. It commits nothing on either platform: the accept and the
   cancel belong to the surface that owns the write.

   The web half's `aria-expanded` maps to `accessibilityState={{ expanded }}` on the Pressable.

   The same decomposition as the web half: `VersionDiffHeader` says who the two versions are,
   `VersionDiffGroup` renders one heading's rows, `VersionDiffRow` renders one field's four states,
   and `VersionDiff.resolve` — shared by both halves — does the naming, keying and grouping. */

import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import {
  diffSummary,
  groupDiffRows,
  resolveDiffEntries,
  resolveDiffRow,
  resolveDiffSides,
} from './VersionDiff.resolve';
import type { VersionDiffProps } from './VersionDiff.types';
import { VersionDiffGroup } from './VersionDiffGroup.native';
import { VersionDiffHeader } from './VersionDiffHeader.native';

const styles = StyleSheet.create({
  root: { gap: theme.spacing['sp-3'], minWidth: 0 },
  changeNote: {
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['surface-alt'],
  },
  toggleRow: { flexDirection: 'row' },
  /* The floor and the centring are the primitive's; only the bleed either side is this row's. */
  toggle: {
    paddingHorizontal: 14,
    marginHorizontal: -14,
  },
  toggleWord: { fontWeight: '500', color: theme.colors.accent },
});

interface NativeVersionDiffProps extends VersionDiffProps {
  style?: StyleProp<ViewStyle>;
}

export function VersionDiff({
  caption,
  before = {},
  after = {},
  rows = [],
  changeNote,
  changeNoteLabel = 'What changed and why',
  showUnchanged: showUnchangedProp,
  removedLabel = 'Not in this version',
  addedLabel,
  mode = 'versions',
  emptyMessage = 'Nothing changed between these two versions.',
  style,
}: NativeVersionDiffProps) {
  const sides = resolveDiffSides(before, after, mode);
  const resolved = resolveDiffEntries(rows);
  const [openUnchanged, setOpenUnchanged] = useState(Boolean(showUnchangedProp));
  const show = showUnchangedProp === undefined ? openUnchanged : showUnchangedProp;
  const moved = resolved.filter((r) => r.state !== 'unchanged');
  const unchanged = resolved.filter((r) => r.state === 'unchanged');
  const groups = groupDiffRows(show ? resolved : moved);

  return (
    /* THE PAIR IS ALREADY SPOKEN, SO IT IS NOT SAID TWICE. The web half's `<section aria-label>`
       names a landmark; RN has none, and `VersionDiffHeader` — the first thing in this View —
       states the caption, both side labels and the counts line. On a bare View the label announced
       nothing at all; announcing it would repeat the header, and `accessible` would fold every
       field row and the unchanged toggle into one element. So the dead label goes. */
    <View style={[styles.root, style]}>
      <VersionDiffHeader
        caption={caption}
        sides={sides}
        summary={diffSummary(resolved.map((r) => r.state))}
      />

      {/* The change note is M06-42's own requirement — a version without one is not a version. */}
      {changeNote ? (
        <View style={styles.changeNote}>
          <Text variant="overline" color="tertiary">
            {changeNoteLabel}
          </Text>
          <Text variant="body-sm">{changeNote}</Text>
        </View>
      ) : null}

      {moved.length === 0 && !show ? (
        <Text variant="body-sm" color="secondary">
          {emptyMessage}
        </Text>
      ) : (
        groups.map((g) => (
          <VersionDiffGroup
            key={g.name || g.rows[0]?.id}
            group={g}
            beforeStamp={sides.beforeStamp}
            afterStamp={sides.afterStamp}
            removedLabel={removedLabel}
            addedLabel={addedLabel}
          />
        ))
      )}

      {/* Unchanged is a state, so it is counted and reachable — never silently dropped. The
          expanded state goes through the primitive, which is also where the 44px floor and the
          pressed treatment come from. */}
      {unchanged.length > 0 && showUnchangedProp === undefined ? (
        <View style={styles.toggleRow}>
          <Pressable
            accessibilityState={{ expanded: show }}
            onPress={() => setOpenUnchanged((o) => !o)}
            style={styles.toggle}
          >
            <Text variant="body-sm" style={styles.toggleWord}>
              {`${show ? 'Hide' : 'Show'} ${unchanged.length} unchanged field${
                unchanged.length === 1 ? '' : 's'
              }`}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

VersionDiff.resolveRow = resolveDiffRow;
