/**
 * Where the brand's light sits. `page` is the soft logo-colour glow along the top of a page (the
 * web's body draws it, so a phone screen draws this); `centre` an art bloom behind a centred moment;
 * `size` an art bloom behind a mark (an empty state, the no-connection sun); nothing set fills the
 * parent's box. It is atmosphere and never carries information; field mode turns it off.
 */
export type BloomPlacement = 'page' | 'centre';

export interface BrandBloomProps {
  placement?: BloomPlacement;
  /** Diameter of an art bloom centred in its parent; ignored when `placement` is set. */
  size?: number;
}

/** The page glow's height and the centred bloom's side, px/dp: art dimensions, not layout. */
export const PAGE_GLOW_HEIGHT = 360;
export const CENTRE_BLOOM_SIZE = 520;
