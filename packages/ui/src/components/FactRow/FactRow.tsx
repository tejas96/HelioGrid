import type { CSSProperties, ReactNode, RefObject } from 'react';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderGap } from '../NamedGap/NamedGap';
import { renderProvenance } from '../Provenance/Provenance';
import {
  contentSignature,
  FACT_DASH,
  FACT_JOIN,
  FACT_LEAD_BELOW,
  FACT_LONG_AT,
  FACT_MEASURE,
  FACT_WRAP_LINES,
  gapWithName,
  isUnderFloor,
  rowShape,
  shapeOf,
  useAnswerReport,
  useFactGround,
  useGapDropsTier,
} from './FactRow.logic';
import type {
  FactDensity,
  FactInkKind,
  FactRowForm,
  FactRowProps,
  FactShape,
} from './FactRow.types';

export interface WebFactRowProps extends FactRowProps {
  className?: string;
  style?: CSSProperties;
}

/** The measure reaches the stylesheet as a number of characters; `ch` resolves there. */
export type FactVars = CSSProperties & Record<`--${string}`, string>;

/**
 * THE BOX, AND THE SIGNAL TO ASK AGAIN. `width` is `null` until the box has a size — 0 is not
 * "narrow", it is no measurement — and `gen` counts the re-arms: when the box first gets a size, on
 * every later resize, and when the fonts finish loading, because `font-display: swap` paints first
 * in a wider fallback and the swap never resizes the box. One source, the border box, so the
 * form's own padding never reads as a resize.
 */
export function useBoxProbe(ref: RefObject<HTMLElement | null>): {
  width: number | null;
  gen: number;
} {
  const [box, setBox] = useState<{ width: number | null; gen: number }>({ width: null, gen: 0 });
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    let live = true;
    let last: number | null = null;
    const read = () => {
      const raw = element.getBoundingClientRect().width;
      if (!live || !(raw > 0)) return;
      if (last !== null && Math.abs(raw - last) < 0.5) return;
      last = raw;
      setBox((previous) => ({ width: raw, gen: previous.gen + 1 }));
    };
    const again = () => {
      last = null;
      read();
    };
    read();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
    observer?.observe(element);
    const fonts = document.fonts;
    fonts.ready.then(again).catch(() => undefined);
    fonts.addEventListener('loadingdone', again);
    return () => {
      live = false;
      observer?.disconnect();
      fonts.removeEventListener('loadingdone', again);
    };
  }, [ref]);
  return box;
}

/** One value's own words: a gap's sentence, not the 44px target of its fill act. */
function valueWraps(value: HTMLElement): boolean {
  const words = value.querySelector<HTMLElement>('.hg-named-gap-words') ?? value;
  const line = Number.parseFloat(getComputedStyle(words).lineHeight);
  return words.getBoundingClientRect().height > line * FACT_WRAP_LINES;
}

/**
 * THE FIT ANSWER, FOR ONE SIGNATURE — never a latch. `fits` is true while the question is open,
 * which keeps the pair the optimistic default and stops a flash through the full-width form; a
 * box with no size records nothing. `answered` says whether there is a form worth publishing.
 */
export function useFits(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  signature: string,
): { fits: boolean; answered: boolean } {
  const [answer, setAnswer] = useState<{ signature: string; fits: boolean } | null>(null);
  const answered = answer !== null && answer.signature === signature;
  useLayoutEffect(() => {
    const element = ref.current;
    if (!active || answered || element === null) return;
    if (!(element.getBoundingClientRect().width > 0)) return;
    const values = Array.from(element.querySelectorAll<HTMLElement>('[data-fact-value]'));
    setAnswer({ signature, fits: !values.some(valueWraps) });
  });
  return { fits: answer !== null && answered ? answer.fits : true, answered };
}

function FactList({ items, stacked }: { items: ReactNode[]; stacked: boolean }) {
  if (stacked) {
    return (
      <span className="hg-fact-stack">
        {items.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: items are positional; a caller's list has no ids
          <span key={i}>{item}</span>
        ))}
      </span>
    );
  }
  return (
    <span>
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: items are positional; a caller's list has no ids
        <Fragment key={i}>
          {i > 0 ? (
            <span aria-hidden="true" className="hg-fact-join">
              {FACT_JOIN}
            </span>
          ) : null}
          {item}
        </Fragment>
      ))}
    </span>
  );
}

interface FactRowBodyProps extends WebFactRowProps {
  shape: FactShape;
  items: ReactNode[] | null;
  stacked: boolean;
  hasMarkCol: boolean;
  density: FactDensity;
  ink: FactInkKind;
}

/** One `<dt>`/`<dd>` pair in the shape its group or its own box decided. */
function FactRowBody(props: FactRowBodyProps) {
  const { label, value, items, stacked, mark, provenance, gap, fieldName, shape } = props;
  const gapNode = gap ? renderGap(gapWithName(gap, fieldName, label), { scale: 'field' }) : null;
  const tier = gapNode
    ? null
    : renderProvenance(provenance, { size: 12, inline: shape === 'flow' });
  const listNode =
    items !== null && items.length > 0 ? <FactList items={items} stacked={stacked} /> : null;
  return (
    <div
      className={classNames('hg-fact-row', props.className)}
      data-fact-form={shape}
      data-density={props.density}
      data-has-mark={props.hasMarkCol ? 'true' : undefined}
      data-ink={props.ink}
      style={props.style}
    >
      <dt className="hg-fact-term">
        {mark ? <span className="hg-fact-mark">{mark}</span> : null}
        <span className="hg-fact-word">{label}</span>
      </dt>
      <dd className="hg-fact-detail">
        {shape === 'flow' ? (
          <span aria-hidden="true" className="hg-fact-dash">
            {FACT_DASH}
          </span>
        ) : null}
        {/* Its own box, never a bare text node: the fit test asks whether the VALUE wraps. */}
        <span className="hg-fact-value" data-fact-value="">
          {gapNode ?? listNode ?? value}
        </span>
        {tier ? <span className="hg-fact-provenance">{tier}</span> : null}
      </dd>
    </div>
  );
}

/** A row on its own: it measures its own box, exactly as a group measures its rows. */
function FactRowAlone(props: WebFactRowProps & { ink: FactInkKind }) {
  const {
    measure = FACT_MEASURE,
    leadBelow = FACT_LEAD_BELOW,
    longAt = FACT_LONG_AT,
    form: forced = 'auto',
    density = 'expressive',
    onFormChange,
  } = props;
  const ref = useRef<HTMLDListElement>(null);
  const { width, gen } = useBoxProbe(ref);
  const { items, stacked, declaredLong } = rowShape(props, longAt);
  const floor = isUnderFloor(width, leadBelow);
  const { fits, answered } = useFits(
    ref,
    forced === 'auto' && !declaredLong && !floor,
    `${gen}|${contentSignature([props])}`,
  );
  const lead = forced !== 'auto' ? forced === 'lead' : declaredLong || floor || !fits;
  const shape = shapeOf(lead, stacked);
  const settled = forced !== 'auto' || declaredLong || floor || answered;
  const answer: FactRowForm | null =
    settled && width !== null
      ? { form: lead ? 'lead' : 'pair', shape, width, hasMark: Boolean(props.mark) }
      : null;
  useAnswerReport(answer, shape, onFormChange);
  const vars: FactVars = { '--hg-fact-measure': String(measure) };
  return (
    <dl
      ref={ref}
      className="hg-fact-alone"
      data-fact-alone-form={lead ? 'lead' : 'pair'}
      data-density={density}
      style={vars}
    >
      <FactRowBody
        {...props}
        items={items}
        stacked={stacked}
        shape={shape}
        hasMarkCol={Boolean(props.mark)}
        density={density}
      />
    </dl>
  );
}

/**
 * **One label, one value — the one form for data on a screen.** A `<dt>`/`<dd>` pair in one of two
 * arrangements, chosen by whether the value fits, never by how wide the screen is: `pair` while it
 * fits on one line in its own column, `lead` — one line that wraps — when it would not.
 */
export function FactRow(props: WebFactRowProps) {
  const ground = useFactGround();
  useGapDropsTier(props.gap, props.provenance, props.label);
  const group = ground.group;
  if (group === undefined) return <FactRowAlone {...props} ink={ground.ink} />;
  const { items, stacked } = rowShape(props, group.longAt);
  const forced = props.form ?? 'auto';
  const lead = forced !== 'auto' ? forced === 'lead' : group.form === 'lead';
  return (
    <FactRowBody
      {...props}
      items={items}
      stacked={stacked}
      shape={shapeOf(lead, stacked)}
      hasMarkCol={group.hasMark}
      density={props.density ?? group.density}
      ink={ground.ink}
    />
  );
}
