import { createTranslator, provenanceWords } from '@heliogrid/i18n';
import { NumberField, type ProvenanceEmphasis, ProvenanceWordsProvider } from '@heliogrid/ui';
import { useState } from 'react';

const en = await createTranslator('en');

/**
 * A number field as a screen holds it: the figure lives here, in the browser, and arrives only
 * through `onCommit` — a value handed to `mount` never changes. The tier line's words come from
 * `provenanceWords`, mounted once as every app root mounts them.
 */
export function HeldNumberField({
  label,
  unit,
  initial,
  min,
  steppers = false,
  tier = false,
  emphasis,
  asTyped = false,
  clears = false,
  currency = false,
}: {
  label: string;
  unit: string;
  /** None: the field starts unset. */
  initial?: number;
  min?: number;
  steppers?: boolean;
  /** The field carries an `estimated` tier line. */
  tier?: boolean;
  /** The line's emphasis; left out, the component's own default. */
  emphasis?: ProvenanceEmphasis;
  /** The field reports each figure while it is typed, not only once it is left. */
  asTyped?: boolean;
  /** The person may take the figure away: emptying the box unsets it. */
  clears?: boolean;
  /** The field holds an amount. */
  currency?: boolean;
}) {
  const [value, setValue] = useState<number | undefined>(initial);
  const [commits, setCommits] = useState(0);
  return (
    <ProvenanceWordsProvider value={provenanceWords(en.t)}>
      <NumberField
        label={label}
        unit={unit}
        value={value}
        min={min}
        steppers={steppers}
        currency={currency}
        commits={asTyped ? 'as-typed' : 'on-leave'}
        onCommit={(next) => {
          setValue(next);
          setCommits((count) => count + 1);
        }}
        {...(clears ? { onClear: () => setValue(undefined) } : {})}
        provenance={
          tier ? { tier: 'estimated', ...(emphasis === undefined ? {} : { emphasis }) } : undefined
        }
      />
      <output data-testid="held">{value === undefined ? '' : String(value)}</output>
      <output data-testid="commits">{commits}</output>
    </ProvenanceWordsProvider>
  );
}

/** A field named the two ways a screen names one: a drawn `label`, or an `ariaLabel` alone. */
export function NamedNumberField({ label, ariaLabel }: { label?: string; ariaLabel?: string }) {
  const [value, setValue] = useState<number | undefined>(undefined);
  return (
    <NumberField
      {...(label === undefined ? {} : { label })}
      {...(ariaLabel === undefined ? {} : { ariaLabel })}
      unit="%"
      precision={2}
      steppers={false}
      value={value}
      onCommit={setValue}
    />
  );
}
