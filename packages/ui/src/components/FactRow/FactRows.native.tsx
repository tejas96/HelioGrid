import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextVariant } from '../../primitives/Text/Text.types';
import {
  contentSignature,
  FACT_LEAD_BELOW,
  FACT_LONG_AT,
  FACT_MEASURE,
  FACT_WRAP_LINES,
  FactGroundProvider,
  factRowsOf,
  factWantsLead,
  groupForm,
  isUnderFloor,
  useAnswerReport,
  useFactGround,
} from './FactRow.logic';
import type { FactDensity, FactRowsForm, FactRowsProps } from './FactRow.types';

const R = theme.type.roles;

export interface FactMetrics {
  /** Drawn on `body-sm`'s line box, which is never shorter than the label's words need. */
  labelSize: number;
  valueSize: number;
  /** The smallest role at or above the value's size, so its line box — raised for Devanagari by
   *  `Text` — is never shorter than the words need. */
  valueVariant: TextVariant;
  valueLine: number;
  rowGap: number;
  colGap: number;
  lineGap: number;
  mark: number;
}

/* The 14dp expressive value, the 12.5dp functional label, the 18/14dp column gaps, the 9dp row
   gap, the 3dp line gap and the 18dp mark column are the design system's own FactRow values; the
   spacing scale has no step for them. */
export const FACT_METRICS: Record<FactDensity, FactMetrics> = {
  expressive: {
    labelSize: R['body-sm'].fontSize,
    valueSize: 14,
    valueVariant: 'body',
    valueLine: R.body.lineHeight,
    rowGap: theme.spacing['sp-3'],
    colGap: 18,
    lineGap: 3,
    mark: theme.spacing['sp-5'],
  },
  functional: {
    labelSize: 12.5,
    valueSize: R['body-sm'].fontSize,
    valueVariant: 'body-sm',
    valueLine: R['body-sm'].lineHeight,
    rowGap: 9,
    colGap: 14,
    lineGap: theme.spacing['sp-0-5'],
    mark: 18,
  },
};

/** What a row tells the room measuring it: whether its value wrapped, and its label's own width. */
export interface FactMeasure {
  reportValue: (id: string, wraps: boolean | null) => void;
  reportLabel?: (id: string, width: number | null) => void;
  /** The group's label column: the widest label, so every value starts on one edge. */
  labelWidth?: number;
}

const FactMeasureContext = createContext<FactMeasure | null>(null);

export const FactMeasureProvider = FactMeasureContext.Provider;

/** The value's own box in a pair: it tells the room whether it took more than one line. */
export function MeasuredValue({ line, children }: { line: number; children: ReactNode }) {
  /* The report alone, which is stable: the context object changes with the label column, and a
     withdrawal on that change would leave the answer waiting for a layout that never comes. */
  const report = useContext(FactMeasureContext)?.reportValue;
  const id = useId();
  useEffect(() => () => report?.(id, null), [report, id]);
  return (
    <View
      onLayout={(event) => report?.(id, event.nativeEvent.layout.height > line * FACT_WRAP_LINES)}
    >
      {children}
    </View>
  );
}

/** The label's cell: its own width reported, the group's widest taken, so values share one edge. */
export function LabelCell({ children }: { children: ReactNode }) {
  const measure = useContext(FactMeasureContext);
  const report = measure?.reportLabel;
  const id = useId();
  useEffect(() => () => report?.(id, null), [report, id]);
  const column = measure?.labelWidth;
  return (
    <View style={[styles.labelCell, column !== undefined ? { minWidth: column } : undefined]}>
      <View
        style={styles.ownWidth}
        onLayout={(event) => report?.(id, event.nativeEvent.layout.width)}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * The room's width from `onLayout` — `null` until it has a size, since 0 is not a measurement —
 * and the fit answer for one signature. Each value drawn as a pair reports whether it wrapped; the
 * answer is taken once every row has reported. A value leaving the pair withdraws its report, so a
 * group back in `lead` holds nothing stale.
 */
export function useRoomFit(rowCount: number, content: string) {
  const [room, setRoom] = useState<{ width: number | null; gen: number }>({ width: null, gen: 0 });
  const [answer, setAnswer] = useState<{ signature: string; fits: boolean } | null>(null);
  const signature = `${room.gen}|${content}`;
  const wrapsById = useRef(new Map<string, boolean>());
  const lastWidth = useRef<number | null>(null);
  const latest = useRef({ signature, rowCount });
  latest.current = { signature, rowCount };

  const settle = useCallback((current: string) => {
    if (wrapsById.current.size < latest.current.rowCount) return;
    const fits = ![...wrapsById.current.values()].some(Boolean);
    setAnswer((previous) =>
      previous?.signature === current && previous.fits === fits
        ? previous
        : { signature: current, fits },
    );
  }, []);

  const reportValue = useCallback(
    (id: string, wraps: boolean | null) => {
      if (wraps === null) wrapsById.current.delete(id);
      else wrapsById.current.set(id, wraps);
      settle(latest.current.signature);
    },
    [settle],
  );

  /* A new question is answered from the values that did not move, until those that did report. */
  useEffect(() => {
    settle(signature);
  }, [signature, settle]);

  const onRoomLayout = useCallback((event: LayoutChangeEvent) => {
    const raw = event.nativeEvent.layout.width;
    if (!(raw > 0)) return;
    if (lastWidth.current !== null && Math.abs(raw - lastWidth.current) < 0.5) return;
    lastWidth.current = raw;
    setRoom((previous) => ({ width: raw, gen: previous.gen + 1 }));
  }, []);

  const answered = answer !== null && answer.signature === signature;
  return {
    width: room.width,
    fits: answer !== null && answered ? answer.fits : true,
    answered,
    reportValue,
    onRoomLayout,
  };
}

/** The labels' widest own width, kept per row so a label that changes reports again. */
function useLabelColumn() {
  const widths = useRef(new Map<string, number>());
  const [labelWidth, setLabelWidth] = useState<number | undefined>(undefined);
  const reportLabel = useCallback((id: string, width: number | null) => {
    if (width === null) widths.current.delete(id);
    else widths.current.set(id, width);
    const widest = Math.max(0, ...widths.current.values());
    setLabelWidth((previous) =>
      previous !== undefined && Math.abs(previous - widest) < 0.5 ? previous : widest || undefined,
    );
  }, []);
  return { labelWidth, reportLabel };
}

/** The width of one `0` at the value's size: what a measure in characters is counted in. */
export function useCharWidth(size: number) {
  const [ch, setCh] = useState<number | null>(null);
  const probe = (
    <View
      style={styles.probe}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => setCh(event.nativeEvent.layout.width)}
    >
      <Text variant="body" style={{ fontSize: size }}>
        0
      </Text>
    </View>
  );
  return { ch, probe };
}

interface NativeFactRowsProps extends FactRowsProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * A group of fact rows — one form and one left edge for the whole set. The phone has no subgrid:
 * the group collects each label's own width and every row's label cell takes the widest, so the
 * values share one edge; where any row has a mark, every row reserves its column.
 */
export function FactRows({
  children,
  label,
  density = 'expressive',
  measure = FACT_MEASURE,
  leadBelow = FACT_LEAD_BELOW,
  longAt = FACT_LONG_AT,
  form: forced = 'auto',
  onFormChange,
  style,
}: NativeFactRowsProps) {
  const rows = factRowsOf(children).map((row) => row.props);
  const declared = rows.some((row) => factWantsLead(row, longAt));
  const hasMark = rows.some((row) => Boolean(row.mark));
  const metrics = FACT_METRICS[density];
  const room = useRoomFit(rows.length, contentSignature(rows));
  const floor = isUnderFloor(room.width, leadBelow);
  const { form, reason } = groupForm({ forced, declared, floor, fits: room.fits });
  const settled = forced !== 'auto' || declared || floor || room.answered;
  const answer: FactRowsForm | null =
    settled && room.width !== null ? { form, width: room.width, hasMark, reason } : null;
  useAnswerReport(answer, `${form}|${hasMark}|${reason}`, onFormChange);
  const { ink } = useFactGround();
  const { labelWidth, reportLabel } = useLabelColumn();
  const { ch, probe } = useCharWidth(metrics.valueSize);
  const { reportValue } = room;
  const measureRows = useMemo(
    () => ({ reportValue, reportLabel, labelWidth }),
    [reportValue, reportLabel, labelWidth],
  );
  const ground = useMemo(
    () => ({ ink, group: { form, hasMark, density, longAt } }),
    [ink, form, hasMark, density, longAt],
  );
  return (
    <View
      style={[styles.room, style]}
      onLayout={room.onRoomLayout}
      accessibilityRole="list"
      accessibilityLabel={label}
    >
      {probe}
      <View
        style={[
          { rowGap: metrics.rowGap },
          form === 'pair' && ch !== null ? { maxWidth: measure * ch } : undefined,
        ]}
      >
        <FactGroundProvider value={ground}>
          <FactMeasureProvider value={measureRows}>{children}</FactMeasureProvider>
        </FactGroundProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  room: {
    width: '100%',
  },
  probe: {
    position: 'absolute',
    opacity: 0,
  },
  labelCell: {
    flexShrink: 0,
  },
  ownWidth: {
    alignSelf: 'flex-start',
  },
});
