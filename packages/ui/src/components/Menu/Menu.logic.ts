import type { MenuItem, MenuProps } from './Menu.types';

/** The list's gap from its trigger — `Menu.css`'s `calc(100% + 6px)`, both ways. */
export const MENU_GAP = 6;

/** A chosen row's own act runs first; then the menu hears its key — `key ?? label`. */
export function actOnChoice(item: MenuItem, onSelect: MenuProps['onSelect']): void {
  item.onSelect?.();
  const key = item.key ?? item.label;
  if (onSelect !== undefined && key !== undefined) {
    onSelect(key);
  }
}
