import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { ChecklistProps } from './Checklist.types';

type StateProps = Required<Pick<ChecklistProps, 'state'>> &
  Pick<
    ChecklistProps,
    | 'emptyTitle'
    | 'emptyMessage'
    | 'errorTitle'
    | 'errorMessage'
    | 'onRetry'
    | 'unavailableTitle'
    | 'unavailableMessage'
  >;

const styles = StyleSheet.create({
  note: { flexDirection: 'column', gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  skeleton: {
    height: 90,
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  retry: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 18,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
});

/**
 * The four non-ready states.
 *
 * `error` went wrong and offers a retry; `unavailable` was **never going to be here** — neutral
 * words, no warning tint, and **no retry, ever**, because trying again cannot change the answer.
 *
 * The web half's shimmer is a CSS keyframe animation; the touch form is the same well-coloured
 * block held still, which is what `prefers-reduced-motion` renders there too.
 */
export function ChecklistStateBody({
  state,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: StateProps) {
  if (state === 'loading') {
    return (
      /* Web is `role="status"`; RN has no `status`, and `progressbar` on a held block would
         promise a count of items done that no list has been read yet to know. `accessible` makes
         the empty block an element so its name is announced, politely, and folds nothing. */
      <View
        accessible
        accessibilityLabel="Loading checklist"
        accessibilityLiveRegion="polite"
        style={styles.skeleton}
      />
    );
  }

  if (state === 'unavailable') {
    return <UnavailableNote title={unavailableTitle} message={unavailableMessage} />;
  }

  if (state === 'empty') {
    return (
      <View style={styles.note}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {emptyTitle}
        </Text>
        <Text variant="body-sm" color="secondary">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.note}>
      <Text variant="body" style={{ fontWeight: '600' }}>
        {errorTitle}
      </Text>
      <Text variant="body-sm" color="warning">
        {errorMessage}
      </Text>
      {onRetry === undefined ? null : (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text variant="body">Try again</Text>
        </Pressable>
      )}
    </View>
  );
}
