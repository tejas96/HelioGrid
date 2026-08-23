/* One group of fields (native) — its heading, when it has one, and the rows under it. The grouping
   itself is `groupDiffRows`; a row's four states are `VersionDiffRow`. */

import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { DiffGroup } from './VersionDiff.resolve';
import { VersionDiffRow } from './VersionDiffRow.native';

const styles = StyleSheet.create({
  group: { gap: theme.spacing['sp-0-5'] },
  groupName: { marginTop: 6 },
});

export function VersionDiffGroup({
  group,
  beforeStamp,
  afterStamp,
  removedLabel,
  addedLabel,
}: {
  group: DiffGroup;
  beforeStamp: string;
  afterStamp: string;
  removedLabel: string;
  addedLabel?: ReactNode;
}) {
  return (
    <View style={styles.group}>
      {group.name ? (
        <Text variant="overline" color="tertiary" style={styles.groupName}>
          {group.name}
        </Text>
      ) : null}
      {group.rows.map((entry) => (
        <VersionDiffRow
          key={entry.id}
          row={entry.row}
          beforeStamp={beforeStamp}
          afterStamp={afterStamp}
          removedLabel={removedLabel}
          addedLabel={addedLabel}
        />
      ))}
    </View>
  );
}
