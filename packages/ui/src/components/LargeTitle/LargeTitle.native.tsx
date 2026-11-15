import { theme } from '@heliogrid/theme';
import { useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import type { LargeTitleProps } from './LargeTitle.types';

export function LargeTitle({ title, summary, titleRef, nameTitle, acts }: LargeTitleProps) {
  const heading = useRef<View>(null);
  useImperativeHandle(titleRef, () => ({
    focus: () => focusScreenReaderOn(() => heading.current),
  }));
  return (
    <View style={styles.head}>
      <View style={styles.row}>
        <View ref={heading} accessible accessibilityRole="header" style={styles.name}>
          <Text variant="display" twoLines={nameTitle}>
            {title}
          </Text>
        </View>
        {acts === undefined ? null : <View style={styles.acts}>{acts}</View>}
      </View>
      {summary === undefined ? null : (
        <Text variant="body" color="secondary">
          {summary}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { gap: theme.spacing['sp-2'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  name: { flex: 1, minWidth: 0 },
  acts: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});
