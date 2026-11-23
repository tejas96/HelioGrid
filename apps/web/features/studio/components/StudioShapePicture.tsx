import type { RoofShape } from '@heliogrid/domain';
import type { ReactNode } from 'react';

/*
 * Small line pictures of a roof's shape (`T-M05-002`, part e, board 5.1), drawn as the material
 * pictures are: a house seen from the front with its roof on top, so a rep knows a gable from a
 * hip in any language. No words sit in a picture. One stroke in the current colour.
 */

const WALLS = 'M6 24V16M34 24V16M4 24h32';

const DRAWN: Record<RoofShape, ReactNode> = {
  flat: (
    <>
      <path d="M6 24V10h28v14M4 24h32" />
      <path d="M6 13h28" strokeWidth="1.1" />
    </>
  ),
  shed: (
    <>
      <path d="M6 24V15M34 24V8M4 24h32" />
      <path d="M3 16l34-9" />
    </>
  ),
  gable: (
    <>
      <path d={WALLS} />
      <path d="M3 17l17-12 17 12" />
    </>
  ),
  hip: (
    <>
      <path d={WALLS} />
      <path d="M3 17l9-9h16l9 9" />
      <path d="M12 8l-3 9M28 8l3 9" strokeWidth="1.1" />
    </>
  ),
  any: (
    <>
      <path d={WALLS} />
      <path d="M3 17l7-8 8 4 6-7 13 11" />
      <path d="M10 9l2 8M24 6l-1 11" strokeWidth="1.1" />
    </>
  ),
  sawtooth: (
    <>
      <path d="M4 24V16M36 24V8M4 24h32" />
      <path d="M4 16l8-8v8l8-8v8l8-8v8l8-8" />
    </>
  ),
  monitor: (
    <>
      <path d={WALLS} />
      <path d="M3 17l9-4h16l9 4" />
      <path d="M13 13V7h14v6" />
    </>
  ),
  curved: (
    <>
      <path d={WALLS} />
      <path d="M3 17q17-16 34 0" />
    </>
  ),
  butterfly: (
    <>
      <path d="M6 24V12M34 24V12M4 24h32" />
      <path d="M3 10l17 7 17-7" />
    </>
  ),
  mansard: (
    <>
      <path d={WALLS} />
      <path d="M4 17l5-8h22l5 8" />
      <path d="M9 9l4-3h14l4 3" strokeWidth="1.1" />
    </>
  ),
  gambrel: (
    <>
      <path d={WALLS} />
      <path d="M3 17l5-7 12-5 12 5 5 7" />
    </>
  ),
};

/** The picture of a shape. It speaks nothing: the tile that holds it carries the shape's name. */
export function StudioShapePicture({ shape }: { shape: RoofShape }) {
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
      {DRAWN[shape]}
    </svg>
  );
}
