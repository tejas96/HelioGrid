import type { CSSProperties, KeyboardEvent } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderProvenance } from '../Provenance';
import { visibleRange } from './CompareGrid.logic';
import type { CompareGridProps, CompareOption } from './CompareGrid.types';
import { CompareGridFooter } from './CompareGridFooter';
import { CompareGridStatePanel } from './CompareGridStatePanel';
import { CompareGridTable } from './CompareGridTable';

interface WebCompareGridProps<Opt extends CompareOption> extends CompareGridProps<Opt> {
  className?: string;
  style?: CSSProperties;
}

/** Which way an arrow key moves the option axis, or null for a key that is not ours. */
function arrowStep(key: string): number | null {
  if (key === 'ArrowRight') return 1;
  if (key === 'ArrowLeft') return -1;
  return null;
}

/**
 * **Compare 2–4 options attribute by attribute, at every width.**
 *
 * **Why this is not a horizontally-scrolling table of records.** A `DataTable`'s rows are records
 * and its columns are fields, so scrolling it sideways hides fields of the record you are reading.
 * A comparison transposes both axes — **the record is the column and the attribute is the row** —
 * so scrolling sideways moves *between records* and hides nothing about any record on screen:
 * every attribute row stays rendered, stays aligned and keeps its label, because the attribute
 * column is **pinned**. This is the one component in the system with a horizontal scroller, it
 * scrolls its **option** axis only, and it is **never used for records**.
 *
 * **It never stacks**, so there is no `stackBelow` — one variant at a time is not a comparison.
 * The option axis is operable without a touch screen: the scroller takes arrow keys and carries
 * real 44px previous/next controls, and a readout says where the reader is.
 */
export function CompareGrid<Opt extends CompareOption = CompareOption>({
  attributes,
  options,
  selectedKey,
  onSelect,
  selectLabel = 'Choose',
  selectedLabel = 'Selected',
  currentLabel = 'Current',
  caption,
  provenance,
  note,
  columnWidth = 196,
  labelWidth = 128,
  state = 'ready',
  emptyTitle = 'Nothing to compare yet',
  emptyMessage = 'Generate at least two variants and they line up here side by side.',
  errorTitle = "Couldn't load the comparison",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'Not comparable here',
  unavailableMessage,
  density = 'expressive',
  className,
  style,
}: WebCompareGridProps<Opt>) {
  const scroller = useRef<HTMLFieldSetElement>(null);
  const [position, setPosition] = useState({ scrollable: false, first: 1, last: 1 });
  const captionId = useId();

  /* The readout and the previous/next controls both need to know whether the option axis actually
     overflows — on a wide screen four columns fit and neither should appear. */
  const measure = useCallback(() => {
    const element = scroller.current;
    if (element === null || options.length === 0) return;
    const range = visibleRange(
      element.scrollLeft,
      element.clientWidth,
      labelWidth,
      columnWidth,
      options.length,
    );
    setPosition({
      scrollable: element.scrollWidth - element.clientWidth > 4,
      first: range.first,
      last: range.last,
    });
  }, [options.length, columnWidth, labelWidth]);

  useEffect(() => {
    measure();
    const element = scroller.current;
    if (element === null || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  const nudge = (direction: number) => {
    scroller.current?.scrollBy({ left: direction * columnWidth, behavior: 'smooth' });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLFieldSetElement>) => {
    const direction = arrowStep(event.key);
    if (direction === null) return;
    event.preventDefault();
    nudge(direction);
  };

  const shellStyle = {
    ...style,
    '--hg-compare-col': `${columnWidth}px`,
    '--hg-compare-label': `${labelWidth}px`,
  } as CSSProperties;

  const shell = classNames('hg-compare', className);
  /* An empty caption names nothing, so it neither draws an overline nor becomes the table's
     accessible name — an empty name is worse than no name. */
  const captioned = caption !== undefined && caption !== '';
  const captionNode = captioned ? (
    <div className="hg-compare-caption" id={captionId}>
      {caption}
    </div>
  ) : null;
  /* One provenance statement for the whole comparison. A SPEC, not a node: `renderProvenance`
     owns the tier's word and mark, and returns null when the spec would say nothing. */
  const provenanceFoot = renderProvenance(provenance, { size: 12 });

  /* No grid to draw — because a state blocks it, or because there is nothing to line up. What
     stands in its place is the state panel's decision, not this shell's. */
  if (state !== 'ready' || options.length === 0 || attributes.length === 0) {
    return (
      <div className={shell} data-density={density} style={shellStyle}>
        {captionNode}
        <CompareGridStatePanel
          state={state}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          unavailableTitle={unavailableTitle}
          unavailableMessage={unavailableMessage}
        />
      </div>
    );
  }

  return (
    <div className={shell} data-density={density} style={shellStyle}>
      {captionNode}

      {/* <fieldset> IS role="group" — the semantics this needs, in the native element. Its
          default border, margin and min-inline-size are reset in CompareGrid.css. */}
      <fieldset
        ref={scroller}
        className="hg-compare-scroller"
        aria-label={`Compare ${options.length} options`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the scroller is deliberately focusable — the option axis must be operable without a touch screen, which is what the arrow-key handler is for.
        tabIndex={0}
        onScroll={measure}
        onKeyDown={onKeyDown}
      >
        <CompareGridTable
          attributes={attributes}
          options={options}
          selectedKey={selectedKey}
          onSelect={onSelect}
          selectLabel={selectLabel}
          selectedLabel={selectedLabel}
          currentLabel={currentLabel}
          captionId={captioned ? captionId : undefined}
        />
      </fieldset>

      <CompareGridFooter
        scrollable={position.scrollable}
        first={position.first}
        last={position.last}
        count={options.length}
        note={note}
        onStep={nudge}
      />

      {provenanceFoot === null ? null : (
        <div className="hg-compare-provenance-foot">{provenanceFoot}</div>
      )}
    </div>
  );
}
