'use client';
import { type GroundOutline, sunlightPiecesOf } from '@heliogrid/data/react/studio';
import { type RoofSunlight, SUNLIGHT_KEY_FROM, SUNLIGHT_KEY_TO } from '@heliogrid/domain';
import { useEffect, useMemo } from 'react';
import { BufferAttribute, BufferGeometry, Color } from 'three';

/** One roof's sunlight laid on its top: the roof's metres, how high its top stands, its outline. */
export interface SunlightPatch {
  readonly sunlight: RoofSunlight;
  readonly topM: number;
  readonly corners: GroundOutline;
}

/** Just over a roof's top, so the colours never fight it. */
const LIFT_M = 0.06;
const XYZ = 3;
const RGB = 3;
const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, -1],
  [1, 1],
  [-1, 1],
] as const;

function sunlightGeometry(patches: readonly SunlightPatch[], colours: readonly string[]) {
  const stops = colours.map((colour) => new Color(colour));
  const squares = patches.flatMap(({ sunlight, topM, corners }) =>
    sunlightPiecesOf(sunlight, corners).map((piece) => ({ piece, topM })),
  );
  const positions = new Float32Array(squares.length * CORNERS.length * XYZ);
  const tints = new Float32Array(squares.length * CORNERS.length * RGB);
  const tint = new Color();
  let at = 0;
  for (const { piece, topM } of squares) {
    // 60 % to 100 % across the key's colours, as the key reads.
    const t = (piece.share - SUNLIGHT_KEY_FROM) / (SUNLIGHT_KEY_TO - SUNLIGHT_KEY_FROM);
    const place = Math.min(1, Math.max(0, t)) * (stops.length - 1);
    const below = Math.floor(place);
    const above = Math.min(stops.length - 1, below + 1);
    tint.copy(stops[below] as Color).lerp(stops[above] as Color, place - below);
    for (const [de, dn] of CORNERS) {
      const east = piece.east + de * piece.half;
      positions.set([east, topM + LIFT_M, -(piece.north + dn * piece.half)], at * XYZ);
      tints.set([tint.r, tint.g, tint.b], at * RGB);
      at += 1;
    }
  }
  const made = new BufferGeometry();
  made.setAttribute('position', new BufferAttribute(positions, XYZ));
  made.setAttribute('color', new BufferAttribute(tints, RGB));
  return made;
}

/**
 * Sunlight on the roofs (`T-M05-002`, part g, board G24): each metre of each roof coloured by the
 * share of the year's sun it keeps, on the key from much shade to none; as see-through as the
 * person set the view.
 */
export function StudioSunlight({
  patches,
  colours,
  opacity,
}: {
  patches: readonly SunlightPatch[];
  colours: readonly string[];
  opacity: number;
}) {
  const geometry = useMemo(() => sunlightGeometry(patches, colours), [patches, colours]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} renderOrder={1}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
        side={2}
      />
    </mesh>
  );
}
