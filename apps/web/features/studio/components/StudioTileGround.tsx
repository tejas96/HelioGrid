'use client';
import type { StudioSkyTiles } from '@heliogrid/data/react';
import type { GroundBox } from '@heliogrid/domain';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Color, type MeshBasicMaterial, type Object3D, type PerspectiveCamera } from 'three';
import { edgeFrame, plainGround, surroundOf } from './ground-edge';
import { type GroundPicture, RoofPatch } from './roof-patch';
import { seenGroundReader } from './seen-ground';
import { type ArrivedTile, groundOrder, SkyTileStore } from './sky-tile-store';

/** The room kept round the roofs in the picture their tops wear, in metres. */
const PATCH_ROOM_M = 1;

const scaled = (box: GroundBox, by: number): GroundBox => ({
  west: box.west * by,
  east: box.east * by,
  south: box.south * by,
  north: box.north * by,
});

/** Whether a tile lies under the pin: the first picture of the ground round it. */
const underThePin = ({ west, east, south, north }: GroundBox): boolean =>
  west <= 0 && east > 0 && south <= 0 && north > 0;

/**
 * The sky picture on the site's ground (`T-M05-002a`), tile by tile: a coarse first picture over
 * all the ground the site may show, and sharp tiles under the camera, asked for as it moves, at the
 * zoom this screen can show. A photograph holds its own light, so it is drawn as it is. It holds no
 * rule of its own: which tiles a view needs, and fetching them, are the studio hook's.
 */
export function StudioTileGround({
  tiles,
  page,
  pictureScale,
  roofs,
  onPatch,
  onThumb,
}: {
  tiles: StudioSkyTiles;
  /** The page's colour, which the ground beyond the picture leans to. */
  page: string;
  /** How much the picture is stretched about the pin to its true size. */
  pictureScale: number;
  /** The scene's ground the roofs cover, whose tops wear the picture; `null` before a roof. */
  roofs: GroundBox | null;
  /** Told the picture for the roofs' tops when a new one is made, and `null` when it is gone. */
  onPatch: (patch: GroundPicture | null) => void;
  /** Told the first picture of the ground round the pin, for the picture chip. */
  onThumb: (picture: Blob) => void;
}) {
  const gl = useThree((three) => three.gl);
  const invalidate = useThree((three) => three.invalidate);
  const seenOf = useMemo(seenGroundReader, []);
  const holder = useRef<Object3D>(null);
  const under = useRef<MeshBasicMaterial>(null);
  const edge = useRef<MeshBasicMaterial>(null);
  const ground = useRef(new Color(page));
  const patch = useRef<RoofPatch | null>(null);
  /** The roofs' picture is out of date: a tile came, or the roofs or the stretch changed. */
  const stale = useRef(true);
  const { fetch, lost, reach, base } = tiles;
  // biome-ignore lint/plugin: the web's own pictures on the graphics chip, made and given back with the component
  const [store, setStore] = useState<SkyTileStore | null>(null);

  useEffect(() => {
    let toned = false;
    const arrived = (tile: ArrivedTile) => {
      stale.current = true;
      const tone = tile.base && !toned ? surroundOf(tile.picture, page) : null;
      if (tone !== null) {
        toned = true;
        ground.current = tone;
        under.current?.color.copy(tone);
        edge.current?.color.copy(tone);
      }
      if (tile.base && underThePin(tile.ground)) onThumb(tile.blob);
      invalidate();
    };
    const made = new SkyTileStore(fetch, gl.capabilities.getMaxAnisotropy(), {
      arrived,
      changed: invalidate,
      lost,
    });
    setStore(made);
    return () => {
      made.dispose();
      setStore(null);
    };
  }, [fetch, lost, page, gl, invalidate, onThumb]);

  useEffect(() => {
    const made = new RoofPatch();
    patch.current = made;
    return () => {
      made.dispose();
      patch.current = null;
      onPatch(null);
    };
  }, [onPatch]);

  const plain = useMemo(plainGround, []);
  useEffect(() => () => plain.dispose(), [plain]);
  const frame = useMemo(() => edgeFrame(reach), [reach]);
  useEffect(() => () => frame.dispose(), [frame]);
  // New tiles to ask for, new roofs or a new stretch: one more frame lays them.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each of these asks for one more frame
  useEffect(() => {
    stale.current = true;
    invalidate();
  }, [store, tiles, roofs, pictureScale, invalidate]);

  useFrame(({ camera, size }) => {
    if (store === null) return;
    const seen = seenOf(camera as PerspectiveCamera, size.width / size.height, reach);
    if (seen !== null) {
      // The ground one pixel of this screen covers where the camera looks, as the picture lies.
      const perDevicePixel =
        (2 * seen.distance * seen.down) / size.height / gl.getPixelRatio() / pictureScale;
      const view = tiles.view(scaled(seen.sharp, 1 / pictureScale), perDevicePixel);
      store.want(base, view.tiles, view.zoom, Date.now());
    }
    if (!stale.current || roofs === null || holder.current === null) return;
    stale.current = false;
    const box = {
      west: roofs.west - PATCH_ROOM_M,
      east: roofs.east + PATCH_ROOM_M,
      south: roofs.south - PATCH_ROOM_M,
      north: roofs.north + PATCH_ROOM_M,
    };
    const finest = store.finestOver(scaled(box, 1 / pictureScale));
    if (finest === null) return;
    const tilesOnGround = holder.current;
    const perPixel = tiles.pixelMetres(finest) * pictureScale;
    const made = store.drawnWhole(() =>
      patch.current?.draw(gl, tilesOnGround, box, perPixel, ground.current),
    );
    if (made != null) onPatch(made);
  });

  return (
    <>
      <mesh geometry={plain} rotation-x={-Math.PI / 2} renderOrder={groundOrder.under}>
        <meshBasicMaterial
          ref={under}
          color={page}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {/* The first true length stretches the picture about the pin with every roof on it. */}
      <group ref={holder} scale={[pictureScale, 1, pictureScale]}>
        {store === null ? null : <primitive object={store.group} />}
      </group>
      <mesh
        geometry={frame}
        rotation-x={-Math.PI / 2}
        scale={[pictureScale, pictureScale, 1]}
        renderOrder={groundOrder.over}
      >
        <meshBasicMaterial
          ref={edge}
          color={page}
          vertexColors
          transparent
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
