import type { TranslatedText } from '@heliogrid/contracts';
import { createTranslator, numberFieldWords, provenanceWords } from '@heliogrid/i18n';
import {
  FieldCommitsProvider,
  NumberField,
  type ProvenanceEmphasis,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';
import { useEffect, useState } from 'react';

const en = await createTranslator('en');
const WORDS = numberFieldWords(en.t);

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
  precision,
  wholeDigits,
  hero = false,
}: {
  label: TranslatedText;
  unit: string;
  /** Places the field keeps; left out, every place. */
  precision?: number;
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
  /** The most digits it takes before the point. */
  wholeDigits?: number;
  /** The one large figure of its step. */
  hero?: boolean;
}) {
  const [value, setValue] = useState<number | undefined>(initial);
  const [commits, setCommits] = useState(0);
  return (
    <ProvenanceWordsProvider value={provenanceWords(en.t)}>
      <NumberField
        words={WORDS}
        label={label}
        unit={unit}
        value={value}
        min={min}
        steppers={steppers}
        currency={currency}
        precision={precision}
        wholeDigits={wholeDigits}
        hero={hero}
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
export function NamedNumberField({
  label,
  ariaLabel,
}: {
  label?: TranslatedText;
  ariaLabel?: TranslatedText;
}) {
  const [value, setValue] = useState<number | undefined>(undefined);
  return (
    <NumberField
      words={WORDS}
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

/**
 * A field the page takes away while it is still in use, as a touch press on Next, Back or ✕ does
 * (it never blurs the field first): F2 here takes it away without leaving it. `inForm` sets it in a
 * form with its own Save, where every field hands its edit up as typed.
 */
export function LeavingNumberField({
  label,
  unit,
  inForm = false,
}: {
  label: TranslatedText;
  unit: string;
  inForm?: boolean;
}) {
  const [shown, setShown] = useState(true);
  const [value, setValue] = useState<number | undefined>(undefined);
  useEffect(() => {
    const away = (event: KeyboardEvent) => {
      if (event.key === 'F2') setShown(false);
    };
    window.addEventListener('keydown', away);
    return () => window.removeEventListener('keydown', away);
  }, []);
  const field = shown ? (
    <NumberField
      words={WORDS}
      label={label}
      unit={unit}
      steppers={false}
      value={value}
      onCommit={setValue}
    />
  ) : null;
  return (
    <>
      {inForm ? <FieldCommitsProvider value="as-typed">{field}</FieldCommitsProvider> : field}
      <output data-testid="held">{value === undefined ? '' : String(value)}</output>
    </>
  );
}
