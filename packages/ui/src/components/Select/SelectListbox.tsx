import type { ReactNode } from 'react';
import { renderActionReason } from '../ActionReason';
import type { SelectOption } from './Select.types';

interface SelectListboxProps {
  /** Index the trigger's `aria-activedescendant` points at. */
  activeIndex: number;
  /** `${autoId}-o${index}` builds each option id; the trigger points at the walked one. */
  idPrefix: string;
  labelText?: string;
  listId: string;
  /** Tallest the list may be inside the space that is actually visible. */
  maxHeight: number;
  onActivate: (index: number) => void;
  onCommit: (index: number) => void;
  options: readonly SelectOption[];
  up: boolean;
  value?: string;
}

/**
 * The e4 popover listbox. Options are 44px, a disabled one keeps `aria-disabled` and a readable
 * label, and its reason is the SECOND LINE of the row — never a tooltip, never the label.
 *
 * The reason goes through `ActionReason`, which owns the barred-circle second channel and the
 * `--text-secondary` words: one treatment for every host that states why a control is off.
 */
export function SelectListbox({
  activeIndex,
  idPrefix,
  labelText,
  listId,
  maxHeight,
  onActivate,
  onCommit,
  options,
  up,
  value,
}: SelectListboxProps) {
  return (
    <ul
      className="hg-select-list"
      id={listId}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the reference markup is a <ul role="listbox"> — the combobox's popup, whose keys are handled on the trigger.
      role="listbox"
      tabIndex={-1}
      aria-label={labelText}
      data-up={up}
      style={{ maxHeight }}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const disabled = option.disabled === true;
        const reason: ReactNode = disabled ? renderActionReason(option.disabledReason) : null;
        const hasReason = reason !== null;
        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: keys are handled on the combobox trigger, which never loses focus.
          // biome-ignore lint/a11y/useFocusableInteractive: an aria-activedescendant listbox must NOT put its options in the tab order — the trigger keeps focus and points at the walked option.
          <li
            key={option.value}
            className="hg-select-option"
            id={`${idPrefix}-o${index}`}
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the reference markup is a <li role="option"> inside the listbox.
            role="option"
            aria-selected={selected}
            aria-disabled={disabled ? true : undefined}
            data-active={index === activeIndex && !disabled}
            data-reason={hasReason}
            data-selected={selected}
            onMouseEnter={() => onActivate(index)}
            onClick={() => onCommit(index)}
          >
            <span className="hg-select-option-line">
              <span className="hg-select-option-label">{option.label}</span>
              {selected ? (
                <svg
                  className="hg-select-tick"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : null}
            </span>
            {/* The reason is the second line — never the label, and never a tooltip. */}
            {reason}
          </li>
        );
      })}
    </ul>
  );
}
