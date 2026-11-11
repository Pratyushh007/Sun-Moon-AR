import geomagnetism from './vendor/geomagnetism.js';

export function getDeclination(lat, lon, date = new Date(), manualDeg = null) {
  if (typeof manualDeg === 'number' && Number.isFinite(manualDeg)) {
    return { deg: manualDeg, source: 'manual' };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { deg: 0, source: 'default' };
  }
  try {
    const info = geomagnetism
      .model(date, { allowOutOfBoundsModel: true })
      .point([lat, lon, 0]);
    if (Number.isFinite(info?.decl)) {
      return { deg: info.decl, source: 'wmm' };
    }
  } catch (err) {
    console.warn('WMM declination lookup failed, falling back to 0°:', err);
  }
  return { deg: 0, source: 'fallback' };
}

