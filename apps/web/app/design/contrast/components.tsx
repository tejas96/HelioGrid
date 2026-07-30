'use client';
import { Button, Chip } from '@heliogrid/ui';
import { type ReactNode, useRef } from 'react';
import { type Measured, useContrastMeasurements } from './hooks';

/**
 * Presentational half of the contrast comparison (CLAUDE.md: design and logic in different
 * files). Renders the REAL components — the palette comes from CSS variables the parent
 * column overrides, so "today" and "proposed" run identical markup through identical
 * component code and differ only in the token values.
 *
 * Nothing here carries a probe attribute: the component prop types are closed (deliberately —
 * that is the API contract), so the measuring hook queries the rendered classes instead.
 */

export function Readout({ pairs }: { pairs: Measured[] }) {
  return (
    <div className="cmp-readout">
      {pairs.map((p) => (
        <span key={p.label}>
          {p.label}{' '}
          {p.ratio === null ? (
            '—'
          ) : (
            <span className={p.ratio >= p.floor ? 'cmp-pass' : 'cmp-fail'}>
              {p.ratio.toFixed(2)}:1 {p.ratio >= p.floor ? 'PASS' : 'FAIL'}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * Danger specimens: white label on a danger fill (UXG-A11Y-02), the danger chip, and danger
 * as body text on white — the three pairs one token move affects together.
 */
export function DangerSpecimens() {
  return (
    <div className="cmp-specimens">
      <span className="cmp-swatch cmp-swatch-danger" />
      <Button variant="destructive">Delete lead</Button>
      <Chip tone="danger">On hold</Chip>
      <span className="cmp-danger-text">Couldn&apos;t send the code.</span>
    </div>
  );
}

/**
 * text-secondary specimens: on white (ruling C's borderline pair) and on the sunken track
 * SegmentedControl uses behind inactive labels (UXG-A11Y-03).
 */
export function SecondarySpecimens() {
  return (
    <div className="cmp-specimens">
      <span className="cmp-swatch cmp-swatch-secondary" />
      <span className="cmp-secondary-text">Secondary text on a card</span>
      <span className="cmp-sunken">
        <span className="cmp-secondary-text">Inactive segment label</span>
      </span>
    </div>
  );
}

/**
 * A column that measures ITSELF.
 *
 * Each column owns its ref and its own hook call, because the two palettes live in different
 * subtrees — an earlier version put refs on only the first section and both hooks then read
 * the same DOM, so the second pair of columns could never report anything but "—".
 */
export function MeasuredColumn({
  title,
  token,
  proposed,
  children,
}: {
  title: string;
  /** Which token's resolved value to show — the page never types a hex literal. */
  token: 'danger' | 'secondary';
  proposed?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { pairs, danger, secondary } = useContrastMeasurements(ref);
  const value = token === 'danger' ? danger : secondary;
  const name = token === 'danger' ? '--danger' : '--text-secondary';

  return (
    <section className={proposed ? 'cmp-col cmp-proposed' : 'cmp-col'} ref={ref}>
      <div>
        <p className="hg-overline">{title}</p>
        <p className="hg-muted">
          {name} {proposed ? 'would resolve to' : 'resolves to'} {value}
        </p>
      </div>
      {children}
      <Readout pairs={pairs.filter((p) => p.ratio !== null)} />
    </section>
  );
}
