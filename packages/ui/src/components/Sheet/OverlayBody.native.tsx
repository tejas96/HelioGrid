import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';
import type { OverlayStateVariant } from './OverlayStates.native';
import { OverlayEmpty, OverlayError } from './OverlayStates.native';

interface OverlayBodyProps {
  children?: ReactNode;
  emptyAction?: ReactNode;
  emptyMessage?: string;
  emptyTitle?: string;
  errorMessage?: string;
  errorTitle?: string;
  onRetry?: () => void;
  /** The surface's own `loading` shape — a sheet's bars are not a panel's. */
  skeleton: ReactNode;
  state: SurfaceState;
  /** The wrapper style that pads `unavailable` inside this particular surface. */
  unavailableStyle: StyleProp<ViewStyle>;
  unavailableAction?: ReactNode;
  unavailableMessage?: string;
  unavailableTitle?: string;
  variant: OverlayStateVariant;
}

/**
 * THE SYSTEM'S FIVE (`SurfaceState`), NOT A PRIVATE THREE — rendered once for the whole Sheet
 * family, so Sheet and DetailPanel cannot drift into answering `unavailable` two ways.
 *
 * `unavailable` is the one that is easiest to reach for and hardest to spell twice: a record the
 * market pack does not cover gets neutral words and NO RETRY, because trying again cannot change
 * the answer. `empty` means none **yet**, so it invites. `error` is the only one with a retry.
 */
export function OverlayBody({
  children,
  emptyAction,
  emptyMessage,
  emptyTitle,
  errorMessage,
  errorTitle,
  onRetry,
  skeleton,
  state,
  unavailableStyle,
  unavailableAction,
  unavailableMessage,
  unavailableTitle,
  variant,
}: OverlayBodyProps) {
  if (state === 'loading') {
    return skeleton;
  }
  if (state === 'error') {
    return (
      <OverlayError message={errorMessage} onRetry={onRetry} title={errorTitle} variant={variant} />
    );
  }
  /* No retry and no warning tint: the absence is stated, not styled as a fault. */
  if (state === 'unavailable') {
    return (
      <View style={unavailableStyle}>
        <UnavailableNote
          action={unavailableAction}
          message={unavailableMessage}
          title={unavailableTitle}
          variant="region"
        />
      </View>
    );
  }
  if (state === 'empty') {
    return (
      <OverlayEmpty
        action={emptyAction}
        message={emptyMessage}
        title={emptyTitle}
        variant={variant}
      />
    );
  }
  return children;
}
