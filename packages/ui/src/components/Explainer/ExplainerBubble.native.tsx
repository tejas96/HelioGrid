import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import { useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import {
  type ExplainerDensity,
  type ExplainerPagerModel,
  type PlacedExplainer,
  swipeMove,
} from './Explainer.logic';
import type { ExplainerAction, ExplainerPage } from './Explainer.types';
import { ExplainerActionControl, ExplainerArrow, ExplainerPager } from './ExplainerParts.native';

interface BubbleProps {
  bubbleRef: RefObject<View | null>;
  label: string;
  title?: string;
  density: ExplainerDensity;
  placed: PlacedExplainer | null;
  cap: number | null;
  onLayout: (event: LayoutChangeEvent) => void;
  content: ExplainerPage | undefined;
  pager: ExplainerPagerModel | null;
  action?: ExplainerAction;
  showsAction: boolean;
  onMove: (step: 'next' | 'back') => void;
  /** VoiceOver's two-finger scrub — the catcher is hidden from a screen reader, so this is its way out. */
  onEscape: () => void;
}

/**
 * The bubble, drawn in the `Portal` at window coordinates. `role="dialog"` without
 * `accessibilityViewIsModal`: the screen behind stays reachable. A swipe moves pages, and Back and
 * Next remain on every page, because a swipe cannot be announced; the body is a polite live region
 * so a new page is read on Android.
 */
export function ExplainerBubble(props: BubbleProps) {
  const { placed, pager, title, action, cap } = props;
  const touchX = useRef<number | null>(null);
  const functional = props.density === 'functional';
  return (
    <View
      ref={props.bubbleRef}
      role="dialog"
      accessibilityLabel={title ?? props.label}
      onAccessibilityEscape={props.onEscape}
      onLayout={props.onLayout}
      onTouchStart={(event) => {
        touchX.current = event.nativeEvent.pageX;
      }}
      onTouchEnd={(event) => {
        const step = swipeMove(touchX.current, event.nativeEvent.pageX);
        touchX.current = null;
        if (pager !== null && step !== null) props.onMove(step);
      }}
      style={[
        styles.bubble,
        functional ? styles.bubbleFunctional : undefined,
        cap === null ? undefined : { maxWidth: cap },
        placed === null ? styles.unplaced : { left: placed.left, top: placed.top },
      ]}
    >
      {placed === null ? null : <ExplainerArrow placed={placed} />}
      {title === undefined ? null : (
        <Text variant="body" style={functional ? styles.titleFunctional : styles.title}>
          {title}
        </Text>
      )}
      <ExplainerBody
        content={props.content}
        paged={pager !== null}
        afterTitle={title !== undefined}
      />
      {action !== undefined && props.showsAction ? (
        <View style={action.href === undefined ? styles.action : styles.actionLink}>
          <ExplainerActionControl action={action} />
        </View>
      ) : null}
      {pager === null ? null : <ExplainerPager pager={pager} onMove={props.onMove} />}
    </View>
  );
}

/** A sentence page is set as body text; a node page brings its own. A new page is read on Android. */
function ExplainerBody(props: {
  content: ExplainerPage | undefined;
  paged: boolean;
  afterTitle: boolean;
}) {
  return (
    <View
      accessibilityLiveRegion={props.paged ? 'polite' : undefined}
      style={props.afterTitle ? styles.bodyAfterTitle : undefined}
    >
      {typeof props.content === 'string' ? (
        <Text variant="body-sm" color="secondary" style={styles.body}>
          {props.content}
        </Text>
      ) : (
        props.content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    zIndex: 70,
    minWidth: 208,
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-lg'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e5,
  },
  bubbleFunctional: { minWidth: 192, padding: 14, borderRadius: theme.radius['rf-lg'] },
  /* Measured before it is placed, so the first frame never shows it in the wrong spot. */
  unplaced: { opacity: 0, left: 0, top: 0 },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors['text-primary'] },
  titleFunctional: { fontSize: 14, fontWeight: '700', color: theme.colors['text-primary'] },
  bodyAfterTitle: { marginTop: 6 },
  body: { lineHeight: 21 },
  action: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  actionLink: { marginTop: theme.spacing['sp-2'], flexDirection: 'row' },
});
