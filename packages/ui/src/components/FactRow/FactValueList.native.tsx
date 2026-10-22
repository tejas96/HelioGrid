import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

/** A row's list: one line each when stacked, else joined on the line with the middle dot. */
export function valueList(
  items: ReactNode[] | null,
  stacked: boolean,
  words: (node: ReactNode) => ReactNode,
  join: ReactNode,
  lineGap: number,
): ReactNode {
  if (items === null || items.length === 0) return null;
  if (stacked) {
    return (
      <View style={{ rowGap: lineGap }}>
        {items.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: items are positional; a caller's list has no ids
          <Fragment key={i}>{words(item)}</Fragment>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.joined}>
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: items are positional; a caller's list has no ids
        <Fragment key={i}>
          {i > 0 ? join : null}
          {words(item)}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  joined: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
});
