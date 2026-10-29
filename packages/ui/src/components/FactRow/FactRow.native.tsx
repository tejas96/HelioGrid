import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { renderGap } from '../NamedGap/NamedGap.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import {
  contentSignature,
  FACT_DASH,
  FACT_JOIN,
  FACT_LEAD_BELOW,
  FACT_LONG_AT,
  FACT_MEASURE,
  flowWords,
  gapWithName,
  groupedRowShape,
  isUnderFloor,
  isWords,
  loneRowForm,
  rowShape,
  useAnswerReport,
  useFactGround,
  useGapDropsTier,
} from './FactRow.logic';
import type { FactDensity, FactInkKind, FactRowProps, FactShape } from './FactRow.types';
import {
  FACT_METRICS,
  FactMeasureProvider,
  type FactMetrics,
  LabelCell,
  MeasuredValue,
  useCharWidth,
  useRoomFit,
} from './FactRows.native';
import { valueList } from './FactValueList.native';

interface NativeFactRowProps extends FactRowProps {
  style?: StyleProp<ViewStyle>;
}

interface BodyProps extends NativeFactRowProps {
  shape: FactShape;
  items: ReactNode[] | null;
  stacked: boolean;
  hasMarkCol: boolean;
  density: FactDensity;
  ink: FactInkKind;
}

function inks(metrics: FactMetrics, ink: FactInkKind) {
  const label: TextStyle = { fontSize: metrics.labelSize, fontWeight: '500' };
  const value: TextStyle = {
    fontSize: metrics.valueSize,
    fontWeight: ink === 'inherit' ? '700' : '500',
  };
  return { label, value };
}

/** One `<dt>`/`<dd>` pair, as the phone draws it, in the shape its group or its own room decided. */
function FactRowBody(props: BodyProps) {
  const { label, value, items, stacked, mark, provenance, gap, fieldName, shape, style } = props;
  const metrics = FACT_METRICS[props.density];
  const ink = inks(metrics, props.ink);
  const gapNode = gap ? renderGap(gapWithName(gap, fieldName, label), { scale: 'field' }) : null;
  const tier = gapNode
    ? null
    : renderProvenance(provenance, { size: 12, inline: shape === 'flow' });
  const words = (node: ReactNode) =>
    isWords(node) ? (
      <Text variant={metrics.valueVariant} style={ink.value}>
        {node}
      </Text>
    ) : (
      node
    );
  const join = (
    <Text variant={metrics.valueVariant} color="secondary" style={ink.value}>
      {FACT_JOIN}
    </Text>
  );
  const list = valueList(items, stacked, words, join, metrics.lineGap);
  const content = gapNode ?? list ?? words(value);
  const labelText = (
    <Text variant="body-sm" color="secondary" style={ink.label}>
      {label}
    </Text>
  );
  const markCell = props.hasMarkCol ? (
    <View style={[styles.mark, { width: metrics.mark, height: metrics.valueLine }]}>
      {words(mark)}
    </View>
  ) : null;

  if (shape === 'flow') {
    /* ONE LINE THAT WRAPS: plain words nest in the label's line, so the value flows on from the
       word and continues under its left edge; a node value wraps as a box after the word. */
    const inline = gapNode !== null ? null : flowWords(value, items);
    return (
      <View style={[styles.line, style]}>
        {markCell}
        <View style={styles.flow}>
          {inline !== null ? (
            <Text variant="body-sm" color="secondary" style={ink.label}>
              {label}
              <Text variant={metrics.valueVariant} color="secondary" style={styles.dash}>
                {FACT_DASH}
              </Text>
              <Text variant={metrics.valueVariant} style={ink.value}>
                {inline}
              </Text>
            </Text>
          ) : (
            <>
              {labelText}
              <Text variant={metrics.valueVariant} color="secondary" style={styles.dash}>
                {FACT_DASH}
              </Text>
              {content}
            </>
          )}
          {tier ? <View style={styles.flowTier}>{tier}</View> : null}
        </View>
      </View>
    );
  }

  if (shape === 'stack') {
    return (
      <View style={[{ rowGap: metrics.lineGap }, style]}>
        <View style={styles.line}>
          {markCell}
          <View style={styles.valueColumn}>{labelText}</View>
        </View>
        <View style={styles.line}>
          {props.hasMarkCol ? <View style={{ width: metrics.mark }} /> : null}
          <View style={styles.valueColumn}>
            {content}
            {tier}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.pair, { columnGap: metrics.colGap }, style]}>
      {markCell}
      <LabelCell>{labelText}</LabelCell>
      <View style={styles.valueColumn}>
        <MeasuredValue line={metrics.valueLine}>{content}</MeasuredValue>
        {tier}
      </View>
    </View>
  );
}

/** A row on its own: it measures its own room, exactly as a group measures its rows. */
function FactRowAlone(props: NativeFactRowProps & { ink: FactInkKind }) {
  const {
    measure = FACT_MEASURE,
    leadBelow = FACT_LEAD_BELOW,
    longAt = FACT_LONG_AT,
    form: forced = 'auto',
    density = 'expressive',
    onFormChange,
  } = props;
  const { items, stacked, declaredLong } = rowShape(props, longAt);
  const room = useRoomFit(1, contentSignature([props]));
  const floor = isUnderFloor(room.width, leadBelow);
  const { lead, shape, answer } = loneRowForm({
    forced,
    declaredLong,
    floor,
    fits: room.fits,
    answered: room.answered,
    width: room.width,
    stacked,
    hasMark: Boolean(props.mark),
  });
  useAnswerReport(answer, shape, onFormChange);
  const { ch, probe } = useCharWidth(FACT_METRICS[density].valueSize);
  const { reportValue } = room;
  const measureRow = useMemo(() => ({ reportValue }), [reportValue]);
  return (
    <View style={styles.room} onLayout={room.onRoomLayout}>
      {probe}
      <View style={!lead && ch !== null ? { maxWidth: measure * ch } : undefined}>
        <FactMeasureProvider value={measureRow}>
          <FactRowBody
            {...props}
            items={items}
            stacked={stacked}
            shape={shape}
            hasMarkCol={Boolean(props.mark)}
            density={density}
          />
        </FactMeasureProvider>
      </View>
    </View>
  );
}

/**
 * **One label, one value — the one form for data on a screen**, chosen by whether the value fits,
 * never by how wide the screen is: `pair` while it fits on one line in its own column, `lead` —
 * one line that wraps — when it would not.
 */
export function FactRow(props: NativeFactRowProps) {
  const ground = useFactGround();
  useGapDropsTier(props.gap, props.provenance, props.label);
  const group = ground.group;
  if (group === undefined) return <FactRowAlone {...props} ink={ground.ink} />;
  return <FactRowBody {...props} {...groupedRowShape(props, group)} ink={ground.ink} />;
}

const styles = StyleSheet.create({
  room: {
    width: '100%',
  },
  line: {
    flexDirection: 'row',
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueColumn: {
    flex: 1,
    minWidth: 0,
    rowGap: theme.spacing['sp-0-5'],
  },
  mark: {
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  flow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  dash: {
    fontWeight: '400',
  },
  flowTier: {
    marginLeft: theme.spacing['sp-2'],
  },
});
