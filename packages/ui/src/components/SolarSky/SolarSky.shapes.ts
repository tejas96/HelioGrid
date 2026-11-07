/**
 * The door's sky, drawn as data: a two-storey home with a flat RCC roof and one row of modules on a
 * tilted frame, its inverter and net meter, the grid pole, a tree, the sun's path and the night's
 * stars. Every number is in the scene's own 400 × 240 box; both halves draw from here. This is brand
 * art, not an icon, so `biome.json` lets this file hold path data.
 */
export const SCENE = { width: 400, height: 240, ground: 214 } as const;

export type Point = readonly [number, number];

/** The sun's arc: from sunrise on the left, through its noon height, to sunset on the right. */
export const SUN_ARC = {
  start: [24, 206],
  control: [200, -110],
  end: [376, 206],
} as const satisfies {
  start: Point;
  control: Point;
  end: Point;
};

export const SUN_ARC_PATH = 'M24 206 Q200 -110 376 206';

/** The home, the roof's parapet and stair room, the windows and the door: faint and firm lines. */
export const HOME_STROKES: readonly string[] = [
  'M150 214 V124 H300 V214',
  'M146 124 H304',
  'M150 118 H300 V124 M150 118 V124',
  'M262 118 V96 H298 V118',
  'M150 170 H300',
  'M214 214 V182 H236 V214',
  'M180 182 H208 V204 H180 Z',
  'M262 182 H290 V204 H262 Z',
  'M180 136 H208 V158 H180 Z',
  'M262 136 H290 V158 H262 Z',
];

/** The windows' panes, filled warm when the home is lit at night. */
export const WINDOWS: readonly string[] = [
  'M180 182 H208 V204 H180 Z',
  'M262 182 H290 V204 H262 Z',
  'M180 136 H208 V158 H180 Z',
  'M262 136 H290 V158 H262 Z',
];

/** The ground, a path to the door, the low compound wall, the tree and a shrub. */
export const SITE_STROKES: readonly string[] = [
  'M0 214 H400',
  'M216 214 L206 240 M234 214 L244 240',
  'M86 214 V202 H146 V214',
  'M332 214 V188',
  'M356 214 V206',
];

/** The tree's crown and the shrub, as circles: centre x, centre y, radius. */
export const CROWNS: readonly (readonly [number, number, number])[] = [
  [332, 176, 15],
  [356, 202, 7],
];

/** The module frame under the row, and its back struts. */
export const FRAME_STROKES: readonly string[] = [
  'M150 117 H262',
  'M159 117 V96 M195 117 V96 M231 117 V96',
];

const MODULE_LEFT = 152;
const MODULE_STEP = 18;
const MODULE_WIDTH = 16;
const MODULE_FRONT = 116;
const MODULE_BACK = 95;
const MODULE_SKEW = 7;
export const MODULE_COUNT = 6;

/** One module on the tilted frame: its outline, its cell lines and its glint, by place in the row. */
export interface ModuleShape {
  readonly outline: string;
  readonly cells: string;
  readonly glint: string;
}

function moduleAt(index: number): ModuleShape {
  const x = MODULE_LEFT + index * MODULE_STEP;
  const w = MODULE_WIDTH;
  const s = MODULE_SKEW;
  const mid = (MODULE_FRONT + MODULE_BACK) / 2;
  return {
    outline: `M${x} ${MODULE_FRONT} H${x + w} L${x + w + s} ${MODULE_BACK} H${x + s} Z`,
    cells: `M${x + w / 2} ${MODULE_FRONT} L${x + w / 2 + s} ${MODULE_BACK} M${x + s / 2} ${mid} H${x + w + s / 2}`,
    glint: `M${x + s + 3} ${MODULE_BACK + 1} H${x + s + 7} L${x + 7} ${MODULE_FRONT - 1} H${x + 3} Z`,
  };
}

export const MODULES: readonly ModuleShape[] = Array.from({ length: MODULE_COUNT }, (_, i) =>
  moduleAt(i),
);

/** Where the sun's two rays land: the middle of each half of the row. */
export const RAY_TARGETS: readonly Point[] = [
  [184, 104],
  [238, 104],
];

/** The inverter on the compound wall, the net meter on the pole line, and the grid pole. */
export const EQUIPMENT_STROKES: readonly string[] = [
  'M116 180 H136 V200 H116 Z',
  'M120 186 H132 M120 190 H128',
  'M92 168 H104 V180 H92 Z',
  'M56 214 V118 M44 126 H68 M48 134 H64',
];

/** The wires the energy runs along: the row to the inverter, the inverter to the home, then to the grid. */
export const WIRES: readonly (readonly Point[])[] = [
  [
    [150, 112],
    [142, 112],
    [142, 190],
    [136, 190],
  ],
  [
    [136, 196],
    [150, 196],
  ],
  [
    [116, 196],
    [98, 196],
    [98, 180],
    [98, 168],
    [98, 148],
    [58, 128],
  ],
];

/** Stars after sunset, with how bright each sits. */
export const STARS: readonly (readonly [number, number, number])[] = [
  [40, 30, 1.4],
  [88, 62, 1],
  [132, 18, 1.2],
  [176, 54, 0.9],
  [224, 22, 1.4],
  [268, 60, 1],
  [314, 26, 1.2],
  [356, 58, 0.9],
  [380, 16, 1.1],
  [12, 86, 0.8],
  [392, 92, 0.8],
];

/** The perspective solar grid that runs from the horizon toward the viewer, under the scene. */
export function floorLines(rows: number, columns: number): readonly string[] {
  const lines: string[] = [];
  const top = SCENE.ground;
  const bottom = SCENE.height;
  const vanishX = SCENE.width / 2;
  for (let c = -columns; c <= columns; c += 1) {
    const x = vanishX + c * 28;
    lines.push(`M${vanishX + c * 9} ${top} L${x} ${bottom}`);
  }
  for (let r = 1; r <= rows; r += 1) {
    const t = r / rows;
    const y = top + (bottom - top) * t * t;
    lines.push(`M0 ${y.toFixed(1)} H${SCENE.width}`);
  }
  return lines;
}

/** A wire as a path through its points. */
export function wirePath(points: readonly Point[]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}

/** A ray from the sun to where it lands. */
export function rayPath(from: Point, to: Point): string {
  return `M${from[0].toFixed(1)} ${from[1].toFixed(1)} L${to[0]} ${to[1]}`;
}

/** The moon after sunset: a crescent around its centre. */
export function moonPath([cx, cy]: Point): string {
  return `M${cx + 4} ${cy - 12} a12 12 0 1 0 9 20 a10 10 0 1 1 -9 -20 Z`;
}

/** The home's walls and the stair room, filled under their lines. */
export const HOME_FILLS: readonly string[] = [
  'M150 214 V124 H300 V214 Z',
  'M262 118 V96 H298 V118 Z',
];

/** Other rooftops on the skyline behind, some already carrying panels: every rooftop is a lead. */
export const SKYLINE: readonly string[] = [
  'M0 214 V186 H36 V214 Z',
  'M38 214 V176 H70 V214 Z',
  'M72 214 V192 H100 V214 Z',
  'M304 214 V188 H334 V214 Z',
  'M340 214 V172 H374 V214 Z',
  'M376 214 V184 H400 V214 Z',
];

/** The panels on the skyline's rooftops. */
export const SKYLINE_PANELS: readonly string[] = [
  'M42 175 H62 L66 168 H46 Z',
  'M344 171 H366 L370 163 H348 Z',
  'M6 185 H24 L27 179 H9 Z',
];

/** The soft shadow the home casts on the ground: centre x, centre y, half width, half height. */
export const GROUND_SHADOW = [226, 216, 96, 5] as const;

/** Clouds drifting across the sky: where each rests and its size. */
export const CLOUDS: readonly { readonly x: number; readonly y: number; readonly size: number }[] =
  [
    { x: 92, y: 52, size: 1 },
    { x: 318, y: 34, size: 0.78 },
  ];

/** One cloud's puffs around its rest point: centre offsets and radii, then its flat base. */
export const CLOUD_PUFFS: readonly (readonly [number, number, number])[] = [
  [-18, 4, 10],
  [0, -4, 14],
  [18, 4, 10],
];
export const CLOUD_BASE = { x: -28, y: 4, width: 56, height: 10 } as const;
