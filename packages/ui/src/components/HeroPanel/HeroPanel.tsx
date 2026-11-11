import { ShellGlyph } from '../AppShell/ShellGlyph';
import { IconButton } from '../IconButton';
import { Menu } from '../Menu';
import type { HeroPanelProps } from './HeroPanel.types';

export function HeroPanel({ label, labelAside, name, menu, edit, children }: HeroPanelProps) {
  const corner = (menu === undefined ? 0 : 1) + (edit === undefined ? 0 : 1);
  return (
    <section
      className="hg-hero"
      aria-label={name ?? label}
      data-menu={corner === 0 ? undefined : String(corner)}
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
      {corner === 0 ? null : (
        <span className="hg-hero-menu">
          {edit === undefined ? null : (
            <IconButton label={edit.label} onClick={edit.onPress}>
              <ShellGlyph name="pencil" size="sm" tone="primary" />
            </IconButton>
          )}
          {menu === undefined ? null : (
            <Menu label={menu.label} items={menu.items} disabled={menu.disabled ?? false} />
          )}
        </span>
      )}
    </section>
  );
}
