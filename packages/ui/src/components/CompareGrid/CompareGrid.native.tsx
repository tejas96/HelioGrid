import { theme } from '@heliogrid/theme';
import { useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Animated, type ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { visibleRange } from './CompareGrid.logic';
import type { CompareGridProps, CompareOption } from './CompareGrid.types';
import { CompareGridFooter } from './CompareGridFooter.native';
import { CompareGridStatePanel } from './CompareGridStatePanel.native';
import { CompareGridTable } from './CompareGridTable.native';

const styles = StyleSheet.create({
  shell: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-expressive'],
    overflow: 'hidden',
    ...theme.elevation.e2,
  },
  functional: { borderRadius: theme.radius['r-card-functional'] },
  caption: { padding: theme.spacing['sp-4'], paddingBottom: 0 },
  provenanceFoot: { paddingHorizontal: theme.spacing['sp-4'], paddingBottom: 14 },
});

interface NativeCompareGridProps<Opt extends CompareOption> extends CompareGridProps<Opt> {
  style?: StyleProp<ViewStyle>;
}

/**
 * **Compare 2–4 options attribute by attribute, at every width.**
 *
 * A comparison transposes both axes — **the record is the column and the attribute is the row** —
 * so scrolling the option axis moves *between records* and hides nothing about any record on
 * screen. The attribute column is **pinned** (a translateX driven by the scroll offset, RN's
 * reading of `position: sticky`), and it is still **one table**: every row is a flex row of
 * fixed-width cells, so no value can drift between variants.
 *
 * **It never stacks** — one variant at a time is not a comparison — and the option axis carries
 * real 44px previous/next controls plus a readout saying where the reader is, so it is operable
 * without a swipe.
 */
export function CompareGrid<Opt extends CompareOption = CompareOption>({
  attributes,
  options,
  selectedKey,
  onSelect,
  selectLabel = 'Choose',
  selectedLabel = 'Selected',
  currentLabel = 'Current',
  caption,
  provenance,
  note,
  columnWidth = 196,
  labelWidth = 128,
  state = 'ready',
  emptyTitle = 'Nothing to compare yet',
  emptyMessage = 'Generate at least two variants and they line up here side by side.',
  errorTitle = "Couldn't load the comparison",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'Not comparable here',
  unavailableMessage,
  density = 'expressive',
  style,
}: NativeCompareGridProps<Opt>) {
  const scroller = useRef<ScrollView>(null);
  const offset = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [viewport, setViewport] = useState(0);
  const [range, setRange] = useState({ first: 1, last: 1 });

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
        listener: (event) => {
          const x = (event as unknown as { nativeEvent: { contentOffset: { x: number } } })
            .nativeEvent.contentOffset.x;
          offset.current = x;
          setRange(visibleRange(x, viewport, labelWidth, columnWidth, options.length));
        },
      }),
    [scrollX, viewport, labelWidth, columnWidth, options.length],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setViewport(width);
    setRange(visibleRange(offset.current, width, labelWidth, columnWidth, options.length));
  };

  const contentWidth = labelWidth + columnWidth * options.length;
  const scrollable = viewport > 0 && contentWidth - viewport > 4;

  const nudge = (direction: number) => {
    const next = Math.max(
      0,
      Math.min(contentWidth - viewport, offset.current + direction * columnWidth),
    );
    scroller.current?.scrollTo({ x: next, animated: true });
  };

  const shell = [styles.shell, density === 'functional' ? styles.functional : null, style];
  /* An empty caption names nothing, so it draws no overline. */
  const captionNode =
    caption === undefined || caption === '' ? null : (
      <View style={styles.caption}>
        <Text variant="overline" color="tertiary">
          {caption}
        </Text>
      </View>
    );
  /* One provenance statement for the whole comparison. A SPEC, not a node: `renderProvenance`
     owns the tier's word and mark, and returns null when the spec would say nothing. */
  const provenanceFoot = renderProvenance(provenance, { size: 12 });

  /* No grid to draw — because a state blocks it, or because there is nothing to line up. What
     stands in its place is the state panel's decision, not this shell's. */
  if (state !== 'ready' || options.length === 0 || attributes.length === 0) {
    return (
      <View style={shell}>
        {captionNode}
        <CompareGridStatePanel
          state={state}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          unavailableTitle={unavailableTitle}
          unavailableMessage={unavailableMessage}
        />
      </View>
    );
  }

  return (
    <View style={shell}>
      {captionNode}
      <Animated.ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        snapToInterval={columnWidth}
        decelerationRate="fast"
        accessibilityLabel={`Compare ${options.length} options`}
        onLayout={onLayout}
        onScroll={onScroll}
      >
        <CompareGridTable
          attributes={attributes}
          options={options}
          selectedKey={selectedKey}
          onSelect={onSelect}
          selectLabel={selectLabel}
          selectedLabel={selectedLabel}
          currentLabel={currentLabel}
          density={density}
          columnWidth={columnWidth}
          labelWidth={labelWidth}
          scrollX={scrollX}
        />
      </Animated.ScrollView>

      <CompareGridFooter
        scrollable={scrollable}
        first={range.first}
        last={range.last}
        count={options.length}
        note={note}
        onStep={nudge}
      />

      {provenanceFoot === null ? null : <View style={styles.provenanceFoot}>{provenanceFoot}</View>}
    </View>
  );
}
