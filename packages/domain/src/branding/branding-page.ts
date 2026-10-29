/** Which customer surface Branding's stage shows (`SCR-M01-18`, *Proposal · Link page*). */
export type BrandingPreview = 'proposal' | 'link';

/** The parts Branding's editor switches between, in the switch's order (*Logo · Colour · Letterhead*). */
export const BRANDING_PARTS = ['logo', 'colour', 'letterhead'] as const;

/** Which part's fields Branding's editor shows. */
export type BrandingPart = (typeof BRANDING_PARTS)[number];
