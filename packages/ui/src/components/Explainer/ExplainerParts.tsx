import { Pressable } from '../../primitives/Pressable/Pressable';
import { type ExplainerPagerModel, INFO_GLYPH, type PlacedExplainer } from './Explainer.logic';
import type { ExplainerAction } from './Explainer.types';

/** The default "i" — `currentColor`, so the trigger owns its colour and its accessible name. */
export function InfoGlyph({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle {...INFO_GLYPH.ring} />
      <path d={INFO_GLYPH.stem} />
      <circle {...INFO_GLYPH.dot} fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ExplainerArrow({ placed }: { placed: PlacedExplainer }) {
  const along = placed.side === 'top' || placed.side === 'bottom' ? 'left' : 'top';
  return (
    <span
      aria-hidden="true"
      className="hg-explainer-arrow"
      data-side={placed.side}
      style={{ [along]: placed.arrow - 6 }}
    />
  );
}

/** The one action: a link goes somewhere, so it reads as a link — still a 44px target. */
export function ExplainerActionControl({ action }: { action: ExplainerAction }) {
  if (action.href !== undefined) {
    return (
      <a className="hg-explainer-link" href={action.href}>
        {action.label}
      </a>
    );
  }
  return (
    <Pressable className="hg-explainer-pill hg-explainer-pill-filled" onPress={action.onPress}>
      {action.label}
    </Pressable>
  );
}

interface PagerProps {
  pager: ExplainerPagerModel;
  onMove: (step: 'next' | 'back') => void;
}

/**
 * Back and Next on EVERY page. At an edge one is off but still focusable — `aria-disabled`, not
 * `disabled` — so the focus a keyboard user put on Next is not dropped when the last page arrives.
 */
export function ExplainerPager({ pager, onMove }: PagerProps) {
  return (
    <div className="hg-explainer-pager">
      <span className="hg-explainer-position">{pager.position}</span>
      <span className="hg-explainer-pager-buttons">
        <PagerButton
          label={pager.backLabel}
          enabled={pager.canBack}
          kind="ghost"
          onPress={() => onMove('back')}
        />
        <PagerButton
          label={pager.nextLabel}
          enabled={pager.canNext}
          kind="filled"
          onPress={() => onMove('next')}
        />
      </span>
    </div>
  );
}

function PagerButton(props: {
  label: string;
  enabled: boolean;
  kind: 'ghost' | 'filled';
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`hg-explainer-pill hg-explainer-pill-${props.enabled ? props.kind : 'off'}`}
      accessibilityState={{ disabled: !props.enabled }}
      onPress={props.enabled ? props.onPress : undefined}
    >
      {props.label}
    </Pressable>
  );
}
