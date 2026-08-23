import type { CSSProperties } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import type { SelectProps } from './Select.types';
import { SelectListbox } from './SelectListbox';
import { handleSelectKey } from './select-keys';
import { normaliseOptions } from './select-options';
import { useSelectPlacement } from './use-select-placement';

interface WebSelectProps extends SelectProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Borderless single-select with an e4 popover listbox. Full keyboard: Up/Down/Home/End, Enter or
 * Space to open and commit, Esc to cancel, type-ahead on the first letter.
 *
 * Focus stays on the trigger — arrow keys move a local `active` index — so every option carries an
 * id and the combobox points at the active one with `aria-activedescendant`. Without that a screen
 * reader user walking the list hears nothing: not the option, not its `aria-disabled`, not the
 * reason it cannot be picked.
 */
export function Select({
  value,
  onChange,
  options = [],
  label,
  placeholder = 'Select an option',
  density = 'expressive',
  disabled = false,
  helper,
  error,
  name,
  ariaLabel,
  className,
  style,
}: WebSelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const place = useSelectPlacement(wrapRef, open);
  const opts = normaliseOptions(options);
  const current = opts.find((option) => option.value === value);
  const autoId = useId();
  const listId = `${autoId}-list`;
  const selectedIndex = opts.findIndex((option) => option.value === value);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the selected index is read ONCE, as the list opens — re-reading it on every value change would fight the arrow keys.
  useEffect(() => {
    if (open) {
      setActive(Math.max(0, selectedIndex));
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (event: MouseEvent) => {
      const wrap = wrapRef.current;
      if (wrap !== null && !wrap.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const commit = (index: number) => {
    const option = opts[index];
    if (option === undefined || option.disabled === true) {
      return;
    }
    onChange?.(option.value);
    setOpen(false);
  };

  return (
    <div className={classNames('hg-select', className)} ref={wrapRef} style={style}>
      {label !== undefined ? (
        <label className="hg-select-label" htmlFor={autoId}>
          {label}
        </label>
      ) : null}
      <button
        className="hg-select-trigger"
        type="button"
        id={autoId}
        name={name}
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={(event) => {
          if (!disabled) {
            handleSelectKey(event, open, { active, commit, options: opts, setActive, setOpen });
          }
        }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={
          open && opts[active] !== undefined ? `${autoId}-o${active}` : undefined
        }
        aria-label={label === undefined ? ariaLabel : undefined}
        data-density={density}
        data-error={error !== undefined}
        data-open={open}
        data-placeholder={current === undefined}
      >
        <span className="hg-select-value">
          {current === undefined ? placeholder : current.label}
        </span>
        <svg
          className="hg-select-chevron"
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
      </button>
      {helper !== undefined || error !== undefined ? (
        <p className="hg-select-message" data-error={error !== undefined}>
          {error ?? helper}
        </p>
      ) : null}
      {open ? (
        <SelectListbox
          activeIndex={active}
          idPrefix={autoId}
          labelText={label ?? ariaLabel}
          listId={listId}
          maxHeight={place.max}
          onActivate={setActive}
          onCommit={commit}
          options={opts}
          up={place.up}
          value={value}
        />
      ) : null}
    </div>
  );
}
