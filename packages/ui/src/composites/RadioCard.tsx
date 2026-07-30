'use client';
import * as RadioGroup from '@radix-ui/react-radio-group';
import type { ReactNode } from 'react';
import { IconCircle } from '../data/Card';
import './RadioCard.css';

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

/**
 * Composition allowlist: options, value, onChange, label. Selectable card group
 * (whatyousell.md §2/§4): Card surface + IconCircle + 24px check indicator with real
 * radiogroup/radio semantics. Radix radio-group core (roving focus, arrow keys) —
 * the SegmentedControl precedent.
 */
export interface RadioCardProps {
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible group name — required (a11y contract). */
  label: string;
}

export function RadioCard({ options, value, onChange, label }: RadioCardProps) {
  return (
    <RadioGroup.Root
      className="ui-radio-card-group"
      aria-label={label}
      value={value}
      onValueChange={onChange}
    >
      {options.map((option) => (
        <RadioGroup.Item key={option.value} value={option.value} className="ui-radio-card">
          {option.icon ? <IconCircle icon={option.icon} /> : null}
          <span className="ui-radio-card-body">
            <span className="ui-radio-card-title">{option.label}</span>
            {option.description ? (
              <span className="ui-radio-card-desc">{option.description}</span>
            ) : null}
          </span>
          <span className="ui-radio-card-indicator">
            {/* indicator glyph at stroke 2 — the Checkbox indicator precedent (mockup 2.4, whatyousell.md conflict 9) */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 7.5 5.8 10.3 11 4.2" />
            </svg>
          </span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
