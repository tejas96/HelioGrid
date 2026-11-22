'use client';
import {
  type PerspectiveCamera,
  type Scene,
  SRGBColorSpace,
  type WebGLRenderer,
  WebGLRenderTarget,
} from 'three';

/** A pixel's red, green, blue and alpha. */
const PIXEL_BYTES = 4;

/** A square of the window, in CSS pixels from its top left corner. */
export interface WindowSquare {
  readonly left: number;
  readonly top: number;
  readonly side: number;
}

/** Rows as the graphics chip hands them, bottom first, turned the right way up. */
function upright(pixels: Uint8ClampedArray<ArrayBuffer>, side: number): ImageData {
  const row = side * PIXEL_BYTES;
  const turned = new Uint8ClampedArray(pixels.length);
  for (let y = 0; y < side; y += 1) {
    turned.set(pixels.subarray(y * row, (y + 1) * row), (side - 1 - y) * row);
  }
  return new ImageData(turned, side, side);
}

/**
 * The scene drawn again through a small square of its window, at the size of the picture it is
 * drawn into — the loupe's picture. Drawn for the loupe, so it is as sharp as the loupe is large,
 * and never copied off the screen: the scene need not keep its last frame for it.
 */
export class SceneLens {
  private target: WebGLRenderTarget | null = null;

  draw(
    gl: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    window: { readonly width: number; readonly height: number },
    square: WindowSquare,
    into: HTMLCanvasElement,
  ): void {
    const pen = into.getContext('2d');
    const side = into.width;
    if (pen === null || side === 0 || into.height !== side) return;
    if (this.target?.width !== side) {
      this.target?.dispose();
      this.target = new WebGLRenderTarget(side, side, { colorSpace: SRGBColorSpace });
    }
    const { target } = this;
    const seen = camera.view === null ? null : { ...camera.view };
    // The window the camera draws, moved to the square.
    camera.setViewOffset(
      window.width,
      window.height,
      square.left + (seen?.offsetX ?? 0),
      square.top + (seen?.offsetY ?? 0),
      square.side,
      square.side,
    );
    const before = gl.getRenderTarget();
    gl.setRenderTarget(target);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(before);
    if (seen === null) camera.clearViewOffset();
    else {
      const { fullWidth, fullHeight, offsetX, offsetY, width, height } = seen;
      camera.setViewOffset(fullWidth, fullHeight, offsetX, offsetY, width, height);
    }
    const pixels = new Uint8ClampedArray(side * side * PIXEL_BYTES);
    gl.readRenderTargetPixels(target, 0, 0, side, side, pixels);
    pen.putImageData(upright(pixels, side), 0, 0);
  }

  dispose(): void {
    this.target?.dispose();
    this.target = null;
  }
}
