import type { CSSProperties, KeyboardEvent } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { Icon } from '../../primitives/Icon';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { FacetChipsProps } from './FilterBar.types';
import { optionIcon, optionLabel, optionValue } from './FilterBar.types';
import { OptionIcon } from './FilterChips';

interface WebFacetChipsProps extends FacetChipsProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The roving focus only ever needs to move focus, so the refs are held as "a thing that can be
 * focused" — see `FilterChips`, which shares the reason: a barrel import from a sibling's native
 * half drags this web file into the no-DOM TypeScript project.
 */
type Focusable = { focus: () => void };

/** The tick is the second, non-colour channel — a set has to be readable without hue. */
function Tick() {
  return (
    <Icon size="sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>Selected</title>
        <ShellGlyphMarks name="tick" />
      </svg>
    </Icon>
  );
}

/**
 * **Multi-select chips — how a dimension holds several values.** The kind chips' 44px pill — the
 * pill is the target. Selected chips take the near-black primary fill *and a tick*, so a set is
 * readable without hue; an option's 18px glyph shows only while it is not selected, where the tick
 * takes its place.
 *
 * **The keyboard differs from `FilterChips` deliberately:** `role="group"` with `aria-pressed`,
 * arrows move focus and change nothing, Space/Enter toggles. In a set, moving and choosing are
 * different acts — an arrow that toggled would make the fourth chip unreachable without selecting
 * the second and third on the way.
 */
export function FacetChips({
  options,
  values = [],
  onChange,
  counts,
  label,
  scroll = false,
  className,
  style,
}: WebFacetChipsProps) {
  const refs = useRef<(Focusable | null)[]>([]);
  const selected = new Set(values);
  const firstStop = Math.max(
    0,
    options.findIndex((option) => selected.has(optionValue(option))),
  );

  const toggle = (optValue: string) => {
    if (onChange === undefined) return;
    onChange(selected.has(optValue) ? values.filter((x) => x !== optValue) : [...values, optValue]);
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const go = (next: number) => {
      event.preventDefault();
      refs.current[(next + options.length) % options.length]?.focus();
    };
    if (event.key === 'ArrowRight') go(index + 1);
    else if (event.key === 'ArrowLeft') go(index - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(options.length - 1);
  };

  return (
    /* <fieldset> IS role="group" — the semantics the design system asked for, in the native
       element. Its default border, margin and min-inline-size are reset in FilterBar.css. */
    <fieldset
      aria-label={label}
      className={classNames('hg-facet-chips', className)}
      data-scroll={scroll ? 'true' : undefined}
      style={style}
    >
      {options.map((option, index) => {
        const optValue = optionValue(option);
        const on = selected.has(optValue);
        const count = counts?.[optValue];
        const icon = on ? undefined : optionIcon(option);
        return (
          <button
            key={optValue}
            ref={(element) => {
              refs.current[index] = element as unknown as Focusable | null;
            }}
            type="button"
            aria-pressed={on}
            tabIndex={index === firstStop ? 0 : -1}
            className="hg-filter-target"
            onKeyDown={(event) => onKeyDown(index, event)}
            onClick={() => toggle(optValue)}
          >
            <span
              className="hg-filter-pill"
              data-pill="chip"
              data-active={on ? 'true' : undefined}
              data-lead={on || icon ? 'true' : undefined}
            >
              {on ? <Tick /> : null}
              <OptionIcon icon={icon} />
              {optionLabel(option)}
              {count === undefined ? null : <span className="hg-filter-count">{count}</span>}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
