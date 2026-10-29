/* Timeline (native) — the same sequence, the same rail, the same five states. A continuous rail
   runs through the nodes, lit up to the current step and dim beyond it. Without `onChange` it is
   display only: nothing is pressable but the error state's retry (a `Button`). With it, the chain
   is a radio group (`TimelinePick.native.tsx`). */

import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { lastLitIndex, stepKeyOf } from './Timeline.logic';
import type { TimelineProps } from './Timeline.types';
import { NODE_SIZE, TimelineMessage, TimelineSkeleton } from './TimelineParts.native';
import { TimelinePick } from './TimelinePick.native';
import { TimelineStep } from './TimelineStep.native';

type NativeTimelineProps = TimelineProps & {
  style?: StyleProp<ViewStyle>;
};

export function Timeline({
  items = [],
  variant = 'page',
  density = 'expressive',
  read,
  loadingLabel,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  value,
  onChange,
  label,
  style,
}: NativeTimelineProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  /* Every state's root is this one View — the same element at the same place, so it outlives a
     retry and the list that replaces the skeleton: focus lands here once the retry has left. */
  const frame = useRef<View>(null);
  if (state === 'loading') {
    return (
      <View ref={frame} style={style}>
        <TimelineSkeleton label={loadingLabel} />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View ref={frame} style={style}>
        <TimelineMessage
          tone="warning"
          title={errorTitle}
          message={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={frame}
        />
      </View>
    );
  }
  if (state === 'unavailable') {
    return (
      <View ref={frame} style={style}>
        {unavailableTitle !== undefined ? (
          <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
        ) : null}
      </View>
    );
  }
  if (state === 'empty' || items.length === 0) {
    return (
      <View ref={frame} style={style}>
        <TimelineMessage title={emptyTitle} message={emptyDescription} focusAfter={frame} />
      </View>
    );
  }

  if (onChange) {
    return (
      <View ref={frame} style={style}>
        <TimelinePick
          items={items}
          value={value}
          onChange={onChange}
          label={label}
          density={density}
        />
      </View>
    );
  }

  const compact = variant === 'compact';
  const node = compact ? NODE_SIZE.compact : NODE_SIZE.page;
  const gap = compact ? 10 : 0;
  const pad = compact ? 0 : density === 'functional' ? 18 : 26;
  const lastLit = lastLitIndex(items);

  return (
    <View ref={frame} accessibilityRole="list" style={[{ rowGap: gap }, style]}>
      {items.map((it, i) => (
        <TimelineStep
          key={stepKeyOf(it, i)}
          item={it}
          compact={compact}
          node={node}
          gap={gap}
          pad={pad}
          isLast={i === items.length - 1}
          railLit={i < lastLit}
        />
      ))}
    </View>
  );
}
