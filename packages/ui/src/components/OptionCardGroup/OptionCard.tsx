// biome-ignore-all lint/a11y/useSemanticElements: the CARD is the radio — an
// <input type="radio"> cannot hold a title row, a price, a description and a feature list.

import type { KeyboardEvent, Ref } from 'react';
import { StatusMark } from '../../primitives/StatusMark';
import { renderActionReason } from '../ActionReason';
import type { OptionCardItem } from './OptionCardGroup.types';

interface OptionCardProps {
  option: OptionCardItem;
  selected: boolean;
  /** The group is off, or this option is. */
  off: boolean;
  density: 'expressive' | 'functional';
  tabIndex: number;
  cardRef: Ref<HTMLButtonElement>;
  onSelect: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  /** The group's word for `current`, unless the option overrides it. */
  currentLabel: string;
}

/**
 * One card. The card IS the radio, which is why `content` is static by contract: a focusable
 * child would be a button inside a button.
 */
export function OptionCard({
  option,
  selected,
  off,
  density,
  tabIndex,
  cardRef,
  onSelect,
  onKeyDown,
  currentLabel,
}: OptionCardProps) {
  /* An option with a stated reason stays in the walk and is aria-disabled rather than natively
     disabled — otherwise the reason it cannot be chosen is unreachable. A sentence, a spec or a
     ready node, all through ActionReason, which is what `ReactNode | ActionReasonSpec` buys. */
  const reason = off ? renderActionReason(option.disabledReason) : null;
  const inert = off && reason === null;
  return (
    <button
      ref={cardRef}
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      disabled={inert}
      aria-disabled={off || undefined}
      className="hg-option-card"
      data-density={density}
      data-selected={selected}
      data-off={off}
      onClick={() => {
        if (!off) onSelect();
      }}
      onKeyDown={onKeyDown}
    >
      <span className="hg-option-card-dot" data-selected={selected} aria-hidden="true">
        {selected ? <span className="hg-option-card-dot-fill" /> : null}
      </span>
      <span className="hg-option-card-body">
        <span className="hg-option-card-head">
          <span className="hg-option-card-titles">
            <span className="hg-option-card-title" lang={option.lang}>
              {option.title}
            </span>
            {/* A word, in its own pill — not the accent, which is what selection uses.
                mark={false}: the words ARE the channel here, and the selection dot next to it
                is the mark that carries state (StatusMark.mark). */}
            {option.current === true ? (
              <StatusMark tone="neutral" mark={false} label={option.currentLabel ?? currentLabel} />
            ) : null}
            {option.marks}
          </span>
          {option.price !== undefined ? (
            <span className="hg-option-card-price">{option.price}</span>
          ) : null}
        </span>
        {option.description !== undefined ? (
          <span className="hg-option-card-description" lang={option.lang}>
            {option.description}
          </span>
        ) : null}
        {reason === null ? null : <span className="hg-option-card-reason">{reason}</span>}
        {option.content !== undefined ? (
          <span className="hg-option-card-content">{option.content}</span>
        ) : null}
        {option.meta !== undefined ? (
          <span className="hg-option-card-meta">{option.meta}</span>
        ) : null}
      </span>
      {option.icon !== undefined ? (
        <span className="hg-option-card-icon">{option.icon}</span>
      ) : null}
    </button>
  );
}
