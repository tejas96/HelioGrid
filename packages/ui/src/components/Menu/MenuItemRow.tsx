import type { ReactNode, Ref } from 'react';
import { renderActionReason } from '../ActionReason/ActionReason';
import { renderMarks } from '../ChipGroup/ChipGroup';
import type { MenuItem } from './Menu.types';
import { MenuLeadGlyph, MenuTick } from './MenuGlyphs';
import { menuRowAttrs, menuRowShape } from './menu-row';

interface MenuItemRowProps {
  active: boolean;
  item: MenuItem;
  itemRef: Ref<HTMLButtonElement>;
  onHover: () => void;
  onSelect: () => void;
  /** `single` turns the list into `menuitemradio`s with a RESERVED tick column. */
  radio: boolean;
}

/**
 * One menu row.
 *
 * AN ITEM THAT IS OFF SAYS WHY. `disabledReason` renders as the SECOND LINE, under the label,
 * through `ActionReason` — `meta` keeps its own job and never carries a reason. With a reason the
 * row is `aria-disabled` rather than natively disabled, because a skipped item is one a keyboard
 * user can never hear the reason for; the caller's `choose` still refuses it.
 */
export function MenuItemRow({ active, item, itemRef, onHover, onSelect, radio }: MenuItemRowProps) {
  const shape = menuRowShape(item, radio);
  const { checked, destructive, disabled, stated } = shape;
  const reason: ReactNode = disabled ? renderActionReason(item.disabledReason) : null;
  const twoLine = reason !== null;
  /* Off with NO reason is the only row that leaves the tab order — one with a stated reason keeps
     its place in the walk, or the sentence explaining it is announced to nobody. */
  const inert = disabled && !stated;

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the explicit role below IS menuitemradio, which takes aria-checked; the rule reads the <button> element rather than the role it is given.
    <button
      {...menuRowAttrs(shape, active, twoLine)}
      aria-checked={radio ? checked : undefined}
      aria-disabled={disabled ? true : undefined}
      className="hg-menu-item"
      disabled={inert}
      onClick={onSelect}
      onMouseEnter={inert ? undefined : onHover}
      ref={itemRef}
      role={radio ? 'menuitemradio' : 'menuitem'}
      tabIndex={active ? 0 : -1}
      type="button"
    >
      {radio ? <MenuTick checked={checked} /> : null}
      {item.icon ?? <MenuLeadGlyph destructive={destructive} />}
      <span className="hg-menu-item-body">
        <span className="hg-menu-item-line">
          <span className="hg-menu-item-label" data-current={checked ? 'true' : 'false'}>
            {item.label}
          </span>
          {renderMarks(item.marks)}
        </span>
        {/* The second line. `meta` keeps its own job and never carries a reason. */}
        {reason}
      </span>
      {item.meta === undefined ? null : <span className="hg-menu-item-meta">{item.meta}</span>}
    </button>
  );
}
