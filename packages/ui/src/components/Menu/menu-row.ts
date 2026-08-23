import type { TextColor } from '../../primitives/Text/Text.types';
import type { MenuItem } from './Menu.types';
import { hasReason } from './menu-walk';

export interface MenuRowShape {
  /** `disabled` in the DS sense — the caller said so. */
  disabled: boolean;
  destructive: boolean;
  /**
   * True when the item is off AND says why. Such a row is `aria-disabled` and STAYS FOCUSABLE,
   * because a skipped item is one whose reason a keyboard user can never hear; selection still
   * refuses it. An item off with no reason keeps the native `disabled` attribute.
   */
  stated: boolean;
  /** Whether the switcher's tick column and checked state apply to this row. */
  checked: boolean;
}

/** One place that reads a `MenuItem`'s flags, so the two platform rows cannot answer them twice. */
export function menuRowShape(item: MenuItem, radio: boolean): MenuRowShape {
  const disabled = item.disabled === true;
  return {
    disabled,
    destructive: item.destructive === true,
    stated: disabled && hasReason(item),
    checked: radio && item.selected === true,
  };
}

/**
 * The label's colour role. Off wins over destructive: a row that cannot act is grey whatever it
 * would have done. The SENTENCE explaining it is not grey — `ActionReason` owns that colour.
 */
export function menuLabelColor(shape: MenuRowShape): TextColor {
  if (shape.disabled) {
    return 'tertiary';
  }
  return shape.destructive ? 'danger' : 'primary';
}

/** A flag reaches the stylesheet as a STRING — `[data-x="true"]` is what Menu.css matches on. */
export type BoolAttr = 'true' | 'false';

export interface MenuRowAttrs {
  /** The roving walk's current row. A disabled row never takes the tint, only the position. */
  'data-active': BoolAttr;
  'data-destructive': BoolAttr;
  'data-disabled': BoolAttr;
  /** A stated reason makes the row two lines, so it tops-aligns and takes its own padding. */
  'data-reason': BoolAttr;
}

/**
 * The `data-*` vocabulary a row publishes to Menu.css, in ONE declaration — markup and stylesheet
 * read the same list, so a state cannot be styled that the row never sets.
 */
export function menuRowAttrs(shape: MenuRowShape, active: boolean, twoLine: boolean): MenuRowAttrs {
  return {
    'data-active': active && !shape.disabled ? 'true' : 'false',
    'data-destructive': shape.destructive ? 'true' : 'false',
    'data-disabled': shape.disabled ? 'true' : 'false',
    'data-reason': twoLine ? 'true' : 'false',
  };
}
