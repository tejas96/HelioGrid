'use client';
import type { StudioSkyTile } from '@heliogrid/data/react';
import type { GroundBox, SkyTileKey } from '@heliogrid/domain';
import {
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Texture,
} from 'three';

/**
 * The most sharp tiles kept at once, beyond the first picture's: a tile and its smaller copies take
 * about 1.4 MB on the graphics chip, so a phone holds about 100 MB of picture at the most. The
 * tiles asked for longest ago go first.
 */
const KEPT_MAX = 72;
/** A tile that did not come is not asked for again sooner than this. */
const RETRY_MS = 15_000;
/**
 * The ground is drawn before anything else in the scene, by these orders alone and never by depth:
 * the plain ground, the tiles from `tiles` on with the coarser first, and the ground's soft edge
 * over them. They lie flat on one ground, and a phone's graphics chip let one flash through
 * another while the camera moved.
 */
export const groundOrder = { under: -50, tiles: -40, over: -10 } as const;

export const tileName = (key: SkyTileKey): string => `${key.z}/${key.x}/${key.y}`;

/** A tile that came: where it lies, and its picture as the browser decoded it. */
export interface ArrivedTile {
  readonly key: SkyTileKey;
  readonly ground: GroundBox;
  /** One of the first, coarsest picture's tiles. */
  readonly base: boolean;
  readonly blob: Blob;
  readonly picture: ImageBitmap;
}

interface Held {
  readonly key: SkyTileKey;
  readonly ground: GroundBox;
  base: boolean;
  state: 'loading' | 'ready' | 'failed';
  /** The turn it was last asked for in: the least recent goes first. */
  wantedAt: number;
  failedAt: number;
  stop: AbortController | null;
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial> | null;
}

/**
 * One square, a metre a side, lying north up, that every tile stretches to its ground. Its picture
 * is laid top row north: the browser hands a decoded picture top row first, which the graphics chip
 * reads as the bottom, so the square's own picture coordinates are turned over instead.
 */
function tileSquare(): PlaneGeometry {
  const square = new PlaneGeometry(1, 1);
  const { uv } = square.attributes;
  if (uv !== undefined) {
    for (let at = 0; at < uv.count; at += 1) uv.setY(at, 1 - uv.getY(at));
    uv.needsUpdate = true;
  }
  return square;
}

/**
 * The tiles of one site's sky picture on the graphics chip (`T-M05-002a`): asked for when wanted,
 * shown as they come — the coarse first picture under everything, sharper tiles over it — and let
 * go when no view has wanted them for a while. It holds no rule of what to ask for: the ground
 * tells it each time the camera moves.
 */
export class SkyTileStore {
  /** The tiles, lying flat: x runs east, and the group's own y is the ground's north. */
  readonly group = new Group();
  private readonly held = new Map<string, Held>();
  private readonly square = tileSquare();
  private turn = 0;
  private gone = false;

  constructor(
    private readonly fetch: (key: SkyTileKey, signal: AbortSignal) => Promise<Blob | null>,
    /** How sharp a tile stays when seen at a slant: the most the graphics chip gives. */
    private readonly anisotropy: number,
    private readonly on: {
      /** A tile came and is on the ground. */
      arrived(tile: ArrivedTile): void;
      /** A tile was let go, or its ask ended with no picture. */
      changed(): void;
      /** No tile of the first picture came. */
      lost(): void;
    },
  ) {
    this.group.rotation.x = -Math.PI / 2;
  }

  /**
   * What the view wants now: the first picture's tiles, whole, and the sharp tiles under the
   * camera at `zoom`. What is not held is asked for, nearest first as the lists come; an ask no
   * view wants any more is dropped. A sharper tile than the view asks for stays up until the
   * view's own tiles have all come, so the picture never goes soft in passing.
   */
  want(
    base: readonly StudioSkyTile[],
    view: readonly StudioSkyTile[],
    zoom: number,
    now: number,
  ): void {
    if (this.gone) return;
    this.turn += 1;
    const wanted = new Set<string>();
    for (const tile of base) wanted.add(this.wanted(tile, true, now));
    for (const tile of view) wanted.add(this.wanted(tile, false, now));
    const settled = view.every((tile) => this.held.get(tileName(tile.key))?.state === 'ready');
    const spare: Held[] = [];
    for (const [name, held] of this.held) {
      if (held.state === 'loading' && !wanted.has(name)) {
        held.stop?.abort();
        this.held.delete(name);
      } else if (held.mesh !== null) {
        held.mesh.visible = held.base || held.key.z <= zoom || !settled;
        if (!held.base && !wanted.has(name)) spare.push(held);
      }
    }
    this.keepAtMost(spare);
  }

  /** One wanted tile: asked for when not held, and asked for again once a failed ask is old. */
  private wanted(tile: StudioSkyTile, base: boolean, now: number): string {
    const name = tileName(tile.key);
    const held = this.held.get(name);
    if (held === undefined) this.ask(tile, name, base);
    else {
      held.wantedAt = this.turn;
      held.base ||= base;
      if (held.state === 'failed' && now - held.failedAt >= RETRY_MS) {
        this.held.delete(name);
        this.ask(tile, name, held.base);
      }
    }
    return name;
  }

  /** Lets go of the tiles no view asked for longest ago, past the most that are kept. */
  private keepAtMost(spare: Held[]): void {
    const kept = [...this.held.values()].filter((held) => held.mesh !== null && !held.base).length;
    spare.sort((a, b) => a.wantedAt - b.wantedAt);
    for (const held of spare.slice(0, Math.max(0, kept - KEPT_MAX))) this.letGo(held);
  }

  /**
   * Draws with every tile held on show, whatever the view has up, then puts each back as it was.
   * The roofs' picture is drawn through it: a view that has stepped out to a coarser zoom hides its
   * sharper tiles, and a roof's top must not go soft with it.
   */
  drawnWhole<Drawn>(draw: () => Drawn): Drawn {
    const hidden = this.group.children.filter((mesh) => !mesh.visible);
    for (const mesh of hidden) mesh.visible = true;
    try {
      return draw();
    } finally {
      for (const mesh of hidden) mesh.visible = false;
    }
  }

  /** How sharp the ground under a box is right now: the finest zoom of a tile that touches it. */
  finestOver(box: GroundBox): number | null {
    let finest: number | null = null;
    for (const { mesh, ground, key } of this.held.values()) {
      const touches =
        mesh !== null &&
        ground.west < box.east &&
        ground.east > box.west &&
        ground.south < box.north &&
        ground.north > box.south;
      if (touches && (finest === null || key.z > finest)) finest = key.z;
    }
    return finest;
  }

  private ask({ key, ground }: StudioSkyTile, name: string, base: boolean): void {
    const stop = new AbortController();
    const held: Held = {
      key,
      ground,
      base,
      state: 'loading',
      wantedAt: this.turn,
      failedAt: 0,
      stop,
      mesh: null,
    };
    this.held.set(name, held);
    void this.fetch(key, stop.signal)
      .then(async (blob) =>
        blob === null ? null : { blob, picture: await createImageBitmap(blob) },
      )
      // A picture the browser cannot read is a tile that did not come.
      .catch(() => null)
      .then((came) => {
        if (this.gone || this.held.get(name) !== held) {
          came?.picture.close();
          return;
        }
        held.stop = null;
        if (came === null) {
          held.state = 'failed';
          held.failedAt = Date.now();
          const first = [...this.held.values()].filter((one) => one.base);
          if (held.base && first.every((one) => one.state === 'failed')) this.on.lost();
          this.on.changed();
          return;
        }
        held.state = 'ready';
        held.mesh = this.laid(held, came.picture);
        this.on.arrived({ key, ground: held.ground, base: held.base, ...came });
      });
  }

  /** The tile on the ground: its picture with its smaller copies, so far ground stays smooth. */
  private laid(held: Held, picture: ImageBitmap): Mesh<PlaneGeometry, MeshBasicMaterial> {
    const map = new Texture(picture);
    map.colorSpace = SRGBColorSpace;
    map.generateMipmaps = true;
    map.minFilter = LinearMipmapLinearFilter;
    map.magFilter = LinearFilter;
    map.anisotropy = this.anisotropy;
    map.needsUpdate = true;
    // A photograph holds its own light: its true colours, untouched by the scene's light or tone,
    // and it writes no depth, so whatever stands on the ground is drawn over it.
    const material = new MeshBasicMaterial({
      map,
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(this.square, material);
    const { west, east, south, north } = held.ground;
    mesh.position.set((west + east) / 2, (south + north) / 2, 0);
    mesh.scale.set(east - west, north - south, 1);
    mesh.renderOrder = groundOrder.tiles + held.key.z;
    this.group.add(mesh);
    return mesh;
  }

  private letGo(held: Held): void {
    this.held.delete(tileName(held.key));
    if (held.mesh === null) return;
    this.group.remove(held.mesh);
    const { map } = held.mesh.material;
    held.mesh.material.dispose();
    if (map !== null) {
      map.dispose();
      (map.image as ImageBitmap).close();
    }
    held.mesh = null;
  }

  /** Every ask stopped and every picture given back to the graphics chip. */
  dispose(): void {
    this.gone = true;
    for (const held of [...this.held.values()]) {
      held.stop?.abort();
      this.letGo(held);
    }
    this.held.clear();
    this.square.dispose();
  }
}
