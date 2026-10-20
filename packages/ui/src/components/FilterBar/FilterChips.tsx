import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { useImperativeHandle, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import type { FilterChipsProps } from './FilterBar.types';
import { optionIcon, optionLabel, optionValue } from './FilterBar.types';

interface WebFilterChipsProps extends FilterChipsProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The roving tabindex only ever needs to move focus, so the refs are held as "a thing that can be
 * focused". A sibling component importing this folder through its barrel drags this web half into
 * the native TypeScript project, which has no DOM lib; naming the one capability used keeps the
 * behaviour identical and the file compiling in both.
 */
type Focusable = { focus: () => void };

/** An option's 18px glyph before its label, in the chip's ink — drawn only when there is one. */
export function OptionIcon({ icon }: { icon: ReactNode }) {
  if (!icon) return null;
  return (
    <span className="hg-filter-icon" aria-hidden="true">
      {icon}
    </span>
  );
}

/**
 * Kind and stage chips: 44px pills — the pill is the target — in the control fill, flat, with an
 * optional 18px glyph before the label; the chosen one is the near-black primary marker with
 * white words. Roving tabindex: one stop in the tab order, arrow keys move between chips.
 *
 * **One-of-N by construction**: `role="tablist"` + `aria-selected`, and its arrow keys change the
 * selection as they move, because in a stage strip moving the highlight *is* choosing. A dimension
 * that holds **several** values takes `FacetChips` — a tablist cannot express a set without lying
 * to a screen reader about it.
 *
 * **And a tablist is named.** `label` is the accessible name; `labelledBy` points at a name already
 * on the screen, which is the better of the two whenever one exists.
 */
export function FilterChips({
  options,
  value,
  onChange,
  counts,
  scroll = false,
  label,
  labelledBy,
  ref,
  className,
  style,
}: WebFilterChipsProps) {
  const refs = useRef<(Focusable | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => optionValue(option) === value),
  );
  /* Read when the focus lands, not when it was asked for: a caller asks in the same turn it chooses
     the chip, before this renders it chosen. */
  const chosen = useRef(selectedIndex);
  chosen.current = selectedIndex;
  useImperativeHandle(
    ref,
    () => ({ focus: () => setTimeout(() => refs.current[chosen.current]?.focus(), 0) }),
    [],
  );

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const go = (next: number) => {
      event.preventDefault();
      const target = (next + options.length) % options.length;
      refs.current[target]?.focus();
      const option = options[target];
      if (option !== undefined) onChange?.(optionValue(option));
    };
    if (event.key === 'ArrowRight') go(index + 1);
    else if (event.key === 'ArrowLeft') go(index - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(options.length - 1);
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      aria-label={labelledBy === undefined ? label : undefined}
      aria-labelledby={labelledBy}
      className={classNames('hg-filter-chips', className)}
      data-scroll={scroll ? 'true' : undefined}
      style={style}
    >
      {options.map((option, index) => {
        const optValue = optionValue(option);
        const active = optValue === value;
        const count = counts?.[optValue];
        const icon = optionIcon(option);
        return (
          <button
            key={optValue}
            ref={(element) => {
              refs.current[index] = element as unknown as Focusable | null;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={index === selectedIndex ? 0 : -1}
            className="hg-filter-target"
            onKeyDown={(event) => onKeyDown(index, event)}
            onClick={() => onChange?.(optValue)}
          >
            <span
              className="hg-filter-pill"
              data-pill="chip"
              data-active={active ? 'true' : undefined}
              data-lead={icon ? 'true' : undefined}
            >
              <OptionIcon icon={icon} />
              {optionLabel(option)}
              {count === undefined ? null : <span className="hg-filter-count">{count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
