import type { KeyboardEvent, RefObject } from 'react';
import { useRef } from 'react';
import { type ExplainerPagerModel, swipeMove } from './Explainer.logic';
import type { ExplainerAction, ExplainerPage } from './Explainer.types';
import { ExplainerActionControl, ExplainerArrow, ExplainerPager } from './ExplainerParts';
import type { PlacedBubble } from './use-explainer-place';

interface BubbleProps {
  bubbleRef: RefObject<HTMLDivElement | null>;
  titleId: string;
  label: string;
  title?: string;
  placed: PlacedBubble | null;
  content: ExplainerPage | undefined;
  pager: ExplainerPagerModel | null;
  action?: ExplainerAction;
  showsAction: boolean;
  onMove: (step: 'next' | 'back') => void;
}

const KEY_MOVE: Record<string, 'next' | 'back'> = {
  ArrowRight: 'next',
  ArrowDown: 'next',
  ArrowLeft: 'back',
  ArrowUp: 'back',
};

/**
 * The bubble: a non-modal dialog right after its trigger, so it is in reading order. Arrow keys and
 * a swipe move pages; Back and Next remain on every page, because neither can be announced.
 */
export function ExplainerBubble(props: BubbleProps) {
  const { placed, pager, title, action } = props;
  const touchX = useRef<number | null>(null);
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = KEY_MOVE[event.key];
    if (pager === null || step === undefined) return;
    event.preventDefault();
    props.onMove(step);
  };
  return (
    <div
      ref={props.bubbleRef}
      role="dialog"
      aria-modal="false"
      tabIndex={-1}
      aria-labelledby={title === undefined ? undefined : props.titleId}
      aria-label={title === undefined ? props.label : undefined}
      className="hg-explainer-bubble"
      data-placed={placed === null ? undefined : 'true'}
      style={
        placed === null ? undefined : { left: placed.left, top: placed.top, maxWidth: placed.cap }
      }
      onKeyDown={onKey}
      onTouchStart={(event) => {
        touchX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const step = swipeMove(touchX.current, event.changedTouches[0]?.clientX);
        touchX.current = null;
        if (pager !== null && step !== null) props.onMove(step);
      }}
    >
      {placed === null ? null : <ExplainerArrow placed={placed} />}
      {title === undefined ? null : (
        <div id={props.titleId} className="hg-explainer-title">
          {title}
        </div>
      )}
      <div className="hg-explainer-body" aria-live={pager === null ? undefined : 'polite'}>
        {props.content}
      </div>
      {action !== undefined && props.showsAction ? (
        <div
          className="hg-explainer-action"
          data-link={action.href === undefined ? undefined : 'true'}
        >
          <ExplainerActionControl action={action} />
        </div>
      ) : null}
      {pager === null ? null : <ExplainerPager pager={pager} onMove={props.onMove} />}
    </div>
  );
}
