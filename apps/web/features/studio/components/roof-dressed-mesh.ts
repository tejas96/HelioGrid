import type {
  LookFamily,
  RoofDress,
  RoofDresses,
  RoofScene,
  RoofSwatch,
  SceneFace,
} from '@heliogrid/domain';
import { type BufferGeometry, Vector3 } from 'three';
import { type CapSegment, capsInto } from './roof-caps';
import {
  anticlockwise,
  cap,
  clockwise,
  empty,
  face,
  faceNormal,
  geometryOf,
  LEVEL,
  ON_GROUND,
  patternOn,
  riseOf,
  type Triangles,
  upRing,
  wall,
  walls,
} from './roof-mesh';

/**
 * The roofs' meshes (`T-M05-002`, part e, roof looks): the kernel's model of the whole design
 * sorted by what each part wears — every wall, parapet and post in plaster; a sawtooth's glass;
 * the tops that wear the photo, laid by their east and north so the ground's picture lies on them
 * where it lies on the ground, with plaster under a face; and one mesh for each material look and
 * colour in use, its pattern laid in metres down each face, with its ridge and hip caps. A design
 * of 200 roofs is drawn in a handful of calls.
 */

/** One look in one colour, and the triangles that wear it. */
export interface LookGeometry {
  readonly family: LookFamily;
  readonly swatch: RoofSwatch;
  readonly seeThrough: boolean;
  readonly geometry: BufferGeometry;
}

export interface RoofGeometries {
  /** Every wall, parapet, post and rail: plaster. */
  readonly walls: BufferGeometry;
  /** A sawtooth's and a monitor's glass. */
  readonly glass: BufferGeometry;
  /** Every top and face that wears the photo. */
  readonly photo: BufferGeometry;
  /** Under a face that wears the photo: plaster, as the photo is laid only on the side the sky sees. */
  readonly undersides: BufferGeometry;
  /** The tops and faces of each look and colour in use. */
  readonly looks: readonly LookGeometry[];
  /** The ridge and hip caps of each look and colour in use. */
  readonly caps: readonly LookGeometry[];
  /** The highest point of the model, in metres: below a hair of it risen, nothing is drawn. */
  readonly topM: number;
}

/** What a roof wears when the model says nothing of it: the photo, as before roof looks. */
const UNDRESSED: RoofDress = {
  photo: true,
  family: 'concrete',
  swatch: 'concrete',
  repeatM: [1, 1],
  cap: null,
  seeThrough: false,
};
const FLAT = new Vector3(0, 1, 0);

/** The meshes being filled: plaster, glass, the photo and its undersides, and each look. */
class Sorted {
  readonly plaster = empty();
  readonly glass = empty();
  readonly photo = empty();
  readonly undersides = empty();
  readonly looks = new Map<string, { dress: RoofDress; triangles: Triangles }>();
  readonly caps = new Map<string, { dress: RoofDress; segments: CapSegment[] }>();
  topM = 0;

  constructor(
    private readonly dresses: readonly RoofDress[],
    readonly facesWearPhoto: readonly boolean[],
  ) {}

  dressOf(roof: number): RoofDress {
    return this.dresses[roof] ?? UNDRESSED;
  }

  lookOf(dress: RoofDress): Triangles {
    const key = `${dress.family}:${dress.swatch}`;
    const found = this.looks.get(key) ?? { dress, triangles: empty() };
    this.looks.set(key, found);
    return found.triangles;
  }

  capsOf(dress: RoofDress): CapSegment[] {
    const key = `${dress.family}:${dress.swatch}`;
    const found = this.caps.get(key) ?? { dress, segments: [] };
    this.caps.set(key, found);
    return found.segments;
  }
}

function prismsInto(into: Sorted, scene: RoofScene) {
  for (const prism of scene.prisms) {
    const rise = riseOf(prism);
    into.topM = Math.max(into.topM, prism.topM + Math.max(0, ...(prism.rise ?? [])));
    walls(into.plaster, prism, rise);
    const holes = prism.holes.map(clockwise);
    const outer = anticlockwise(prism.outer);
    const dress = into.dressOf(prism.roof);
    const flat = patternOn(FLAT, dress.repeatM);
    if (prism.top === 'plain') cap(into.plaster, outer, holes, prism.topM, 1, rise);
    else if (prism.top === 'roof' && dress.photo)
      cap(into.photo, outer, holes, prism.topM, 1, rise);
    else if (prism.top === 'roof') cap(into.lookOf(dress), outer, holes, prism.topM, 1, rise, flat);
    // A sheet on posts is seen from under it too: its own underside.
    if (prism.part !== 'sheet') continue;
    if (dress.photo) cap(into.plaster, outer, holes, prism.footM, -1);
    else cap(into.lookOf(dress), outer, holes, prism.footM, -1, LEVEL, flat);
  }
}

/** A face's ridges and hips, for the caps along them. */
function ridgesOf(each: SceneFace): CapSegment[] {
  return each.edges.flatMap((kind, i): CapSegment[] => {
    const from = each.corners[i];
    const to = each.corners[(i + 1) % each.corners.length];
    if ((kind !== 'ridge' && kind !== 'hip') || from === undefined || to === undefined) return [];
    return [{ from, to }];
  });
}

function facesInto(into: Sorted, scene: RoofScene) {
  scene.faces.forEach((each, index) => {
    into.topM = Math.max(into.topM, ...each.corners.map((corner) => corner.up));
    // The plan's split wants the outline one way round and each hole the other.
    const corners = upRing(each.corners, true);
    const holes = each.holes.map((hole) => upRing(hole, false));
    const dress = into.dressOf(each.roof);
    const normal = faceNormal(corners);
    // A face the photo shows true wears it; one too steep for the sky wears the roof's material.
    if (into.facesWearPhoto[index] === true) {
      face(into.photo, corners, holes, ON_GROUND, into.undersides);
      return;
    }
    face(into.lookOf(dress), corners, holes, patternOn(normal, dress.repeatM), null);
    if (!dress.photo && dress.cap !== null) into.capsOf(dress).push(...ridgesOf(each));
  });
}

function wallsInto(into: Sorted, scene: RoofScene) {
  for (const each of scene.walls) {
    into.topM = Math.max(into.topM, each.fromTopM, each.toTopM);
    // Glass is one pane, drawn from both sides by its material: drawn twice it would look half as clear.
    if (each.kind === 'glass') {
      wall(into.glass, each.from, each.to, each.footM, each.fromTopM, each.toTopM);
      continue;
    }
    wall(into.plaster, each.from, each.to, each.footM, each.fromTopM, each.toTopM);
    // A gable's wall is seen from both sides of the roof's end: its other side too.
    wall(into.plaster, each.to, each.from, each.footM, each.toTopM, each.fromTopM);
  }
}

/** The whole design's meshes. The caller disposes them (`disposeRoofGeometries`). */
export function roofGeometries(scene: RoofScene, dresses: RoofDresses): RoofGeometries {
  const sorted = new Sorted(dresses.roofs, dresses.facesWearPhoto);
  prismsInto(sorted, scene);
  facesInto(sorted, scene);
  wallsInto(sorted, scene);
  const of = ({ family, swatch, seeThrough }: RoofDress, triangles: Triangles): LookGeometry => ({
    family,
    swatch,
    seeThrough,
    geometry: geometryOf(triangles),
  });
  return {
    walls: geometryOf(sorted.plaster),
    glass: geometryOf(sorted.glass),
    photo: geometryOf(sorted.photo),
    undersides: geometryOf(sorted.undersides),
    looks: [...sorted.looks.values()].map(({ dress, triangles }) => of(dress, triangles)),
    caps: [...sorted.caps.values()].map(({ dress, segments }) => {
      const triangles = empty();
      capsInto(triangles, segments, dress.cap ?? 'folded');
      return of(dress, triangles);
    }),
    topM: sorted.topM,
  };
}

export function disposeRoofGeometries(model: RoofGeometries) {
  for (const geometry of [model.walls, model.glass, model.photo, model.undersides])
    geometry.dispose();
  for (const each of [...model.looks, ...model.caps]) each.geometry.dispose();
}
