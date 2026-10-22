import { createTranslator, provenanceWords } from '@heliogrid/i18n';
import {
  type FactDensity,
  type FactForm,
  FactRow,
  type FactRowForm,
  FactRows,
  type FactRowsForm,
  type ProvenanceTierSpec,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';
import { type ReactNode, useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/** One row as data, so a spec can hand it through `mount`. */
export interface HeldRow {
  label: string;
  value?: string;
  values?: string[];
  stack?: boolean;
  long?: boolean;
  /** The row leads with a dot. */
  mark?: boolean;
  provenance?: ProvenanceTierSpec;
  /** The gap's sentence. */
  gap?: string;
  /** The gap's fill act; its press is written to `filled`. */
  fill?: string;
  fieldName?: string;
  form?: FactForm | 'auto';
  density?: FactDensity;
}

type Reader = 'en' | 'hi' | 'mr';

/** Short values: a date, a state, a figure — a pair at any width. */
const SHORT: Record<Reader, HeldRow[]> = {
  en: [
    { label: 'Survey date', value: '14 Mar 2026' },
    { label: 'Status', value: 'Pending' },
    { label: 'Sanctioned load', value: '5 kW' },
  ],
  hi: [
    { label: 'सर्वे की तारीख', value: '14 मार्च 2026' },
    { label: 'स्थिति', value: 'बाकी' },
    { label: 'स्वीकृत लोड', value: '5 kW' },
  ],
  mr: [
    { label: 'सर्वेक्षणाची तारीख', value: '14 मार्च 2026' },
    { label: 'स्थिती', value: 'प्रलंबित' },
    { label: 'मंजूर भार', value: '5 kW' },
  ],
};

/** Each second value is under `longAt` (32), so only measuring finds that it wraps: beside its
 *  long word it cannot fit the pair's 44 characters at either width. */
const WRAPS: Record<Reader, HeldRow> = {
  en: {
    label: 'Paused until further notice from the office',
    value: 'Voice calls and AI detections',
  },
  hi: { label: 'आगे की सूचना तक रोकी गई सभी सेवाएँ और सुविधाएँ', value: 'वॉइस कॉल, एआई पहचान, आमंत्रण' },
  mr: { label: 'पुढील सूचनेपर्यंत थांबवलेल्या सर्व सेवा आणि सुविधा', value: 'व्हॉइस कॉल, एआय ओळख, आमंत्रणे' },
};

/** The rows a spec names: the reader's short set, or its first short row and a row that wraps. */
export type HeldSample = 'short' | 'wraps';

function sampleRows(sample: HeldSample, reader: Reader): HeldRow[] {
  const short = SHORT[reader];
  return sample === 'short' ? short : [...short.slice(0, 1), WRAPS[reader]];
}

interface Room {
  reader?: Reader;
  /** The room's own width; left out, the page's. */
  width?: number;
}

function Mark() {
  return (
    <span
      data-testid="mark"
      style={{
        display: 'inline-block',
        width: 'var(--sp-2)',
        height: 'var(--sp-2)',
        borderRadius: 'var(--r-pill)',
        background: 'var(--accent)',
      }}
    />
  );
}

function rowProps(row: HeldRow, onFill: () => void) {
  const { mark, gap, fill, ...rest } = row;
  return {
    ...rest,
    mark: mark ? <Mark /> : undefined,
    gap:
      gap === undefined
        ? undefined
        : { gap, ...(fill === undefined ? {} : { fillLabel: fill, onFill }) },
  };
}

/** The room, the reports written to `forms` as JSON, and the gap's press written to `filled`. */
function Held({
  reader = 'en',
  width,
  forms,
  filled,
  children,
}: Room & { forms: unknown[]; filled: string; children: ReactNode }) {
  return (
    <ProvenanceWordsProvider value={provenanceWords(READERS[reader].t)}>
      <div lang={reader} data-testid="room" style={width === undefined ? undefined : { width }}>
        {children}
      </div>
      {/* Read by the spec, never drawn: a line of JSON would widen the page it measures. */}
      <output data-testid="forms" hidden>
        {JSON.stringify(forms)}
      </output>
      <output data-testid="filled">{filled}</output>
    </ProvenanceWordsProvider>
  );
}

/** A group as a screen holds it; every `onFormChange` it fires is kept, in order. */
export function FactRowsAsHeld({
  reader = 'en',
  width,
  sample,
  rows = sampleRows(sample ?? 'short', reader),
  label,
  density,
  measure,
  leadBelow,
  longAt,
  form,
}: Room & {
  /** Rows of its own; left out, the reader's `sample`. */
  rows?: HeldRow[];
  sample?: HeldSample;
  label?: string;
  density?: FactDensity;
  measure?: number;
  leadBelow?: number;
  longAt?: number;
  form?: FactForm | 'auto';
}) {
  const [forms, setForms] = useState<FactRowsForm[]>([]);
  const [filled, setFilled] = useState('');
  return (
    <Held reader={reader} width={width} forms={forms} filled={filled}>
      <FactRows
        label={label}
        density={density}
        measure={measure}
        leadBelow={leadBelow}
        longAt={longAt}
        form={form}
        onFormChange={(next) => setForms((all) => [...all, next])}
      >
        {rows.map((row) => (
          <FactRow key={row.label} {...rowProps(row, () => setFilled(row.label))} />
        ))}
      </FactRows>
    </Held>
  );
}

/** One row on its own, measuring its own room; every `onFormChange` it fires is kept. */
export function FactRowAsHeld({
  reader,
  width,
  row,
  measure,
  leadBelow,
  longAt,
}: Room & { row: HeldRow; measure?: number; leadBelow?: number; longAt?: number }) {
  const [forms, setForms] = useState<FactRowForm[]>([]);
  const [filled, setFilled] = useState('');
  return (
    <Held reader={reader} width={width} forms={forms} filled={filled}>
      <FactRow
        {...rowProps(row, () => setFilled(row.label))}
        measure={measure}
        leadBelow={leadBelow}
        longAt={longAt}
        onFormChange={(next) => setForms((all) => [...all, next])}
      />
    </Held>
  );
}
