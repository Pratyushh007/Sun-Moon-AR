import { angles, mat3, vec3 } from './mathx.js';

export function cameraBasis(R) {
  return {
    r: mat3.col(R, 0),
    u: mat3.col(R, 1),
    f: vec3.scale(mat3.col(R, 2), -1),
  };
}

export function cameraHeadingPitch(basis) {
  const f = basis.f;
  const horiz = Math.hypot(f.x, f.y);
  const headingCam = horiz > 0.1 ? angles.wrap360(angles.deg(Math.atan2(f.x, f.y))) : null;
  const pitchCam = angles.deg(Math.asin(angles.clamp(f.z, -1, 1)));
  return { headingCam, pitchCam, headingValid: horiz > 0.1 };
}

export function focalPx(fovLongDeg, videoW, videoH, W, H, zoom = 1) {
  const vw = videoW > 0 ? videoW : W;
  const vh = videoH > 0 ? videoH : H;
  const s = Math.max(W / vw, H / vh);
  const Lv = Math.max(vw, vh);
  const fVid = (Lv / 2) / Math.tan(angles.rad(fovLongDeg) / 2);
  return fVid * s * zoom;
}

export function project(t, basis, W, H, fPx) {
  const cx = W / 2;
  const cy = H / 2;
  const xc = vec3.dot(t, basis.r);
  const yc = vec3.dot(t, basis.u);
  const zc = vec3.dot(t, basis.f);

  if (zc <= 0) {
    return { onScreen: false, x: null, y: null, zc, xc, yc };
  }

  const x = cx + fPx * (xc / zc);
  const y = cy - fPx * (yc / zc);
  const onScreen = x >= 0 && x <= W && y >= 0 && y <= H;

  return { onScreen, x, y, zc, xc, yc };
}

export function approxFovDeg(W, H, fPx) {
  return {
    hFov: angles.deg(2 * Math.atan(W / (2 * fPx))),
    vFov: angles.deg(2 * Math.atan(H / (2 * fPx))),
  };
}

export function guidance(t, basis, W, H, fPx, headingCam, pitchCam, opts = {}) {
  const inset = opts.arrowInset ?? 40;
  const lockedDeg = opts.lockedDeg ?? 3;

  const xc = vec3.dot(t, basis.r);
  const yc = vec3.dot(t, basis.u);
  const zc = vec3.dot(t, basis.f);
  const angleTotal = angles.deg(Math.acos(angles.clamp(zc, -1, 1)));

  const nearOpposite = zc <= 0 && Math.hypot(xc, yc) < 1e-3;
  const thetaArrow = nearOpposite ? 0 : Math.atan2(yc, xc);
  const dx = Math.cos(thetaArrow);
  const dy = -Math.sin(thetaArrow);

  const halfW = Math.max(1, W / 2 - inset);
  const halfH = Math.max(1, H / 2 - inset);
  const kx = Math.abs(dx) > 1e-9 ? halfW / Math.abs(dx) : Infinity;
  const ky = Math.abs(dy) > 1e-9 ? halfH / Math.abs(dy) : Infinity;
  const k = Math.min(kx, ky);

  const arrowPos = {
    x: W / 2 + dx * k,
    y: H / 2 + dy * k,
  };
  const arrowAngle = Math.atan2(dy, dx);

  if (headingCam == null || pitchCam == null) {
    const hp = cameraHeadingPitch(basis);
    if (headingCam == null) headingCam = hp.headingCam;
    if (pitchCam == null) pitchCam = hp.pitchCam;
  }

  const { azDeg: azTarget, altDeg: altTarget } = vec3.toAzAlt(t);
  const dAlt = altTarget - pitchCam;

  let text;
  const locked = angleTotal < lockedDeg;
  if (locked) {
    text = 'Locked on';
  } else if (nearOpposite) {
    text = 'Turn around';
  } else if (Math.abs(pitchCam) > 84 || headingCam === null) {
    text = 'Tilt ' + (dAlt >= 0 ? 'up ' : 'down ') + Math.round(Math.abs(dAlt)) + '°';
  } else {
    const dAz = angles.wrap180(azTarget - headingCam);
    text =
      'Turn ' +
      (dAz >= 0 ? 'right ' : 'left ') +
      Math.round(Math.abs(dAz)) +
      '°, tilt ' +
      (dAlt >= 0 ? 'up ' : 'down ') +
      Math.round(Math.abs(dAlt)) +
      '°';
  }

  return {
    arrowPos,
    arrowAngle,
    text,
    angleTotal,
    locked,
  };
}

