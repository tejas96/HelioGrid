import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { AllocationModel } from './AllocationMeter.model';
import { allocationModel, formatAllocation, partValue } from './AllocationMeter.model';
import type {
  AllocationMeterProps,
  AllocationPart,
  AllocationState,
} from './AllocationMeter.types';

interface NativeAllocationMeterProps extends AllocationMeterProps {
  style?: StyleProp<ViewStyle>;
}

const WORD_COLOUR: Record<AllocationState, string> = {
  under: theme.colors['text-secondary'],
  met: theme.colors['success-text'],
  over: theme.colors['warning-text'],
};

/* The state's second channel. The OVER mark takes --warning-text — plain --warning measures
   2.17:1 on white and could not be seen. */
function Mark({ state }: { state: AllocationState }) {
  if (state === 'under') {
    return <View style={styles.markUnder} />;
  }
  const met = state === 'met';
  return (
    <View
      style={[
        styles.markFilled,
        { backgroundColor: met ? theme.colors.success : theme.colors['warning-text'] },
      ]}
    >
      <Svg
        width={9}
        height={9}
        viewBox={met ? '0 0 12 12' : '0 0 24 24'}
        fill="none"
        stroke={theme.colors['text-inverse']}
        strokeWidth={met ? 2.4 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d={met ? 'M2.5 6.5 5 9l4.5-5' : 'M12 6v12M6 12h12'} />
      </Svg>
    </View>
  );
}

function Head({
  label,
  sum,
  target,
  unit,
}: {
  label?: string;
  sum: number | null;
  target: number;
  unit: string;
}) {
  return (
    <View style={styles.head}>
      <Text variant="body-sm" color="secondary" style={styles.label}>
        {label}
      </Text>
      {sum === null ? null : (
        <Text variant="mono" style={styles.figure}>
          {`${formatAllocation(sum)}${unit} `}
          <Text variant="mono" color="tertiary">
            {`of ${formatAllocation(target)}${unit}`}
          </Text>
        </Text>
      )}
    </View>
  );
}

/**
 * The track scales to max(allocated, target), so an over-allocation has somewhere to go.
 * RN has no `meter` role; `progressbar` plus accessibilityValue is its equivalent, and the value
 * text carries the same sentence a screen reader gets on the web.
 */
function Track({
  model,
  name,
  target,
  density,
  valueText,
}: {
  model: AllocationModel;
  name: string;
  target: number;
  density: 'expressive' | 'functional';
  valueText?: string;
}) {
  return (
    <View
      accessibilityRole={model.sum === null ? undefined : 'progressbar'}
      /* The name rides the meter, never the frame: this is the node that already IS an
         accessibility element, and on the web it takes its name from the enclosing labelled
         section the same way. Withheld with the role when there is no resolved value, so an
         unresolved meter is silent rather than inert. */
      accessibilityLabel={model.sum === null ? undefined : name}
      accessibilityValue={
        model.sum === null
          ? undefined
          : { min: 0, max: Math.max(target, model.sum), now: model.sum, text: valueText }
      }
      style={[styles.track, density === 'functional' ? styles.trackFn : styles.trackEx]}
    >
      {model.spans.map((span) => (
        <View
          key={span.key}
          style={[
            styles.span,
            span.over ? styles.spanOver : null,
            { width: `${span.width}%` as `${number}%` },
          ]}
        />
      ))}
      {model.state === 'over' ? (
        <View style={[styles.tick, { left: `${model.tickAt}%` as `${number}%` }]} />
      ) : null}
    </View>
  );
}

/** Names each segment beside the bar. Off by default: at 375px the bar and the words come first. */
function Legend({ parts, unit }: { parts: AllocationPart[]; unit: string }) {
  return (
    <View style={styles.legend}>
      {parts.map((part) => (
        <View key={`${part.label ?? ''}-${partValue(part)}`} style={styles.legendItem}>
          <View style={styles.swatch} />
          <Text variant="caption" color="secondary">
            {part.label}
          </Text>
          <Text variant="mono" color="tertiary">
            {`${formatAllocation(partValue(part))}${unit}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Note({ words }: { words: ReactNode }) {
  return words === null || words === undefined ? null : (
    <Text variant="caption" color="tertiary">
      {words}
    </Text>
  );
}

/** An allocation against an exact target, with the shortfall or the excess stated in words. */
export function AllocationMeter(props: NativeAllocationMeterProps) {
  const {
    label,
    target = 100,
    unit = '%',
    targetLabel,
    remainderWords,
    enforcementNote,
    unresolvedNote = 'Nothing allocated yet.',
    note,
    showLegend = false,
    density = 'expressive',
    style,
  } = props;
  const model = allocationModel(props);
  const words = remainderWords ?? model.remainder ?? unresolvedNote;
  const state = model.resolved ? model.state : 'under';
  const name = label === undefined ? 'Allocation' : `${label} allocation`;
  /* The whole sentence the web half puts in `aria-valuetext` — the figure, the target AND the
     remainder. The port was passing the remainder alone, so "62% of 100%" was announced by
     nothing. */
  const valueText =
    model.sum === null
      ? undefined
      : `${formatAllocation(model.sum)}${unit} of ${formatAllocation(target)}${unit} — ${
          typeof words === 'string' ? words : ''
        }`;

  return (
    <View style={[styles.root, style]}>
      <Head label={label} sum={model.sum} target={target} unit={unit} />
      <Note words={targetLabel} />
      <Track model={model} name={name} target={target} density={density} valueText={valueText} />
      <View style={styles.wordsRow}>
        <Mark state={state} />
        <Text variant="caption" style={[styles.words, { color: WORD_COLOUR[state] }]}>
          {words}
        </Text>
      </View>
      {showLegend && model.parts.length > 0 ? <Legend parts={model.parts} unit={unit} /> : null}
      <Note words={enforcementNote ?? model.enforcement} />
      <Note words={note} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: theme.spacing['sp-2'],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  label: {
    fontWeight: '500',
  },
  figure: {
    fontWeight: '700',
    color: theme.colors['text-primary'],
  },
  track: {
    position: 'relative',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
    flexDirection: 'row',
    gap: 2,
    overflow: 'hidden',
  },
  trackEx: {
    height: 10,
  },
  trackFn: {
    height: 8,
  },
  span: {
    minWidth: 3,
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  spanOver: {
    backgroundColor: theme.colors['warning-text'],
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    marginLeft: -1,
    width: 2,
    backgroundColor: theme.colors.surface,
  },
  wordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  words: {
    flexShrink: 1,
    fontWeight: '500',
  },
  markUnder: {
    width: 10,
    height: 10,
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1.5,
    borderColor: theme.colors['mark-subtle'],
  },
  markFilled: {
    width: 14,
    height: 14,
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-1'],
    columnGap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: theme.spacing['sp-2'],
    height: theme.spacing['sp-2'],
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
    flexShrink: 0,
  },
});
