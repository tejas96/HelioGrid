'use client';
import type { GroundBox } from '@heliogrid/domain';
import {
  Color,
  LinearMipmapLinearFilter,
  type Object3D,
  OrthographicCamera,
  SRGBColorSpace,
  type Texture,
  type WebGLRenderer,
  WebGLRenderTarget,
} from 'three';

/** The picture a roof's top wears: the most and the fewest pixels a side. */
const PATCH_MAX_PX = 2_048;
const PATCH_MIN_PX = 64;
/** How high over the ground the patch is looked at from: above any roof. */
const PATCH_FROM_M = 500;

/** A picture laid on a box of the scene's ground, in metres east and north of the pin. */
export interface GroundPicture extends GroundBox {
  readonly texture: Texture;
}

/** The picture the roofs' tops wear, drawn from the tiles straight down; redrawn as tiles come. */
export class RoofPatch {
  private target: WebGLRenderTarget | null = null;
  private readonly eye = new OrthographicCamera();
  private readonly was = new Color();

  /** Draws the tiles under `box` into the patch; answers the patch when it is a new one. */
  draw(
    gl: WebGLRenderer,
    tiles: Object3D,
    box: GroundBox,
    pixelMetres: number,
    ground: Color,
  ): GroundPicture | null {
    const across = box.east - box.west;
    const along = box.north - box.south;
    const side = (metres: number) =>
      Math.min(PATCH_MAX_PX, Math.max(PATCH_MIN_PX, Math.ceil(metres / pixelMetres)));
    const [width, height] = [side(across), side(along)];
    const made =
      this.target === null || this.target.width !== width || this.target.height !== height;
    if (made) {
      this.target?.dispose();
      this.target = new WebGLRenderTarget(width, height, {
        colorSpace: SRGBColorSpace,
        depthBuffer: false,
        generateMipmaps: true,
        minFilter: LinearMipmapLinearFilter,
      });
      this.target.texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    }
    const target = this.target;
    if (target === null) return null;
    // A roof's top is mapped by its own ground: metres east and north, into the patch's box.
    target.texture.repeat.set(1 / across, 1 / along);
    target.texture.offset.set(-box.west / across, -box.south / along);
    const eye = this.eye;
    eye.left = -across / 2;
    eye.right = across / 2;
    eye.top = along / 2;
    eye.bottom = -along / 2;
    eye.near = 1;
    eye.far = PATCH_FROM_M * 2;
    eye.up.set(0, 0, -1);
    eye.position.set((box.west + box.east) / 2, PATCH_FROM_M, -(box.south + box.north) / 2);
    eye.lookAt(eye.position.x, 0, eye.position.z);
    eye.updateProjectionMatrix();
    eye.updateMatrixWorld();
    const before = gl.getRenderTarget();
    const alpha = gl.getClearAlpha();
    gl.getClearColor(this.was);
    gl.setRenderTarget(target);
    gl.setClearColor(ground, 1);
    gl.clear();
    gl.render(tiles, eye);
    gl.setRenderTarget(before);
    gl.setClearColor(this.was, alpha);
    return made ? { texture: target.texture, ...box } : null;
  }

  dispose(): void {
    this.target?.dispose();
    this.target = null;
  }
}
