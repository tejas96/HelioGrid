/* One row of an authored order (native) — its position, the caller's body over the compliance floor
   that qualifies the WHOLE row, and the three targets that change the order. */

import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { ComplianceFloorSpec } from '../ComplianceFloor';
import { renderComplianceFloor } from '../ComplianceFloor/ComplianceFloor.native';
import { ReorderControl } from './ReorderControls.native';
import type { MoveDirection } from './ReorderList.defaults';
import { deleteLabel, moveLabel, positionLabel } from './ReorderList.defaults';
import type { ControlSuffix } from './ReorderList.focus';
import type { ReorderListDensity } from './ReorderList.types';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    ...theme.elevation.e1,
  },
  rowStack: { alignItems: 'flex-start' },
  position: { flexShrink: 0, width: 22 },
  positionDigit: { fontFamily: theme.type.families.mono },
  positionStack: { paddingTop: theme.spacing['sp-3'] },
  body: { flex: 1, minWidth: 0, gap: theme.spacing['sp-2'] },
  controls: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-0-5'] },
  controlsStack: { flexDirection: 'column' },
});

/** The row's own density scale. The list reads `gap` off it so the rhythm between rows matches the
 *  padding inside them, and the empty message sits on the same vertical step. */
export const REORDER_PADS = {
  expressive: { padding: 14, gap: 10, radius: theme.radius['r-md'] },
  functional: {
    padding: 10,
    gap: theme.spacing['sp-2'],
    radius: theme.radius['r-card-functional'],
  },
};

interface ReorderRowProps {
  index: number;
  total: number;
  /** The row's name — said in every button label. */
  name: string;
  /** The caller's fields, or the row's name when it renders none. */
  body: ReactNode;
  /** A row protected by law renders its floor here and has no delete button. */
  lock: ComplianceFloorSpec | ReactNode | null;
  deletable: boolean;
  stack: boolean;
  density: ReorderListDensity;
  flashing: boolean;
  /** Fired when the flash has finished, so the list can put the row back to `surface`. */
  onFlashEnd: () => void;
  onMove: (dir: MoveDirection) => void;
  onDelete: () => void;
  registerControl: (suffix: ControlSuffix, node: View | null, enabled: boolean) => void;
}

/* RN HAS NO `onTransitionEnd`, and the web half's clear is tied to the END OF THE FLASH rather
   than to a clock: `.hg-reorder-row` transitions its background over --dur-emphasised and the row
   reports the moment that transition finishes. So the tie is kept rather than approximated — the
   same duration and easing run through Animated over the same two colours, and `onFlashEnd` is
   that animation's own completion callback. A bare setTimeout would fire at the right instant over
   a background that had already snapped, and the moved row's accent would otherwise stay lit for
   good, reading as a selection that cannot be dismissed. Colour cannot ride the native driver, so
   this one animation runs on the JS driver. */
function useFlashFade(flashing: boolean, onFlashEnd: () => void) {
  const value = useRef(new Animated.Value(flashing ? 1 : 0)).current;
  useEffect(() => {
    const fade = Animated.timing(value, {
      toValue: flashing ? 1 : 0,
      duration: theme.motion.durations.emphasised,
      easing: Easing.bezier(...theme.motion.easings.standard),
      useNativeDriver: false,
    });
    /* `finished` is false when the cleanup below stops a fade mid-flight — a row whose flash was
       taken over by another row must not clear the flash that moved on. */
    fade.start(({ finished }) => {
      if (finished && flashing) {
        onFlashEnd();
      }
    });
    return () => fade.stop();
  }, [flashing, value, onFlashEnd]);
  return value.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surface, theme.colors['accent-subtle']],
  });
}

export function ReorderRow({
  index,
  total,
  name,
  body,
  lock,
  deletable,
  stack,
  density,
  flashing,
  onFlashEnd,
  onMove,
  onDelete,
  registerControl,
}: ReorderRowProps) {
  const pads = REORDER_PADS[density];
  const backgroundColor = useFlashFade(flashing, onFlashEnd);
  return (
    <Animated.View
      style={[
        styles.row,
        { padding: pads.padding, borderRadius: pads.radius, backgroundColor },
        stack ? styles.rowStack : null,
      ]}
    >
      {/* The position is a fact a sighted reader gets from the order and a screen-reader user
          does not, so it is stated once per row rather than only on move — AND IT CARRIES ITS
          DENOMINATOR. "1" alone is not the fact; "1 of 5" is. RN has no visually-hidden node, so
          the digit is drawn and the whole sentence is this node's accessible name, which is the
          same split the web half makes with `.hg-reorder-sr`. */}
      <View
        accessible
        accessibilityLabel={positionLabel(index, total)}
        style={[styles.position, stack ? styles.positionStack : null]}
      >
        <Text variant="caption" color="tertiary" style={styles.positionDigit}>
          {`${index + 1}`}
        </Text>
      </View>
      <View style={styles.body}>
        {body}
        {/* The floor's declared slot: its own line under the row's body. */}
        {renderComplianceFloor(lock)}
      </View>
      <View style={[styles.controls, stack ? styles.controlsStack : null]}>
        <ReorderControl
          kind="up"
          disabled={index === 0}
          onPress={() => onMove('up')}
          controlRef={(node) => registerControl('up', node, index !== 0)}
          label={moveLabel(name, 'up', index, total)}
        />
        <ReorderControl
          kind="down"
          disabled={index === total - 1}
          onPress={() => onMove('down')}
          controlRef={(node) => registerControl('down', node, index !== total - 1)}
          label={moveLabel(name, 'down', index, total)}
        />
        {deletable ? (
          <ReorderControl
            kind="delete"
            tone="danger"
            onPress={onDelete}
            controlRef={(node) => registerControl('delete', node, true)}
            label={deleteLabel(name, index, total)}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}
