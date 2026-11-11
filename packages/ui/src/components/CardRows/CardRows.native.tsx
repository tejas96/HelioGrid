import { theme } from '@heliogrid/theme';
import { createContext, useContext, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import type { CardRowProps, CardRowsProps } from './CardRows.types';

const AsideRoom = createContext(0);

/**
 * The width a row's acts take at its top end, with their gap: the body's first line keeps this much
 * clear at its end, so the acts never sit on its words, and what is under that line runs beneath them.
 */
export function useCardRowAsideRoom(): number {
  return useContext(AsideRoom);
}

/** The one glass card that holds a list's rows; what sits in it takes the tile's ground. */
export function CardRows({ children }: CardRowsProps) {
  return (
    <View role="list" style={[tileSurface, styles.card]}>
      <GroundProvider ground="tile">{children}</GroundProvider>
    </View>
  );
}

/**
 * One row of the card: the body opens the record when `open` is set, and the row's own acts sit over
 * its top end, outside the target, so a screen reader reaches each on its own.
 */
export function CardRow({
  children,
  first,
  open,
  aside,
  after,
  highlighted = false,
  muted = false,
  targetRef,
}: CardRowProps) {
  const [asideWidth, setAsideWidth] = useState(0);
  const target = useRef<View>(null);
  useImperativeHandle(
    targetRef,
    () => ({ focus: () => focusScreenReaderOn(() => target.current) }),
    [],
  );
  const acts = aside === undefined || aside === null ? null : aside;
  const bodyLook = [styles.body, muted ? styles.muted : undefined];
  return (
    /* No busy state here, though the web's row says `aria-busy`: Android gives a View with no words
       of its own a spoken "busy" and never takes it back, so the row read "busy" long after its
       work; the row's own controls say busy while they work. */
    <View role="listitem" style={[styles.row, first ? undefined : styles.hairline]}>
      {highlighted ? <View style={styles.highlighted} pointerEvents="none" /> : null}
      <View style={styles.frame}>
        <AsideRoom.Provider value={acts === null ? 0 : asideWidth + theme.spacing['sp-2']}>
          {open === undefined ? (
            <View style={bodyLook}>{children}</View>
          ) : (
            <Pressable
              hostRef={target}
              accessibilityLabel={open.name}
              onPress={open.onOpen}
              style={bodyLook}
            >
              {children}
            </Pressable>
          )}
        </AsideRoom.Provider>
        {acts === null ? null : (
          <View
            style={styles.aside}
            onLayout={(event) => setAsideWidth(event.nativeEvent.layout.width)}
          >
            {acts}
          </View>
        )}
      </View>
      {after === undefined || after === null ? null : <View style={styles.after}>{after}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing['sp-1'], borderRadius: theme.radius['r-card-expressive'] },
  row: { borderRadius: theme.radius['r-tile'] },
  /* A clear line between two rows: a hairline all but vanished on the phone. */
  hairline: { borderTopWidth: 1, borderTopColor: colors['line-soft'] },
  /* The highlight inset from the row's top and bottom, as the web's: a filled row beside another
     keeps a gap and never reads as one block with it. */
  highlighted: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: theme.spacing['sp-0-5'],
    bottom: theme.spacing['sp-0-5'],
    borderRadius: theme.radius['r-tile'],
    backgroundColor: colors['accent-subtle'],
  },
  frame: { position: 'relative' },
  /* `Pressable`'s base centres a target; a row lays its parts out from the start. */
  body: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-4'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
  },
  muted: { opacity: 0.55 },
  /* Level with the body's first line, as the web's grid sets it. */
  aside: { position: 'absolute', top: theme.spacing['sp-4'], end: theme.spacing['sp-3'] },
  after: { paddingHorizontal: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-3'] },
});
