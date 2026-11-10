import type { TranslatedText } from '@heliogrid/contracts';
import { Pressable } from '../../primitives/Pressable';
import { Button } from '../Button';
import { Chip } from '../Chip';
import type { CalendarValue } from '../DatePicker/DatePicker.types';

/** One choice of a set, as a chip: an outcome, a reason. */
export interface ChoiceOption<V extends string> {
  readonly value: V;
  readonly label: TranslatedText;
}

/** One answer of a closed set, picked by a chip — a radio group, so the pick is spoken. */
export function ChoiceChips<V extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: TranslatedText;
  options: readonly ChoiceOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
  disabled: boolean;
}) {
  return (
    <div className="hg-lead-act-choices">
      <span className="hg-lead-act-label">{label}</span>
      <div className="hg-lead-act-chips" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            className="hg-chip-target hg-chip-target--expressive"
            accessibilityRole="radio"
            accessibilityState={{ checked: value === option.value }}
            disabled={disabled}
            haptic="selection"
            onPress={() => onChange(option.value)}
          >
            <Chip active={value === option.value}>{option.label}</Chip>
          </Pressable>
        ))}
      </div>
    </div>
  );
}

/**
 * A form's send, and above it why the last one came back undone. It sleeps until the form holds
 * what the act needs, and while the send is out it spins and a second press sends nothing.
 */
export function ActSend({
  label,
  ready,
  pending,
  failure,
  onSend,
  destructive = false,
}: {
  label: TranslatedText;
  ready: boolean;
  pending: boolean;
  failure: TranslatedText | null;
  onSend: () => void;
  destructive?: boolean;
}) {
  return (
    <div className="hg-lead-act-send">
      {failure === null ? null : (
        <p className="hg-lead-act-failure" role="alert">
          {failure}
        </p>
      )}
      <Button
        variant={destructive ? 'destructive' : 'primary'}
        size="lg"
        fullWidth
        disabled={!ready}
        loading={pending}
        onClick={() => {
          if (ready && !pending) onSend();
        }}
      >
        {label}
      </Button>
    </div>
  );
}

/** A single day out of a date picker's value; a range or a set is not a day. */
export function dayOf(value: CalendarValue): string | null {
  return typeof value === 'string' ? value : null;
}
