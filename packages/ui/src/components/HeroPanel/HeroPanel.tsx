import { Menu } from '../Menu';
import type { HeroPanelProps } from './HeroPanel.types';

export function HeroPanel({ label, labelAside, name, menu, children }: HeroPanelProps) {
  return (
    <section
      className="hg-hero"
      aria-label={name ?? label}
      data-menu={menu === undefined ? undefined : 'true'}
    >
      <span className="hg-hero-glass" aria-hidden="true">
        <span className="hg-hero-sweep" />
      </span>
      {label === undefined && labelAside === undefined ? null : (
        <div className="hg-hero-head">
          {label === undefined ? null : <span className="hg-hero-label">{label}</span>}
          {labelAside}
        </div>
      )}
      {children}
      {menu === undefined ? null : (
        <span className="hg-hero-menu">
          <Menu label={menu.label} items={menu.items} disabled={menu.disabled ?? false} />
        </span>
      )}
    </section>
  );
}
