import { angles, vec3 } from './mathx.js';

const STORAGE_KEY = 'sunmoon_ar_calibration_v1';
const FOV_STORAGE_KEY = 'sunmoon_ar_fov_v1';

export const STALE_AGE_MS = 15 * 60 * 1000;
export const STALE_DISTANCE_KM = 1.0;

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = angles.rad(lat2 - lat1);
  const dLon = angles.rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(angles.rad(lat1)) *
      Math.cos(angles.rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeTapObservation(tapPx, tapPy, basis, fPx, W, H) {
  const cx = W / 2;
  const cy = H / 2;
  const cx_ = (tapPx - cx) / fPx;
  const cy_ = -(tapPy - cy) / fPx;
  const c = vec3.normalize({ x: cx_, y: cy_, z: 1 });

  const w = vec3.normalize(
    vec3.add(
      vec3.add(vec3.scale(basis.r, c.x), vec3.scale(basis.u, c.y)),
      vec3.scale(basis.f, c.z)
    )
  );

  const { azDeg: azObs, altDeg: altObs } = vec3.toAzAlt(w);
  return { w, azObs, altObs };
}

export function computeYawCorrection(tapPx, tapPy, basis, fPx, W, H, azPredSensor) {
  const { azObs } = computeTapObservation(tapPx, tapPy, basis, fPx, W, H);
  return angles.wrap180(azPredSensor - azObs);
}

export function save(psi, lat, lon, timestamp = Date.now()) {
  const data = { psi, lat, lon, timestamp };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore storage errors
  }
  return data;
}

export function load() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.psi !== 'number' || !Number.isFinite(data.psi)) return null;
    return data;
  } catch {
    return null;
  }
}

export function reset() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function isStale(record = load(), currentLat = null, currentLon = null, nowMs = Date.now()) {
  if (!record || typeof record.timestamp !== 'number') return false;
  if (nowMs - record.timestamp > STALE_AGE_MS) return true;
  if (
    Number.isFinite(currentLat) &&
    Number.isFinite(currentLon) &&
    Number.isFinite(record.lat) &&
    Number.isFinite(record.lon)
  ) {
    if (haversineKm(record.lat, record.lon, currentLat, currentLon) > STALE_DISTANCE_KM) {
      return true;
    }
  }
  return false;
}

export function saveFov(fovLongDeg) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FOV_STORAGE_KEY, String(fovLongDeg));
    }
  } catch {
    // ignore
  }
}

export function loadFov(defaultFov) {
  try {
    if (typeof localStorage === 'undefined') return defaultFov;
    const raw = localStorage.getItem(FOV_STORAGE_KEY);
    if (raw === null) return defaultFov;
    const val = Number(raw);
    return Number.isFinite(val) ? angles.clamp(val, 40, 90) : defaultFov;
  } catch {
    return defaultFov;
  }
}

