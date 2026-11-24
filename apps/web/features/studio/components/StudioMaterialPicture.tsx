import type { RoofMaterial } from '@heliogrid/domain';
import type { ReactNode } from 'react';

/*
 * Small line pictures of what a roof is made of (`T-M05-002`, part e), as the approved board draws
 * them: each shows the thing as a person sees it on site — a sheet's profile, a tile's rows, a
 * slab with its parapet — so a rep knows a trapezoidal sheet from an AC sheet in any language. No
 * words sit in a picture. One stroke in the current colour, so light and dark follow.
 */

const DRAWN: Record<RoofMaterial, ReactNode> = {
  rcc: (
    <>
      <path d="M4 9v13h32V9" />
      <path d="M4 15h32" />
      <path d="M9 19l3-3M16 19l3-3M23 19l3-3M30 19l3-3" strokeWidth="1.1" />
    </>
  ),
  tiles_on_rcc: (
    <>
      <path d="M4 18h32v5H4z" />
      <path d="M3 18 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0" />
      <path
        d="M3 13 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0 a2.83 4 0 0 0 5.67 0"
        strokeWidth="1.2"
      />
    </>
  ),
  brick_terrace: (
    <>
      <path d="M3 9h34" />
      <path d="M3 9v12M37 9v12" />
      <path d="M3 21a5.7 6 0 0 1 11.3 0a5.7 6 0 0 1 11.4 0a5.7 6 0 0 1 11.3 0" />
    </>
  ),
  stone_slab: (
    <>
      <path d="M3 12h34v7H3z" />
      <path d="M13 12v7M24 12v7M31 12v7" />
      <path d="M8 19v4M32 19v4" />
    </>
  ),
  trapezoidal_sheet: (
    <>
      <path d="M2 19h4l3-7h4l3 7h4l3-7h4l3 7h4" />
      <path d="M2 23h34" strokeWidth="1.1" />
    </>
  ),
  corrugated_gi: (
    <>
      <path d="M3 17 q2.12 -5 4.25 0 q2.12 5 4.25 0 q2.12 -5 4.25 0 q2.12 5 4.25 0 q2.12 -5 4.25 0 q2.12 5 4.25 0 q2.12 -5 4.25 0 q2.12 5 4.25 0" />
      <path
        d="M3 22 q2.12 -5 4.25 0 q2.12 5 4.25 0 q2.12 -5 4.25 0 q2.12 5 4.25 0 q2.12 -5 4.25 0 q2.12 5 4.25 0 q2.12 -5 4.25 0 q2.12 5 4.25 0"
        strokeWidth="1.1"
      />
    </>
  ),
  standing_seam: (
    <>
      <path d="M3 21h34" />
      <path d="M8 21v-9M15 21v-9M22 21v-9M29 21v-9" />
      <path d="M7 12h2M14 12h2M21 12h2M28 12h2" />
    </>
  ),
  puf_panel: (
    <>
      <path d="M2 13h4l3-5h4l3 5h4l3-5h4l3 5h4" />
      <path d="M2 22h34" />
      <path d="M8 17.5h.01M14 17.5h.01M20 17.5h.01M26 17.5h.01M32 17.5h.01" strokeWidth="2.2" />
    </>
  ),
  stone_coated_metal_tile: (
    <>
      <path d="M3 14 q3.4 -5 6.8 0 q3.4 5 6.8 0 q3.4 -5 6.8 0 q3.4 5 6.8 0 q3.4 -5 6.8 0" />
      <path d="M3 21 q3.4 -5 6.8 0 q3.4 5 6.8 0 q3.4 -5 6.8 0 q3.4 5 6.8 0 q3.4 -5 6.8 0" />
      <path d="M8 16h.01M15 16.5h.01M22 16h.01M29 16.5h.01" strokeWidth="2" />
    </>
  ),
  clay_tile: (
    <>
      <path d="M3 11 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0" />
      <path d="M3 17 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0" />
      <path d="M3 23 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0 a3.4 4 0 0 0 6.8 0" />
    </>
  ),
  country_tile: (
    <>
      <path d="M3 20a3.4 3.4 0 0 1 6.8 0a3.4 3.4 0 0 0 6.8 0a3.4 3.4 0 0 1 6.8 0a3.4 3.4 0 0 0 6.8 0" />
      <path d="M3 23h28" strokeWidth="1.1" />
    </>
  ),
  concrete_tile: (
    <>
      <path d="M3 14 q4.25 -3 8.5 0 q4.25 3 8.5 0 q4.25 -3 8.5 0 q4.25 3 8.5 0" />
      <path d="M3 21 q4.25 -3 8.5 0 q4.25 3 8.5 0 q4.25 -3 8.5 0 q4.25 3 8.5 0" />
    </>
  ),
  slate: (
    <>
      <path d="M3 10h34M3 16h34M3 22h34" />
      <path d="M10 10v6M20 10v6M30 10v6M5 16v6M15 16v6M25 16v6M35 16v6" />
    </>
  ),
  wood_shake: (
    <>
      <path d="M3 13h34M3 21h34" />
      <path d="M7 13l1 8M13 13l-1 8M18 13l1 8M24 13l-1 8M29 13l1 8M34 13l-1 8" strokeWidth="1.2" />
      <path d="M9 7l1 6M15 7l-1 6M21 7l1 6M27 7l-1 6M33 7l1 6" strokeWidth="1.2" />
    </>
  ),
  ac_sheet: (
    <>
      <path d="M3 18 q2.7 -6 5.4 0 q2.7 6 5.4 0 q2.7 -6 5.4 0 q2.7 6 5.4 0 q2.7 -6 5.4 0" />
      <path d="M3 23h27" strokeWidth="1.1" />
    </>
  ),
  fibre_cement: (
    <>
      <path d="M3 18 q1.93 -4 3.86 0 q1.93 4 3.86 0 q1.93 -4 3.86 0 q1.93 4 3.86 0 q1.93 -4 3.86 0 q1.93 4 3.86 0 q1.93 -4 3.86 0" />
      <path d="M3 23h27" strokeWidth="1.1" />
    </>
  ),
  asphalt_shingle: (
    <>
      <path d="M3 10h34M3 16h34M3 22h34" />
      <path d="M9 10v3M17 10v3M25 10v3M33 10v3M5 16v3M13 16v3M21 16v3M29 16v3" />
    </>
  ),
  membrane: (
    <>
      <path d="M3 18h34" />
      <path d="M12 18v-3M26 18v-3" strokeDasharray="1.5 2" />
      <path d="M3 22h34" strokeWidth="1.1" />
      <circle cx="33" cy="10" r="3" />
    </>
  ),
  gravel_built_up: (
    <>
      <path d="M3 21h34" />
      <path
        d="M6 17h.01M10 15h.01M14 17h.01M18 14.5h.01M22 17h.01M26 15h.01M30 17h.01M34 15h.01M8 12h.01M16 12h.01M24 12h.01M32 12h.01"
        strokeWidth="2.4"
      />
    </>
  ),
  roof_garden: (
    <>
      <path d="M3 19h34v4H3z" />
      <path d="M8 19c0-4 2-6 2-6M10 19c0-3 2-5 4-5M22 19c0-5 2-8 2-8M24 19c0-3 2-5 4-5M31 19c0-4-2-6-2-6" />
    </>
  ),
  glass: (
    <>
      <path d="M4 7h32v16H4z" />
      <path d="M20 7v16" />
      <path d="M9 18l5-6M25 18l5-6" strokeWidth="1.2" />
    </>
  ),
  skylight_polycarbonate: (
    <>
      <path d="M3 21h34" />
      <path d="M5 21v-9h30v9" />
      <path d="M11 12v9M17 12v9M23 12v9M29 12v9" strokeWidth="1.1" />
    </>
  ),
  thatch: (
    <>
      <path d="M3 22l17-14 17 14" />
      <path d="M8 22l7-9M13 22l6-10M27 22l-6-10M32 22l-7-9" strokeWidth="1.1" />
    </>
  ),
  other: (
    <>
      <path d="M4 22h32" />
      <path d="M24 8l5 5-10 10h-5v-5z" />
    </>
  ),
};

/** A fragile type's small warning triangle, in the picture's top corner. */
const FRAGILE = (
  <>
    <path d="M33 3l4 7h-8z" strokeWidth="1.3" />
    <path d="M33 5.6v2" strokeWidth="1.3" />
  </>
);

/**
 * The picture of a material. `fragile`: it breaks under a foot, so its picture carries the warning
 * triangle. It speaks nothing: the tile that holds it carries the type's name.
 */
export function StudioMaterialPicture({ type, fragile }: { type: RoofMaterial; fragile: boolean }) {
  return (
    <svg
      className="hg-studio-material-picture"
      viewBox="0 0 40 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {DRAWN[type]}
      {fragile ? FRAGILE : null}
    </svg>
  );
}
