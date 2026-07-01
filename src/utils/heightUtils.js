import { fromArrayBuffer } from "geotiff";

export async function fetchExactBuildingHeight(dsmUrl, demUrl, apiKey) {
  try {
    console.log("📏 [Height Engine] Starting LiDAR extraction...");
    
    const [dsmRes, demRes] = await Promise.all([
      fetch(`${dsmUrl}&key=${apiKey}`),
      fetch(`${demUrl}&key=${apiKey}`)
    ]);

    if (!dsmRes.ok || !demRes.ok) {
      console.warn("📏 [Height Engine] API rejected the GeoTIFF request.");
      return null;
    }

    const [dsmBuffer, demBuffer] = await Promise.all([
      dsmRes.arrayBuffer(),
      demRes.arrayBuffer()
    ]);

    const dsmTiff = await fromArrayBuffer(dsmBuffer);
    const demTiff = await fromArrayBuffer(demBuffer);
    
    const dsmImage = await dsmTiff.getImage();
    const demImage = await demTiff.getImage();

    const dsmData = (await dsmImage.readRasters())[0];
    const demData = (await demImage.readRasters())[0];

    const width = dsmImage.getWidth();
    const height = dsmImage.getHeight();
    
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    // Google Solar API is usually ~0.1 meters per pixel.
    // To scan a 5x5 meter area in the center of our click, we scan a 50x50 pixel box.
    const scanRadius = 25; 
    
    let maxRoofElevation = -Infinity;
    let groundElevationAtMax = 0;
    let validPixelsFound = 0;

    // Scan a grid around the center to find the absolute highest point of the roof
    for (let y = centerY - scanRadius; y <= centerY + scanRadius; y++) {
      for (let x = centerX - scanRadius; x <= centerX + scanRadius; x++) {
        // Ensure we don't go out of bounds
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const index = (y * width) + x;
        const roofZ = dsmData[index];
        const groundZ = demData[index];

        if (roofZ !== -9999 && groundZ !== -9999) {
          validPixelsFound++;
          if (roofZ > maxRoofElevation) {
            maxRoofElevation = roofZ;
            groundElevationAtMax = groundZ;
          }
        }
      }
    }

    if (validPixelsFound === 0 || maxRoofElevation === -Infinity) {
      console.warn("📏 [Height Engine] No valid LiDAR data found in the scanned area.");
      return null;
    }

    const buildingHeightMeters = maxRoofElevation - groundElevationAtMax;
    console.log(`📏 [Height Engine] SUCCESS! Max Roof: ${maxRoofElevation.toFixed(2)}m, Ground: ${groundElevationAtMax.toFixed(2)}m`);
    console.log(`📏 [Height Engine] Final Calculated Height: ${buildingHeightMeters.toFixed(2)}m`);

    if (buildingHeightMeters < 2.5 || buildingHeightMeters > 150) {
      console.warn(`📏 [Height Engine] Height (${buildingHeightMeters.toFixed(2)}m) seems unrealistic. Falling back to default.`);
      return null;
    }

    return Number(buildingHeightMeters.toFixed(2));
  } catch (error) {
    console.error("📏 [Height Engine] Fatal error during extraction:", error);
    return null;
  }
}