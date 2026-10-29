import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { AllocationLegend } from './AllocationLegend.native';
import type { AllocationModel } from './AllocationMeter.model';
import {
  allocationFigure,
  allocationModel,
  allocationSentences,
  drawnState,
  meterTop,
} from './AllocationMeter.model';
import type {
  AllocationMeterProps,
  AllocationMeterWords,
  AllocationState,
} from './AllocationMeter.types';
import { AllocationSplit } from './AllocationSplit.native';

type NativeAllocationMeterProps = AllocationMeterProps & {
  style?: StyleProp<ViewStyle>;
};

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
        viewBox="0 0 24 24"
        fill="none"
        // biome-ignore lint/plugin/raw-white: on-accent — a knob or a mark on the accent or the dark fill
        stroke={theme.colors['text-inverse']}
        strokeWidth={met ? 4.8 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ShellGlyphMarks name={met ? 'tick-small' : 'plus-small'} />
      </Svg>
    </View>
  );
}

function Head({
  label,
  sum,
  target,
  unit,
  words,
}: {
  label?: TranslatedText;
  sum: number | null;
  target: number;
  unit: string;
  words: AllocationMeterWords;
}) {
  return (
    <View style={styles.head}>
      <Text variant="body-sm" color="secondary" style={styles.label}>
        {label}
      </Text>
      {sum === null ? null : (
        <Text variant="mono" style={styles.figure}>
          {`${allocationFigure(sum, unit)} `}
          <Text variant="mono" color="tertiary">
            {words.ofTarget(allocationFigure(target, unit))}
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
  name: TranslatedText;
  target: number;
  density: 'expressive' | 'functional';
  valueText?: TranslatedText;
}) {
  const { ground } = useGround();
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
          : { min: 0, max: meterTop(target, model.sum), now: model.sum, text: valueText }
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
        <View
          style={[
            styles.tick,
            { left: `${model.tickAt}%` as `${number}%`, backgroundColor: ground },
          ]}
        />
      ) : null}
    </View>
  );
}

/** Names each segment beside the bar. Off by default: at 375px the bar and the words come first. */
function Note({ words }: { words: TranslatedText | null | undefined }) {
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
    note,
    showLegend = false,
    density = 'expressive',
    style,
  } = props;
  const model = allocationModel(props);
  if (props.variant === 'split') {
    return (
      <AllocationSplit
        label={label}
        parts={model.parts}
        unit={unit}
        density={density}
        style={style}
      />
    );
  }
  /* The figure is the whole sentence the web half puts in `aria-valuetext` — the figure, the
     target AND the remainder, so "62% of 100%" is announced, not the remainder alone. */
  const said = allocationSentences(model, props.words, props);
  const state = drawnState(model);

  return (
    <View style={[styles.root, style]}>
      <Head label={label} sum={model.sum} target={target} unit={unit} words={props.words} />
      <Note words={targetLabel} />
      <Track
        model={model}
        name={props.words.name(label)}
        target={target}
        density={density}
        valueText={said.figure}
      />
      <View style={styles.wordsRow}>
        <Mark state={state} />
        <Text variant="caption" style={[styles.words, { color: WORD_COLOUR[state] }]}>
          {said.remainder}
        </Text>
      </View>
      {showLegend && model.parts.length > 0 ? (
        <AllocationLegend parts={model.parts} unit={unit} />
      ) : null}
      <Note words={said.enforcement} />
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
});
