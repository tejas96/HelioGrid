'use client';
import { useRoofDresses } from '@heliogrid/data/react/studio';
import { type LookFamily, ROOF_SWATCHES, type RoofScene, type RoofSwatch } from '@heliogrid/domain';
import type { ThemePalette } from '@heliogrid/theme';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import {
  DoubleSide,
  FrontSide,
  type Material,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from 'three';
import { photoReaderOf, type RoofTopPicture } from './photo-reader';
import {
  disposeRoofGeometries,
  type LookGeometry,
  type RoofGeometries,
  roofGeometries,
} from './roof-dressed-mesh';

/**
 * The roofs' meshes in what each wears (`T-M05-002`, part e, roof looks): plaster walls and the
 * photo's undersides, the photo on the tops the sky sees, a sawtooth's glass, and each material
 * look in its colour with its pattern, relief and gloss. A look's maps load the first time it is
 * drawn; until then it shows its plain colour, so a roof is never blank.
 */

/** Walls, and a roof's top where there is no picture: matt plaster. */
const PLASTER_ROUGHNESS = 0.92;
/** A sawtooth's glass: how much of the sky it lets through, and its shine. */
const GLASS_OPACITY = 0.45;
const GLASS_ROUGHNESS = 0.08;
/** How much each look shines like metal: painted sheet a little, bare zinc more, the rest none. */
const METALNESS: Record<LookFamily, number> = {
  trapezoidal: 0.2,
  corrugated: 0.3,
  cement_sheet: 0,
  standing_seam: 0.2,
  tile: 0,
  slate: 0,
  shingle: 0,
  shake: 0,
  concrete: 0,
  terrace_tile: 0,
  stone_slab: 0,
  membrane: 0,
  gravel: 0,
  grass: 0,
  thatch: 0,
  glass: 0.1,
  polycarbonate: 0,
};
/** A cap is smooth where its look is: a sheet's fold shines, a tile's round is matt. */
const CAP_ROUGHNESS = 0.6;

/** Sharp at a glancing look, as a sheet's ribs are seen down a long roof. */
const MAX_ANISOTROPY = 8;

interface LookMaps {
  readonly albedo: Texture;
  readonly normal: Texture;
  readonly rough: Texture;
}

/** Each look's maps, loaded once for the page: the same three for every roof that wears it. */
const LOADED = new Map<LookFamily, Promise<LookMaps>>();
const loader = new TextureLoader();

function mapsOf(family: LookFamily): Promise<LookMaps> {
  const known = LOADED.get(family);
  if (known !== undefined) return known;
  const load = async (kind: 'albedo' | 'normal' | 'rough') => {
    const texture = await loader.loadAsync(`/studio/looks/${family}_${kind}.webp`);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.anisotropy = MAX_ANISOTROPY;
    if (kind === 'albedo') texture.colorSpace = SRGBColorSpace;
    return texture;
  };
  const maps = Promise.all([load('albedo'), load('normal'), load('rough')]).then(
    ([albedo, normal, rough]) => ({ albedo, normal, rough }),
  );
  // A look that failed to load is tried again the next time it is drawn.
  maps.catch(() => LOADED.delete(family));
  LOADED.set(family, maps);
  return maps;
}

/** The maps of the looks in use, as they arrive; a look not yet here draws in its plain colour. */
function useLookMaps(families: readonly LookFamily[]): ReadonlyMap<LookFamily, LookMaps> {
  const invalidate = useThree((three) => three.invalidate);
  // biome-ignore lint/plugin: the looks' WebGL maps, held as they arrive over the network
  const [maps, setMaps] = useState<ReadonlyMap<LookFamily, LookMaps>>(new Map());
  const wanted = families.join('|');
  // biome-ignore lint/correctness/useExhaustiveDependencies: the families in use are their names
  useEffect(() => {
    let live = true;
    for (const family of new Set(families)) {
      if (maps.has(family)) continue;
      mapsOf(family)
        .then((loaded) => {
          if (!live) return;
          setMaps((now) => new Map(now).set(family, loaded));
          invalidate();
        })
        .catch(() => undefined);
    }
    return () => {
      live = false;
    };
  }, [wanted]);
  return maps;
}

function LookMesh({
  look,
  palette,
  maps,
  roughness,
  keep,
  fades,
}: {
  look: LookGeometry;
  palette: ThemePalette;
  maps: LookMaps | undefined;
  /** A cap's own gloss, in place of the look's map. */
  roughness?: number;
  keep: (material: Material | null) => void;
  fades: boolean;
}) {
  const clear = look.seeThrough;
  return (
    <mesh geometry={look.geometry} castShadow={!clear} receiveShadow>
      <meshStandardMaterial
        ref={keep}
        color={palette[`scene-roof-${look.swatch}`]}
        map={roughness === undefined ? (maps?.albedo ?? null) : null}
        normalMap={roughness === undefined ? (maps?.normal ?? null) : null}
        roughnessMap={roughness === undefined ? (maps?.rough ?? null) : null}
        roughness={roughness ?? 1}
        metalness={METALNESS[look.family]}
        side={DoubleSide}
        transparent={clear || fades}
        depthWrite={!clear}
      />
    </mesh>
  );
}

export function StudioRoofLooks({
  model,
  palette,
  photo,
  keep = () => undefined,
  fades = false,
}: {
  model: RoofGeometries;
  palette: ThemePalette;
  /** The picture the photo's tops wear; `null` while it comes, when they are plaster. */
  photo: Texture | null;
  /** Each material drawn, for a move that fades them. */
  keep?: (material: Material | null) => void;
  /** The meshes fade in or out: their materials take an opacity. */
  fades?: boolean;
}) {
  const families = useMemo(() => model.looks.map((look) => look.family), [model]);
  const maps = useLookMaps(families);
  return (
    <>
      <mesh geometry={model.walls} castShadow receiveShadow>
        <meshStandardMaterial
          ref={keep}
          color={palette['scene-wall']}
          roughness={PLASTER_ROUGHNESS}
          transparent={fades}
        />
      </mesh>
      <mesh geometry={model.undersides} receiveShadow>
        <meshStandardMaterial
          ref={keep}
          color={palette['scene-wall']}
          roughness={PLASTER_ROUGHNESS}
          transparent={fades}
        />
      </mesh>
      <mesh geometry={model.photo} castShadow receiveShadow>
        {photo === null ? (
          <meshStandardMaterial
            ref={keep}
            color={palette['scene-wall']}
            roughness={PLASTER_ROUGHNESS}
            side={FrontSide}
            shadowSide={DoubleSide}
            transparent={fades}
          />
        ) : (
          <meshBasicMaterial
            ref={keep}
            map={photo}
            toneMapped={false}
            side={FrontSide}
            shadowSide={DoubleSide}
            transparent={fades}
          />
        )}
      </mesh>
      {model.looks.map((look) => (
        <LookMesh
          key={`${look.family}:${look.swatch}`}
          look={look}
          palette={palette}
          maps={maps.get(look.family)}
          keep={keep}
          fades={fades}
        />
      ))}
      {model.caps.map((cap) => (
        <LookMesh
          key={`cap:${cap.family}:${cap.swatch}`}
          look={cap}
          palette={palette}
          maps={undefined}
          roughness={CAP_ROUGHNESS}
          keep={keep}
          fades={fades}
        />
      ))}
      <mesh geometry={model.glass} receiveShadow>
        <meshStandardMaterial
          ref={keep}
          color={palette['scene-roof-glass']}
          roughness={GLASS_ROUGHNESS}
          metalness={METALNESS.glass}
          opacity={GLASS_OPACITY}
          side={DoubleSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

/** What each roof wears, and its meshes, for a model: the design's, or the parts of a move. */
export function useRoofMeshes(
  scene: RoofScene,
  top: RoofTopPicture | null,
  pictureComing: boolean,
  palette: ThemePalette,
): RoofGeometries {
  const picture = useMemo(() => (top === null ? null : photoReaderOf(top)), [top]);
  const colours = useMemo(
    () =>
      Object.fromEntries(
        ROOF_SWATCHES.map((swatch) => [swatch, palette[`scene-roof-${swatch}`]]),
      ) as Record<RoofSwatch, string>,
    [palette],
  );
  const dresses = useRoofDresses(scene, picture, pictureComing, colours);
  const model = useMemo(() => roofGeometries(scene, dresses), [scene, dresses]);
  useEffect(() => () => disposeRoofGeometries(model), [model]);
  return model;
}
