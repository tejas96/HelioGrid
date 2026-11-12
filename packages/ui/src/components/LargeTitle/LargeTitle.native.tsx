import { theme } from '@heliogrid/theme';
import { useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import type { LargeTitleProps } from './LargeTitle.types';

export function LargeTitle({ title, summary, titleRef, nameTitle }: LargeTitleProps) {
  const heading = useRef<View>(null);
  useImperativeHandle(titleRef, () => ({
    focus: () => focusScreenReaderOn(() => heading.current),
  }));
  return (
    <View style={styles.head}>
      <View ref={heading} accessible accessibilityRole="header">
        <Text variant="display" twoLines={nameTitle}>
          {title}
        </Text>
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
});
