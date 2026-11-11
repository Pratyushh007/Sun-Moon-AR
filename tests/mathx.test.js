import assert from 'node:assert/strict';
import { angles, mat3, quat, vec3 } from '../js/mathx.js';
import {
  cameraBasis,
  cameraHeadingPitch,
  guidance,
  project,
} from '../js/projection.js';
import { getTargets, getPath, getEvents, sunCalcAzimuthToNorthDeg } from '../js/ephemeris.js';
import { computeYawCorrection } from '../js/calibration.js';
import { getDeclination } from '../js/declination.js';
import { buildManualMatrix, computeHeadingJitterDeg } from '../js/sensors.js';
import { formatTimeHHMM } from '../js/overlay.js';

function assertClose(actual, expected, tol = 1e-9, msg = '') {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${msg}: expected ${expected} (±${tol}), got ${actual}`
  );
}

function assertVecClose(a, b, tol = 1e-9, msg = '') {
  assertClose(a.x, b.x, tol, `${msg}.x`);
  assertClose(a.y, b.y, tol, `${msg}.y`);
  assertClose(a.z, b.z, tol, `${msg}.z`);
}

// Test 1: alpha=0, beta=90deg, gamma=0 -> f=(0,1,0), heading=0, pitch=0
{
  const R = mat3.fromAlphaBetaGamma(0, angles.rad(90), 0);
  const basis = cameraBasis(R);
  const hp = cameraHeadingPitch(basis);
  assertVecClose(basis.f, { x: 0, y: 1, z: 0 }, 1e-9, 'Test 1 f');
  assertClose(hp.headingCam, 0, 1e-9, 'Test 1 heading');
  assertClose(hp.pitchCam, 0, 1e-9, 'Test 1 pitch');
}

// Test 2: alpha=90deg, beta=90deg, gamma=0 -> f=(-1,0,0), heading=270
{
  const R = mat3.fromAlphaBetaGamma(angles.rad(90), angles.rad(90), 0);
  const basis = cameraBasis(R);
  const hp = cameraHeadingPitch(basis);
  assertVecClose(basis.f, { x: -1, y: 0, z: 0 }, 1e-9, 'Test 2 f');
  assertClose(hp.headingCam, 270, 1e-9, 'Test 2 heading');
}

// Test 3: beta=0, gamma=0 -> f=(0,0,-1), pitch=-90
{
  const R = mat3.fromAlphaBetaGamma(angles.rad(42), 0, 0);
  const basis = cameraBasis(R);
  const hp = cameraHeadingPitch(basis);
  assertVecClose(basis.f, { x: 0, y: 0, z: -1 }, 1e-9, 'Test 3 f');
  assertClose(hp.pitchCam, -90, 1e-9, 'Test 3 pitch');
}

// Test 4: Target az=90, alt=0 -> t=(1,0,0); with Test 1 camera, d_az=+90, 'Turn right 90°'
{
  const t = vec3.fromAzAlt(angles.rad(90), 0);
  assertVecClose(t, { x: 1, y: 0, z: 0 }, 1e-9, 'Test 4 t');
  const R = mat3.fromAlphaBetaGamma(0, angles.rad(90), 0);
  const basis = cameraBasis(R);
  const hp = cameraHeadingPitch(basis);
  const g = guidance(t, basis, 400, 800, 800, hp.headingCam, hp.pitchCam);
  assert.ok(
    g.text.startsWith('Turn right 90°'),
    `Test 4 expected 'Turn right 90°...', got '${g.text}'`
  );
}

// Test 5: Target exactly on f -> x_px=cx, y_px=cy, angle_total=0
{
  const R = mat3.fromAlphaBetaGamma(angles.rad(25), angles.rad(75), angles.rad(-10));
  const basis = cameraBasis(R);
  const hp = cameraHeadingPitch(basis);
  const W = 400, H = 800, fPx = 800;
  const p = project(basis.f, basis, W, H, fPx);
  const g = guidance(basis.f, basis, W, H, fPx, hp.headingCam, hp.pitchCam);
  assertClose(p.x, W / 2, 1e-9, 'Test 5 x');
  assertClose(p.y, H / 2, 1e-9, 'Test 5 y');
  assert.equal(p.onScreen, true);
  assertClose(g.angleTotal, 0, 1e-6, 'Test 5 angleTotal');
  assert.equal(g.locked, true);
}

// Test 6: Target 10 degrees right of f at fPx=800 -> x_px - cx = 800 * tan(10deg) ~ 141 px
{
  const R = mat3.fromAlphaBetaGamma(0, angles.rad(90), 0);
  const basis = cameraBasis(R);
  const t = vec3.fromAzAlt(angles.rad(10), 0);
  const W = 400, H = 800, fPx = 800;
  const p = project(t, basis, W, H, fPx);
  const expectedDx = 800 * Math.tan(angles.rad(10));
  assertClose(p.x - W / 2, expectedDx, 1e-9, 'Test 6 dx');
  assertClose(p.x - W / 2, 141.06158, 0.01, 'Test 6 ~141px');
}

// Test 7: Ephemeris sanity at March equinox on equator
{
  // Solar noon at lat=0, lon=0 on March 20, 2026 (~12:07:30 UTC)
  const noon = new Date('2026-03-20T12:07:30Z');
  const midnight = new Date('2026-03-21T00:07:30Z');
  const resNoon = getTargets(noon, 0, 0, 0);
  const resMidnight = getTargets(midnight, 0, 0, 0);
  assert.ok(
    resNoon.sun.alt > 88.5,
    `Test 7 solar noon equator alt expected near 90, got ${resNoon.sun.alt}`
  );
  assert.ok(
    resMidnight.sun.alt < -88.5,
    `Test 7 midnight equator alt expected near -90, got ${resMidnight.sun.alt}`
  );
}

// Test 8: Azimuth conversion: SunCalc azimuth 0 (due south) -> Az_north = 180
{
  assertClose(sunCalcAzimuthToNorthDeg(0), 180, 1e-9, 'Test 8 south->180');
}

// Test 9: wrap180 maps 190 to -170 and -190 to 170
{
  assertClose(angles.wrap180(190), -170, 1e-9, 'Test 9 190->-170');
  assertClose(angles.wrap180(-190), 170, 1e-9, 'Test 9 -190->170');
}

// Test 10: Round trip vector -> (Az, Alt) -> vector within 1e-9
{
  const original = vec3.normalize({ x: 0.42, y: -0.71, z: 0.56 });
  const { azDeg, altDeg } = vec3.toAzAlt(original);
  const rebuilt = vec3.fromAzAlt(angles.rad(azDeg), angles.rad(altDeg));
  assertVecClose(rebuilt, original, 1e-9, 'Test 10 round-trip');
}

// Extra sanity: quat round-trip and tap-to-calibrate yaw correction
{
  const R = mat3.fromAlphaBetaGamma(angles.rad(35), angles.rad(68), angles.rad(-14));
  const q = quat.fromMat3(R);
  const R2 = mat3.fromQuaternion(q);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      assertClose(R2[i][j], R[i][j], 1e-9, `quat round-trip [${i}][${j}]`);
    }
  }

  const basis = cameraBasis(mat3.fromAlphaBetaGamma(0, angles.rad(90), 0));
  // User taps center (pointing North, azObs=0) when Sun is predicted at Az=15 -> psi = +15
  const psi = computeYawCorrection(200, 400, basis, 800, 400, 800, 15);
  assertClose(psi, 15, 1e-9, 'calibration psi');

  // WMM magnetic declination (Lucknow, IN is small ~1 deg; London is ~0-2 deg)
  const declLucknow = getDeclination(26.8467, 80.9462, new Date('2026-11-11T00:00:00Z'));
  assert.equal(declLucknow.source, 'wmm');
  assert.ok(Math.abs(declLucknow.deg) < 5, `Lucknow declination expected small, got ${declLucknow.deg}`);

  const declManual = getDeclination(26.8467, 80.9462, new Date(), -12.5);
  assert.equal(declManual.source, 'manual');
  assertClose(declManual.deg, -12.5, 1e-9, 'manual declination');

  // Manual matrix matches heading/pitch
  const Rman = buildManualMatrix(135, 30);
  const hpMan = cameraHeadingPitch(cameraBasis(Rman));
  assertClose(hpMan.headingCam, 135, 1e-9, 'manual heading');
  assertClose(hpMan.pitchCam, 30, 1e-9, 'manual pitch');

  // Jitter std-dev calculation across 0/360 wraparound
  const jitter = computeHeadingJitterDeg([
    { heading: 359 },
    { heading: 1 },
    { heading: 0 },
  ]);
  assert.ok(jitter < 1.5, `Wrapped jitter expected small, got ${jitter}`);

  // Path sampling & events
  const path = getPath('sun', new Date('2026-06-21T12:00:00Z'), 26.8467, 80.9462, 0, 10, 12);
  assert.equal(path.length, 145);
  const events = getEvents(new Date('2026-06-21T12:00:00Z'), 26.8467, 80.9462);
  assert.ok(events.sunrise instanceof Date);
  assert.ok(formatTimeHHMM(events.sunrise).includes(':'));
}

console.log('All mathx, projection, ephemeris, declination, sensors, overlay, and calibration tests passed.');
