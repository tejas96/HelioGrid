import type { ExplainerPagerWords, ExplainerView } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import { Children, isValidElement } from 'react';
import type { ExplainerBox, ExplainerPlacement, ExplainerTriggerProps } from './Explainer.types';

/* The design system's own measures (`components/feedback/Explainer.jsx`), shared by both halves so
   the bubble sits in the same place on either platform. */
const GEOMETRY = {
  expressive: { gap: 12, edge: 16, glyph: 19, visual: 28 },
  functional: { gap: 10, edge: 12, glyph: 17, visual: 24 },
} as const;
/** A box narrower than this is a phone's, and takes the narrow cap. */
const NARROW_BOX = 600;
const NARROW_CAP = 280;
const WIDE_CAP = 360;
/** The arrow never leaves the bubble's rounded corner. */
const ARROW_INSET = 18;
/** A horizontal drag this long moves a page; Back and Next stay, because a swipe cannot be announced. */
const SWIPE_DISTANCE = 44;

/** Right to left turns forward, left to right turns back; a short drag is a tap and moves nothing. */
export function swipeMove(startX: number | null, endX: number | undefined): 'next' | 'back' | null {
  if (startX === null || endX === undefined || Math.abs(endX - startX) <= SWIPE_DISTANCE)
    return null;
  return endX < startX ? 'next' : 'back';
}

export type ExplainerDensity = keyof typeof GEOMETRY;

/** A host's control with nothing to explain: drawn, and its press opens nothing. */
export const INERT_TRIGGER: ExplainerTriggerProps = { onPress: () => undefined, expanded: false };

/**
 * What the placing effect watches for `within`. A function box is a new arrow on every render, and
 * watching it would place the bubble, re-render and place it again without end; it is read each time
 * the bubble is placed instead.
 */
export function boxKey(within: ExplainerBox | undefined): unknown {
  return typeof within === 'function' ? 'function' : within;
}

/** The node a box names — a ref's current, a function's answer, or itself. A selector is each half's own. */
export function boxNode(within: Exclude<ExplainerBox, string>): unknown {
  if (typeof within === 'function') return within();
  return 'current' in within ? (within as { current: unknown }).current : within;
}

export function explainerGeometry(density: ExplainerDensity) {
  return GEOMETRY[density];
}

/** Edges in one coordinate space — the viewport's on web, the window's on the phone. */
export interface ExplainerRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PlacedExplainer {
  side: ExplainerPlacement;
  left: number;
  top: number;
  /** The arrow's offset along the bubble's edge that faces the trigger. */
  arrow: number;
}

/** The pager as both halves draw it: the domain model plus its words in the reader's language. */
export interface ExplainerPagerModel extends NonNullable<ExplainerView['pager']> {
  nextLabel: ExplainerPagerWords['nextLabel'];
  backLabel: ExplainerPagerWords['backLabel'];
  /** "2 of 3", already in the reader's language. */
  position: ReturnType<ExplainerPagerWords['positionLabel']>;
}

const FLIP: Record<ExplainerPlacement, ExplainerPlacement> = {
  bottom: 'top',
  top: 'bottom',
  right: 'left',
  left: 'right',
};

/** Measured from the box the bubble is in, never the viewport: a 375 shell on a 1536 desktop gets 280. */
export function explainerCap(
  bounds: ExplainerRect,
  density: ExplainerDensity,
  maxWidth?: number,
): number {
  const available = bounds.right - bounds.left;
  const cap = maxWidth ?? (available < NARROW_BOX ? NARROW_CAP : WIDE_CAP);
  return Math.min(cap, available - GEOMETRY[density].edge * 2);
}

/** A trigger that has left its box takes the bubble with it, rather than pointing at nothing. */
export function isScrolledAway(trigger: ExplainerRect, bounds: ExplainerRect): boolean {
  return (
    trigger.bottom < bounds.top ||
    trigger.top > bounds.bottom ||
    trigger.right < bounds.left ||
    trigger.left > bounds.right
  );
}

/** The preferred side when it fits, the opposite when only that fits, then clamped inside the box. */
export function placeExplainer(
  trigger: ExplainerRect,
  bounds: ExplainerRect,
  bubble: { width: number; height: number },
  placement: ExplainerPlacement,
  density: ExplainerDensity,
): PlacedExplainer {
  const { gap, edge } = GEOMETRY[density];
  const fits: Record<ExplainerPlacement, boolean> = {
    bottom: trigger.bottom + gap + bubble.height <= bounds.bottom - edge,
    top: trigger.top - gap - bubble.height >= bounds.top + edge,
    right: trigger.right + gap + bubble.width <= bounds.right - edge,
    left: trigger.left - gap - bubble.width >= bounds.left + edge,
  };
  const side = !fits[placement] && fits[FLIP[placement]] ? FLIP[placement] : placement;
  const centreX = (trigger.left + trigger.right) / 2;
  const centreY = (trigger.top + trigger.bottom) / 2;

  if (side === 'top' || side === 'bottom') {
    const low = bounds.left + edge;
    const left = clamp(centreX - bubble.width / 2, low, bounds.right - edge - bubble.width);
    return {
      side,
      left,
      top: side === 'bottom' ? trigger.bottom + gap : trigger.top - gap - bubble.height,
      arrow: clamp(centreX - left, ARROW_INSET, bubble.width - ARROW_INSET),
    };
  }
  const low = bounds.top + edge;
  const top = clamp(centreY - bubble.height / 2, low, bounds.bottom - edge - bubble.height);
  return {
    side,
    left: side === 'right' ? trigger.right + gap : trigger.left - gap - bubble.width,
    top,
    arrow: clamp(centreY - top, ARROW_INSET, bubble.height - ARROW_INSET),
  };
}

/** Placed at the width it will draw at: never wider than the cap. */
export function placeCapped(
  trigger: ExplainerRect,
  bounds: ExplainerRect,
  bubble: { width: number; height: number },
  cap: number,
  placement: ExplainerPlacement,
  density: ExplainerDensity,
): PlacedExplainer {
  const size = { width: Math.min(bubble.width, cap), height: bubble.height };
  return placeExplainer(trigger, bounds, size, placement, density);
}

/** The arrow's 12px square, centred on `placed.arrow` along the edge that faces the trigger. */
export function arrowOffset(placed: PlacedExplainer): { left: number } | { top: number } {
  const at = placed.arrow - 6;
  return placed.side === 'top' || placed.side === 'bottom' ? { left: at } : { top: at };
}

/** Never below `low`, even when the box is too small for `high` to sit above it. */
function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(low, value), Math.max(low, high));
}

/* What may never be opened behind a tap (`F8-07`, `F7-35`, `MS10-19`), each with its real home. */
const REFUSED_CHILDREN: Record<string, string> = {
  Provenance: 'Provenance, on the line beside the number',
  ValueSource: "the field's own `attribution` slot",
  Derivation: 'Derivation, opened in flow under the figure',
  DerivationGroup: 'Derivation, opened in flow under the figure',
  Disclosure: 'Disclosure, at the weight of the figures it qualifies',
  DisclosureSet: 'Disclosure, at the weight of the figures it qualifies',
  MoneySummary: 'the screen — the itemised equation is never opened',
  UsageMeter: 'the screen',
  AllocationMeter: 'the screen',
  StatCard: 'the screen — a figure is not teaching',
  BandedFigure: 'the screen — a verdict is not teaching',
  Banner: 'the screen, through BannerStack',
  BannerStack: 'the screen',
  UnavailableNote: "the surface's own unavailable state",
  ActionReason: "the host's declared place for a disabled control's reason",
  ComplianceFloor: 'the action row, permanently',
  PendingAction: 'the row that is being done',
};

export interface ExplainerViolation {
  component: string;
  belongsIn: string;
}

function nameOf(type: unknown): string | null {
  if (typeof type !== 'function') return null;
  const named = type as { displayName?: string; name?: string };
  return named.displayName ?? named.name ?? null;
}

/**
 * Every page child that belongs somewhere else, by name and with its real home. The component
 * warns and still renders what it was given: deleting a caller's content would hide the defect.
 */
export function auditExplainerPages(pages: readonly ReactNode[]): ExplainerViolation[] {
  const hits: ExplainerViolation[] = [];
  const walk = (node: ReactNode) =>
    Children.forEach(node, (child) => {
      if (!isValidElement<{ children?: ReactNode }>(child)) return;
      const name = nameOf(child.type);
      const home = name === null ? undefined : REFUSED_CHILDREN[name];
      if (name !== null && home !== undefined) hits.push({ component: name, belongsIn: home });
      walk(child.props.children);
    });
  walk(pages);
  return hits;
}
