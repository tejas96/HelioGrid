import type { CSSProperties, KeyboardEvent } from 'react';
import { useId, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { OptionCard } from './OptionCard';
import { isPicked, pressOption } from './OptionCardGroup.logic';
import { hasReason } from './OptionCardGroup.options';
import type { OptionCardGroupProps } from './OptionCardGroup.types';

type WebOptionCardGroupProps = OptionCardGroupProps & {
  className?: string;
  /** Lands on the wrapper around the group. */
  style?: CSSProperties;
};

/**
 * Card-shaped choice of a few options that each need a title, an explanation and sometimes a price.
 * Single: a radiogroup, one tab stop, arrow keys move the pick. Multiple: a group of checkboxes, each
 * its own tab stop. Selection is a 2px accent ring plus a filled mark — never colour alone.
 */
export function OptionCardGroup(props: WebOptionCardGroupProps) {
  const {
    options,
    label,
    ariaLabel,
    columns = 1,
    density = 'expressive',
    disabled = false,
    currentLabel,
    error,
    invalid = false,
    describedBy,
    className,
    style,
  } = props;
  const multiple = props.mode === 'multiple';
  const onChange = (value: string) => pressOption(props, value);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const autoId = useId();
  const idx = Math.max(
    0,
    options.findIndex((o) => isPicked(props, o.value)),
  );

  const onKey = (i: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const go = (n: number) => {
      e.preventDefault();
      const step = n > i ? 1 : -1;
      let t = (n + options.length) % options.length;
      let guard = 0;
      /* Skipped only when there is nothing to hear. An option with a stated reason is walked onto,
         and `hasReason` is the same question `OptionCard` asks before going natively disabled. */
      let at = options[t];
      while (at !== undefined && at.disabled === true && !hasReason(at) && guard < options.length) {
        guard += 1;
        t = (t + step + options.length) % options.length;
        at = options[t];
      }
      refs.current[t]?.focus();
      if (at !== undefined && at.disabled !== true) onChange(at.value);
    };
    /* A checkbox is its own tab stop and Space toggles it as the button's own click does. */
    if (multiple) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(i + 1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go(i - 1);
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const here = options[i];
      if (here !== undefined) onChange(here.value);
    }
  };

  return (
    <div className={classNames('hg-option-card-group', className)} style={style}>
      {label !== undefined ? (
        <span id={`${autoId}-lbl`} className="hg-option-card-group-label">
          {label}
        </span>
      ) : null}
      <div
        {...groupRole(multiple, label !== undefined ? `${autoId}-lbl` : undefined, ariaLabel)}
        aria-invalid={error !== undefined || invalid ? true : undefined}
        aria-describedby={error !== undefined ? `${autoId}-err` : describedBy}
        className="hg-option-card-group-list"
        data-error={error !== undefined}
        style={{ '--hg-option-card-columns': columns } as CSSProperties}
      >
        {options.map((o, i) => (
          <OptionCard
            key={o.value}
            option={o}
            selected={isPicked(props, o.value)}
            mode={multiple ? 'multiple' : 'single'}
            off={disabled || o.disabled === true}
            density={density}
            tabIndex={multiple || i === idx ? 0 : -1}
            cardRef={(el) => {
              refs.current[i] = el;
            }}
            onSelect={() => onChange(o.value)}
            onKeyDown={(e) => onKey(i, e)}
            currentLabel={currentLabel}
          />
        ))}
      </div>
      {error !== undefined ? (
        <span id={`${autoId}-err`} className="hg-option-card-group-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** The list's role and name: a radiogroup, or a group of checkboxes, named by its line or `ariaLabel`. */
function groupRole(
  multiple: boolean,
  labelledBy: string | undefined,
  ariaLabel: string | undefined,
) {
  return {
    role: multiple ? 'group' : 'radiogroup',
    'aria-labelledby': labelledBy,
    'aria-label': labelledBy === undefined ? ariaLabel : undefined,
  } as const;
}
