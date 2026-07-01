/**
 * Calculates the exact Sun Position (Elevation and Azimuth) 
 * based on standard astronomical algorithms (similar to NOAA's calculations).
 * * @param {number} month - Month of the year (1-12)
 * @param {number} hour - Hour of the day (0-23.99)
 * @param {number} lat - Latitude in decimal degrees
 * @param {number} lng - Longitude in decimal degrees
 * @returns {{ elevation: number, azimuth: number }} In radians
 */
export function getSunPosition(month, hour, lat, lng) {
  const rad = Math.PI / 180;
  
  // Approximate day of year based on month (middle of the month)
  const dayOfYear = Math.floor((month - 1) * 30.4) + 15;
  
  // 1. Calculate Fractional Year (gamma)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hour - 12) / 24);
  
  // 2. Estimate Equation of Time (in minutes)
  const eqTime = 229.18 * (
    0.000075 + 
    0.001868 * Math.cos(gamma) - 
    0.032077 * Math.sin(gamma) - 
    0.014615 * Math.cos(2 * gamma) - 
    0.040849 * Math.sin(2 * gamma)
  );
  
  // 3. Estimate Solar Declination (in radians)
  const declination = 0.006918 - 
    0.399912 * Math.cos(gamma) + 
    0.070257 * Math.sin(gamma) - 
    0.006758 * Math.cos(2 * gamma) + 
    0.000907 * Math.sin(2 * gamma) - 
    0.002697 * Math.cos(3 * gamma) + 
    0.00148 * Math.sin(3 * gamma);
    
  // 4. Calculate True Solar Time (in minutes)
  // Assuming timezone roughly aligns with longitude (15 degrees per hour)
  const timeOffset = eqTime + 4 * lng - (60 * Math.round(lng / 15));
  const trueSolarTime = hour * 60 + timeOffset;
  
  // 5. Calculate Solar Hour Angle (in radians)
  const hourAngle = (trueSolarTime / 4 - 180) * rad;
  const latRad = lat * rad;
  
  // 6. Calculate Elevation (Zenith Angle)
  const sinElevation = Math.sin(latRad) * Math.sin(declination) + 
                       Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);
  const elevation = Math.asin(sinElevation);
  
  // 7. Calculate Azimuth
  const cosAzimuth = (Math.sin(latRad) * sinElevation - Math.sin(declination)) / 
                     (Math.cos(latRad) * Math.cos(elevation));
                     
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))); // clamp to prevent NaN
  
  if (hourAngle > 0) {
    azimuth = 2 * Math.PI - azimuth;
  }
  
  // Offset azimuth so North is -Z in Three.js coordinates
  return {
    elevation: elevation,
    azimuth: azimuth + Math.PI // Align to ThreeJS coordinate system
  };
}

/**
 * Converts spherical Sun coordinates (elevation, azimuth) to Cartesian [X, Y, Z] for Three.js directional lights.
 */
export function getSunVector(elevation, azimuth, distance = 100) {
  // If elevation is below 0, sun is below horizon (nighttime)
  if (elevation < 0) return null;
  
  const y = distance * Math.sin(elevation);
  const horizontalDist = distance * Math.cos(elevation);
  
  const x = horizontalDist * Math.sin(azimuth);
  const z = horizontalDist * Math.cos(azimuth);
  
  return [x, y, z];
}

/**
 * Calculates approximate sunrise / sunset local clock hours for a given
 * month, latitude and longitude, using the same solar-position model as
 * getSunPosition() so the two stay perfectly consistent with each other.
 *
 * @param {number} month - Month of the year (1-12)
 * @param {number} lat - Latitude in decimal degrees
 * @param {number} lng - Longitude in decimal degrees
 * @returns {{ sunrise: number|null, sunset: number|null, daylightHours: number, polar: 'day'|'night'|null }}
 */
export function getSunriseSunset(month, lat, lng) {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((month - 1) * 30.4) + 15;

  // Use day-of-year (mid-day) to derive declination / equation-of-time;
  // the intra-day variation of these terms is negligible and this keeps
  // sunrise/sunset perfectly consistent with getSunPosition().
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);

  const eqTime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  const declination = 0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = lat * rad;
  const cosH0 = -Math.tan(latRad) * Math.tan(declination);

  // Polar day / polar night guard (sun never sets / never rises)
  let polar = null;
  if (cosH0 <= -1) polar = "day";
  else if (cosH0 >= 1) polar = "night";

  const H0 = Math.acos(Math.max(-1, Math.min(1, cosH0))); // radians

  const timeOffset = eqTime + 4 * lng - (60 * Math.round(lng / 15));
  const hourAngleToHour = (hourAngleRad) => {
    const trueSolarTime = (hourAngleRad / rad + 180) * 4;
    return (trueSolarTime - timeOffset) / 60;
  };

  const sunrise = polar === "night" ? null : hourAngleToHour(-H0);
  const sunset = polar === "night" ? null : hourAngleToHour(H0);
  const daylightHours = polar === "day" ? 24 : polar === "night" ? 0 : Math.max(0, sunset - sunrise);

  return { sunrise, sunset, daylightHours, polar };
}

/**
 * Samples the sun's path (elevation/azimuth per hour) across a single day
 * for a given month/lat/lng. Used to draw the draggable sun-arc UI and to
 * keep the visual path perfectly in sync with the shadow-casting light.
 *
 * @returns {Array<{hour:number, elevation:number, azimuth:number}>}
 */
export function getSunPathPoints(month, lat, lng, steps = 96) {
  const { sunrise, sunset, polar } = getSunriseSunset(month, lat, lng);

  let start = 5, end = 19; // sensible fallback window
  if (polar === "day") { start = 0; end = 24; }
  else if (polar === "night") { return []; }
  else if (sunrise != null && sunset != null) {
    start = Math.max(0, sunrise - 0.4);
    end = Math.min(24, sunset + 0.4);
  }

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const hour = start + (end - start) * (i / steps);
    const pos = getSunPosition(month, hour, lat, lng);
    points.push({ hour, elevation: pos.elevation, azimuth: pos.azimuth });
  }
  return points;
}