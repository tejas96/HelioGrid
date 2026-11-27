import type { ThemePalette } from '@heliogrid/theme';
import {
  CanvasTexture,
  Color,
  DoubleSide,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshStandardMaterial,
  RGBADepthPacking,
  SRGBColorSpace,
  type Texture,
  Vector2,
  Vector4,
} from 'three';

/**
 * LiDAR's look on the scan (`T-M05-002g`, board frames 5–8): one lit standard material whose
 * colour is worked in the shader — the straight-down photo on the tops, the studio's plaster on the
 * walls, Heights as the key's colours, Sunlight dimming the scan under the roofs' own colours — all
 * of it out to the data's edge, on the dark stage. Where a roof is drawn the scan is pressed flat to the
 * model's ground, a pad the studio's own model stands on: no scanned wall shows through the
 * model's walls, and the pressed scan casts no second shadow. Every colour is a theme token.
 */

/** The ramps are drawn on a strip this many pixels wide. */
const RAMP_PX = 256;
const RAMP_ROWS = 1;
const HEIGHT_KEY = [
  'scene-height-1',
  'scene-height-2',
  'scene-height-3',
  'scene-height-4',
  'scene-height-5',
] as const;
/** The scan's roughness: matt plaster and concrete, as the studio's own walls. */
const ROUGHNESS = 0.92;

function rampOf(colours: readonly string[]): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = RAMP_PX;
  canvas.height = RAMP_ROWS;
  const pen = canvas.getContext('2d');
  if (pen !== null) {
    const run = pen.createLinearGradient(0, 0, RAMP_PX, 0);
    for (const [i, colour] of colours.entries()) run.addColorStop(i / (colours.length - 1), colour);
    pen.fillStyle = run;
    pen.fillRect(0, 0, RAMP_PX, RAMP_ROWS);
  }
  const ramp = new CanvasTexture(canvas);
  ramp.colorSpace = SRGBColorSpace;
  return ramp;
}

/** The uniforms the scan's shaders share; the scene sets them, and the frame is drawn again. */
export interface ScanUniforms {
  readonly uLook: { value: number };
  readonly uSunOn: { value: number };
  readonly uPhoto: { value: Texture | null };
  readonly uPhotoOn: { value: number };
  /** The photo's box on the map's ground: west, south, east, north. */
  readonly uPhotoBox: { value: Vector4 };
  readonly uRamp: { value: Texture };
  /** The Heights key's low and high, in metres above the site's datum. */
  readonly uKey: { value: Vector2 };
  readonly uWall: { value: Color };
  readonly uCut: { value: Texture | null };
  readonly uCutOn: { value: number };
  /** The cut's box on the ground: west, south, east, north. */
  readonly uCutBox: { value: Vector4 };
  /** The model's ground in the scan's own heights: the pad under the drawn roofs lies there. */
  readonly uFloor: { value: number };
}

export function scanUniformsOf(palette: ThemePalette): ScanUniforms {
  return {
    uLook: { value: 0 },
    uSunOn: { value: 0 },
    uPhoto: { value: null },
    uPhotoOn: { value: 0 },
    uPhotoBox: { value: new Vector4(-1, -1, 1, 1) },
    uRamp: { value: rampOf(HEIGHT_KEY.map((name) => palette[name])) },
    uKey: { value: new Vector2(0, 1) },
    uWall: { value: new Color(palette['scene-wall']) },
    uCut: { value: null },
    uCutOn: { value: 0 },
    uCutBox: { value: new Vector4(-1, -1, 1, 1) },
    uFloor: { value: 0 },
  };
}

/** How much a point of the scan lies under a drawn roof: 1 there, 0 elsewhere. */
const PAD_OF = `
uniform sampler2D uCut; uniform float uCutOn; uniform vec4 uCutBox; uniform float uFloor;
float padOf(vec3 local) {
  vec2 at = ((modelMatrix * vec4(local, 1.0)).xz * vec2(1.0, -1.0) - uCutBox.xy) / (uCutBox.zw - uCutBox.xy);
  float inside = step(0.0, at.x) * step(at.x, 1.0) * step(0.0, at.y) * step(at.y, 1.0);
  return uCutOn * inside * step(0.5, texture2D(uCut, at).r);
}`;
const PAD_HEIGHT = 'transformed.y = mix(transformed.y, min(transformed.y, uFloor), pad);';

const LOOK = `
vec2 photoAt = (vLocal.xz * vec2(1.0, -1.0) - uPhotoBox.xy) / (uPhotoBox.zw - uPhotoBox.xy);
vec3 photo = texture2D(uPhoto, vec2(photoAt.x, photoAt.y)).rgb;
float onPhoto = uPhotoOn * step(0.0, photoAt.x) * step(photoAt.x, 1.0) * step(0.0, photoAt.y) * step(photoAt.y, 1.0);
float up = clamp((vNormalW.y - 0.35) / 0.3, 0.0, 1.0);
vec3 wall = mix(uWall * 0.42, uWall * 0.92, clamp((vLocal.y - uKey.x) / 10.0, 0.0, 1.0));
vec3 top = mix(uWall * 0.55, photo, onPhoto);
vec3 base = mix(wall, top, up);
if (uLook == 1) {
  vec3 hc = texture2D(uRamp, vec2(clamp((vLocal.y - uKey.x) / max(0.1, uKey.y - uKey.x), 0.0, 1.0), 0.5)).rgb;
  base = mix(hc * 0.8, mix(hc, top, 0.18 * onPhoto), up);
}
if (uSunOn > 0.5) base *= 0.55;
diffuseColor.rgb = base;`;

/**
 * The scan's material: `cut` leaves the scan out under the drawn roofs. A see-through scan draws
 * after a depth-only twin, so only its nearest skin shows.
 */
export function scanMaterialOf(uniforms: ScanUniforms): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    roughness: ROUGHNESS,
    metalness: 0,
    side: DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vWorld;\nvarying vec3 vLocal;\nvarying vec3 vNormalW;${PAD_OF}`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nfloat pad = padOf(position);\nobjectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), pad));',
      )
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${PAD_HEIGHT}`)
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvLocal = transformed;\nvNormalW = normalize(mat3(modelMatrix) * objectNormal);',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vWorld; varying vec3 vLocal; varying vec3 vNormalW;
uniform int uLook; uniform float uSunOn; uniform sampler2D uPhoto; uniform float uPhotoOn;
uniform vec4 uPhotoBox; uniform sampler2D uRamp; uniform vec2 uKey; uniform vec3 uWall;`,
      )
      .replace('#include <map_fragment>', LOOK);
  };
  material.customProgramCacheKey = () => 'lidar-scan';
  material.fog = false;
  return material;
}

/** The shadow the scan casts, pressed flat where a roof is drawn, as the scan is. */
export function scanShadowOf(uniforms: ScanUniforms): MeshDepthMaterial {
  const material = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: DoubleSide });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uCut: uniforms.uCut,
      uCutOn: uniforms.uCutOn,
      uCutBox: uniforms.uCutBox,
      uFloor: uniforms.uFloor,
    });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>${PAD_OF}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nfloat pad = padOf(position);\n${PAD_HEIGHT}`,
      );
  };
  material.customProgramCacheKey = () => 'lidar-scan-shadow';
  return material;
}

/** The depth-only twin a see-through scan draws first, pressed flat under the roofs as it is. */
export function scanDepthOnlyOf(uniforms: ScanUniforms): MeshBasicMaterial {
  const material = new MeshBasicMaterial({ colorWrite: false, side: DoubleSide });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uCut: uniforms.uCut,
      uCutOn: uniforms.uCutOn,
      uCutBox: uniforms.uCutBox,
      uFloor: uniforms.uFloor,
    });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>${PAD_OF}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nfloat pad = padOf(position);\n${PAD_HEIGHT}`,
      );
  };
  material.customProgramCacheKey = () => 'lidar-scan-depth';
  return material;
}

/** How far a drawn roof's pad reaches past its outline: the scan's soft wall round it goes too. */
const CUT_RIM_M = 1;
const CUT_PX = 1024;

/**
 * The ground under the drawn roofs, white on a canvas covering `box`: the scan is left out there.
 * `outlines` in metres east and north.
 */
export function cutOf(
  outlines: readonly (readonly { readonly east: number; readonly north: number }[])[],
  box: {
    readonly west: number;
    readonly south: number;
    readonly east: number;
    readonly north: number;
  },
  into: HTMLCanvasElement,
  /** The cut's ink: any light colour, read by its red. */
  ink: string,
): void {
  into.width = CUT_PX;
  into.height = CUT_PX;
  const pen = into.getContext('2d');
  if (pen === null) return;
  const x = (east: number) => ((east - box.west) / (box.east - box.west)) * CUT_PX;
  const y = (north: number) => ((box.north - north) / (box.north - box.south)) * CUT_PX;
  pen.clearRect(0, 0, CUT_PX, CUT_PX);
  pen.fillStyle = ink;
  pen.strokeStyle = ink;
  pen.lineJoin = 'round';
  pen.lineWidth = ((2 * CUT_RIM_M) / (box.east - box.west)) * CUT_PX;
  for (const outline of outlines) {
    pen.beginPath();
    for (const [i, p] of outline.entries()) {
      if (i === 0) pen.moveTo(x(p.east), y(p.north));
      else pen.lineTo(x(p.east), y(p.north));
    }
    pen.closePath();
    pen.fill();
    pen.stroke();
  }
}
