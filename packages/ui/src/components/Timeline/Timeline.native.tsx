/* Timeline (native) — the same sequence, the same rail, the same five states. A continuous rail
   runs through the nodes, lit up to the current step and dim beyond it. Display only: nothing in
   this component is pressable except the error state's retry (which is a Pressable). */

import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { TimelineProps } from './Timeline.types';
import { NODE_SIZE, TimelineMessage, TimelineSkeleton } from './TimelineParts.native';
import { TimelineStep } from './TimelineStep.native';

interface NativeTimelineProps extends TimelineProps {
  style?: StyleProp<ViewStyle>;
}

export function Timeline({
  items = [],
  variant = 'page',
  density = 'expressive',
  state = 'ready',
  emptyTitle = 'No activity yet',
  emptyDescription = 'Steps appear here as the job moves.',
  errorTitle = "Couldn't load the activity",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'No sequence here',
  unavailableMessage,
  style,
}: NativeTimelineProps) {
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
