/* Timeline (native) — the same sequence, the same rail, the same five states. A continuous rail
   runs through the nodes, lit up to the current step and dim beyond it. Without `onChange` it is
   display only: nothing is pressable but the error state's retry (a `Button`). With it, the chain
   is a radio group (`TimelinePick.native.tsx`). */

import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import type { TimelineProps } from './Timeline.types';
import { NODE_SIZE, TimelineMessage, TimelineSkeleton } from './TimelineParts.native';
import { TimelinePick } from './TimelinePick.native';
import { TimelineStep } from './TimelineStep.native';

interface NativeTimelineProps extends TimelineProps {
  style?: StyleProp<ViewStyle>;
}

export function Timeline({
  items = [],
  variant = 'page',
  density = 'expressive',
  read,
  emptyTitle = 'No activity yet',
  emptyDescription = 'Steps appear here as the job moves.',
  errorTitle = "Couldn't load the activity",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  retryLabel,
  unavailableTitle = 'No sequence here',
  unavailableMessage,
  value,
  onChange,
  label,
  style,
}: NativeTimelineProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  if (state === 'loading') {
    return (
      <View style={style}>
        <TimelineSkeleton />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View style={style}>
        <TimelineMessage
          tone="warning"
          title={errorTitle}
          message={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
        />
      </View>
    );
  }
  if (state === 'unavailable') {
    return (
      <View style={style}>
        <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
      </View>
    );
  }
  if (state === 'empty' || items.length === 0) {
    return (
      <View style={style}>
        <TimelineMessage title={emptyTitle} message={emptyDescription} />
      </View>
    );
  }

  if (onChange) {
    return (
      <TimelinePick
        items={items}
        value={value}
        onChange={onChange}
        label={label}
        density={density}
        style={style}
      />
    );
  }

  const compact = variant === 'compact';
  const node = compact ? NODE_SIZE.compact : NODE_SIZE.page;
  const gap = compact ? 10 : 0;
  const pad = compact ? 0 : density === 'functional' ? 18 : 26;
  const lastLit = items.reduce(
    (acc, it, i) => (it.status === 'done' || it.status === 'current' ? i : acc),
    -1,
  );

  return (
    <View accessibilityRole="list" style={[{ rowGap: gap }, style]}>
      {items.map((it, i) => (
        <TimelineStep
          key={it.id ?? `${i}-${it.label}`}
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
