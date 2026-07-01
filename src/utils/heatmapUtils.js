import { fromArrayBuffer } from "geotiff";

export async function generateFluxHeatmapCanvas(tiffBuffer, monthIndex = 5) {
  if (!tiffBuffer) return null;

  const tiff = await fromArrayBuffer(tiffBuffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters();
  const width = image.getWidth();
  const height = image.getHeight();

  const bandIndex = rasters.length === 12 ? Math.max(0, Math.min(11, monthIndex)) : 0;
  const data = rasters[bandIndex];

  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    if (val !== -9999 && val > 0) {
      if (val < min) min = val;
      if (val > max) max = val;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.createImageData(width, height);

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    const idx = i * 4;

    if (val === -9999 || val <= 0) {
      imgData.data[idx] = 0;     
      imgData.data[idx + 1] = 0; 
      imgData.data[idx + 2] = 0; 
      imgData.data[idx + 3] = 0; 
    } else {
      const normalized = (val - min) / (max - min);
      imgData.data[idx] = Math.min(255, Math.max(0, Math.floor(255 * Math.pow(normalized, 0.5))));
      imgData.data[idx + 1] = Math.min(255, Math.max(0, Math.floor(255 * Math.sin(normalized * Math.PI))));
      imgData.data[idx + 2] = Math.min(255, Math.max(0, Math.floor(255 * (1 - normalized))));
      imgData.data[idx + 3] = 230; 
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}