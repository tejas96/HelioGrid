import type { CSSProperties, KeyboardEvent } from 'react';
import { useId, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { OptionCard } from './OptionCard';
import { hasReason } from './OptionCardGroup.options';
import type { OptionCardGroupProps } from './OptionCardGroup.types';

interface WebOptionCardGroupProps extends OptionCardGroupProps {
  className?: string;
  /** Lands on the wrapper around the radiogroup. */
  style?: CSSProperties;
}

/**
 * Card-shaped radiogroup: pick one of a few options that each need a title, an explanation and
 * sometimes a price. One tab stop, arrow keys move the selection. Selection is a 2px accent ring
 * plus a filled dot — never colour alone.
 */
export function OptionCardGroup({
  options,
  value,
  onChange,
  label,
  columns = 1,
  density = 'expressive',
  disabled = false,
  currentLabel = 'Current plan',
  error,
  className,
  style,
}: WebOptionCardGroupProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const autoId = useId();
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
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
      if (at !== undefined && at.disabled !== true) onChange?.(at.value);
    };
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(i + 1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go(i - 1);
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const here = options[i];
      if (here !== undefined) onChange?.(here.value);
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
        role="radiogroup"
        aria-labelledby={label !== undefined ? `${autoId}-lbl` : undefined}
        aria-invalid={error !== undefined ? true : undefined}
        aria-describedby={error !== undefined ? `${autoId}-err` : undefined}
        className="hg-option-card-group-list"
        data-error={error !== undefined}
        style={{ '--hg-option-card-columns': columns } as CSSProperties}
      >
        {options.map((o, i) => (
          <OptionCard
            key={o.value}
            option={o}
            selected={o.value === value}
            off={disabled || o.disabled === true}
            density={density}
            tabIndex={i === idx ? 0 : -1}
            cardRef={(el) => {
              refs.current[i] = el;
            }}
            onSelect={() => onChange?.(o.value)}
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
