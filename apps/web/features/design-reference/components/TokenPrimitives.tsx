import type { ReactNode } from 'react';
import type { TokenRow } from '../token-data';

/** Shared rendering primitives for the token reference sections — a swatch chip with its
 *  name/value labels, the "extension" pill, and the section wrapper they all sit inside. */

export function Ext({ t }: { t: TokenRow }) {
  return t.extension ? <span className="ds-ext">extension</span> : null;
}

export function Swatch({ t }: { t: TokenRow }) {
  return (
    <div className="ds-swatch">
      <div className="ds-swatch-chip" style={{ background: t.resolvedValue ?? t.value }} />
      <span className="ds-name">
        --{t.name}
        <Ext t={t} />
      </span>
      <span className="ds-value">{t.value}</span>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ds-section">
      <h2 className="hg-overline">{title}</h2>
      {children}
    </section>
  );
}
