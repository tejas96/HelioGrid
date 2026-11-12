import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Menu } from '../Menu/Menu.native';
import { leadPageMenuOf } from './LeadWorkCards.logic';
import type { LeadRecordMenuProps } from './LeadWorkCards.types';

/** The narrow page's ⋯ in the phone's top bar; no act offered draws nothing. */
export function LeadRecordMenu(props: LeadRecordMenuProps) {
  const menu = leadPageMenuOf(props, menuGlyph);
  if (menu === undefined) return null;
  return (
    <Menu
      label={menu.label}
      items={menu.items}
      disabled={menu.disabled ?? false}
      triggerLook="surface"
      align="end"
    />
  );
}

const menuGlyph = (name: ShellGlyphName) => <ShellGlyph name={name} size="sm" tone="secondary" />;
