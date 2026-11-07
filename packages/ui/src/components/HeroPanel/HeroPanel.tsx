import type { HeroPanelProps } from './HeroPanel.types';

export function HeroPanel({ label, labelAside, name, children }: HeroPanelProps) {
  return (
    <section className="hg-hero" aria-label={name ?? label}>
      <span className="hg-hero-sweep" aria-hidden="true" />
      {label === undefined && labelAside === undefined ? null : (
        <div className="hg-hero-head">
          {label === undefined ? null : <span className="hg-hero-label">{label}</span>}
          {labelAside}
        </div>
      )}
      {children}
    </section>
  );
}
