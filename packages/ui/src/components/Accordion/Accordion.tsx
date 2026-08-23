import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderMarks } from '../ChipGroup';
import type { ProvenanceProps } from '../Provenance';
import { renderProvenance } from '../Provenance';
import type { AccordionItem, AccordionProps } from './Accordion.types';
import { accordionStateWord, markedState } from './Accordion.types';
import { useAccordion } from './useAccordion';

interface WebAccordionProps extends AccordionProps {
  className?: string;
  style?: CSSProperties;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className="hg-accordion-chevron"
      data-open={open ? 'true' : undefined}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function HeaderFacts({ item }: { item: AccordionItem }) {
  const word = accordionStateWord(item);
  const marked = markedState(item);
  return (
    <>
      {word !== undefined ? (
        <span className="hg-accordion-state">
          {marked !== undefined ? <span aria-hidden="true" className="hg-accordion-dot" /> : null}
          {word}
        </span>
      ) : null}
      {item.meta !== undefined ? <span className="hg-accordion-meta">{item.meta}</span> : null}
      {item.total !== undefined && item.total !== null ? (
        <span className="hg-accordion-total">{item.total}</span>
      ) : null}
      <span className="hg-accordion-tier">
        {renderProvenance(item.provenance as ProvenanceProps | ReactNode, { size: 12 })}
      </span>
    </>
  );
}

/**
 * Collapsible sections for long forms and settings. Up/Down move between headers, Home/End jump to
 * the ends. `multiple` lets several stay open; the default is one at a time.
 */
export function Accordion({
  items,
  value,
  onChange,
  multiple = false,
  defaultOpen = [],
  openWithErrors = true,
  density = 'expressive',
  className,
  style,
}: WebAccordionProps) {
  const { openList, toggle } = useAccordion({
    items,
    value,
    onChange,
    multiple,
    defaultOpen,
    openWithErrors,
  });
  const headers = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const go = (next: number) => {
      event.preventDefault();
      headers.current[(next + items.length) % items.length]?.focus();
    };
    if (event.key === 'ArrowDown') go(index + 1);
    else if (event.key === 'ArrowUp') go(index - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(items.length - 1);
  };

  return (
    <div className={classNames('hg-accordion', className)} data-density={density} style={style}>
      {items.map((item, index) => {
        const isOpen = openList.includes(item.key);
        return (
          <section
            className="hg-accordion-item"
            data-state={
              item.state !== undefined && item.state !== 'default' ? item.state : undefined
            }
            key={item.key}
          >
            <div className="hg-accordion-head">
              <h3 className="hg-accordion-heading">
                <button
                  ref={(element) => {
                    headers.current[index] = element;
                  }}
                  type="button"
                  className="hg-accordion-toggle"
                  data-has-action={item.action !== undefined ? 'true' : undefined}
                  aria-expanded={isOpen}
                  aria-controls={`${item.key}-panel`}
                  aria-invalid={item.state === 'errors' ? true : undefined}
                  onClick={() => toggle(item.key)}
                  onKeyDown={(event) => onKeyDown(index, event)}
                >
                  <Chevron open={isOpen} />
                  <span className="hg-accordion-title-wrap">
                    <span className="hg-accordion-title">{item.title}</span>
                    {renderMarks(item.marks)}
                  </span>
                  <HeaderFacts item={item} />
                </button>
              </h3>
              {/* A sibling of the toggle, never inside it. */}
              {item.action !== undefined ? (
                <div className="hg-accordion-action">{item.action}</div>
              ) : null}
            </div>
            {isOpen ? (
              <section id={`${item.key}-panel`} className="hg-accordion-panel">
                {item.content}
              </section>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
