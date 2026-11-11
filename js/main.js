import { angles, mat3, quat } from './mathx.js';
import { getDeclination } from './declination.js';
import { getEvents, getPath, getTargets } from './ephemeris.js';
import {
  approxFovDeg,
  cameraBasis,
  cameraHeadingPitch,
  focalPx,
  guidance,
  project,
} from './projection.js';
import {
  haversineKm,
  loadFov,
  saveFov,
} from './calibration.js';
import {
  drawPathArc,
  drawTargetMarker,
} from './overlay.js';
import { SensorManager } from './sensors.js';
import { UIController } from './ui.js';

// Tunables (Section 12.4)
const DEFAULT_FOV_LONG = 65;
const SMOOTHING_TAU_S = 0.11;
const ARROW_INSET_PX = 40;
const ICON_RADIUS_PX = 22;
const LOCKED_THRESHOLD_DEG = 3;
const DEADZONE_DEG = 0.2;
const PATH_STEP_MIN = 10;
const PATH_SPAN_HOURS = 12;

const video = document.getElementById('camera-video');
const canvas = document.getElementById('overlay-canvas');
const ctx = canvas.getContext('2d');

const state = {
  started: false,
  mode: 'both', // 'sun' | 'moon' | 'both'
  timeOffsetMin: 0,
  fovLong: loadFov(DEFAULT_FOV_LONG),
  userZoom: 1,
  showPath: true,
  showTrueRing: false,
  manualDeclinationDeg: null,
  declination: { deg: 0, source: 'default' },
  location: { lat: 26.8467, lon: 80.9462, label: 'Default', isDefault: true },
  qSmooth: null,
  lastFrameMs: 0,
  lastEphemerisMs: 0,
  lastEphemerisLoc: null,
  targets: null,
  nowTargets: null,
  events: null,
  paths: { sun: [], moon: [] },
  stableHeading: null,
  stablePitch: null,
  latestFPx: 800,
  latestSize: { W: 1, H: 1 },
  orientationWarning: '',
};

const sensors = new SensorManager({
  onOrientationWarning(msg) {
    state.orientationWarning = msg;
    refreshWarningBanner();
  },
  onNoSensorFallback() {
    ui.setManualSensorMode(true, sensors.manualHeading, sensors.manualPitch);
    refreshWarningBanner();
  },
});

const ui = new UIController({
  async onStart() {
    ui.hidePermissionError();
    try {
      // 1. Motion / orientation permission
      await sensors.requestOrientationPermission();
      // 2. Camera
      await sensors.startCamera(video);
    } catch (err) {
      ui.showPermissionError(err.message);
      return;
    }

    // Attempt portrait lock where allowed (Section 2)
    try {
      await screen.orientation?.lock?.('portrait');
    } catch {
      // Rotation is handled via screen.orientation.angle (Section 5.4)
    }

    // 3. Location
    sensors.startLocation(
      (pos) => {
        state.location = { lat: pos.lat, lon: pos.lon, label: 'GPS', isDefault: false };
        updateEphemeris(true);
      },
      (err) => {
        state.orientationWarning = err.message;
        refreshWarningBanner();
      }
    );

    sensors.startOrientation();
    state.started = true;
    ui.enterMainView();
    ui.setActiveMode(state.mode);
    updateEphemeris(true);
    refreshWarningBanner();
    startLoop();
  },
  onModeChange(mode) {
    state.mode = mode;
  },
  onTimeOffsetChange(min) {
    state.timeOffsetMin = min;
    updateEphemeris(true);
  },
  onFovChange(fov) {
    state.fovLong = fov;
    saveFov(fov);
  },
  onZoomChange(z) {
    state.userZoom = z;
  },
  onPathToggle(enabled) {
    state.showPath = enabled;
    if (enabled) updateEphemeris(true);
  },
  onTrueRingToggle(enabled) {
    state.showTrueRing = enabled;
  },
  onManualDeclination(val) {
    state.manualDeclinationDeg = val;
    updateEphemeris(true);
  },
  onManualLocation(lat, lon, label) {
    state.location = { lat, lon, label, isDefault: false };
    updateEphemeris(true);
  },
  onUseGps() {
    sensors.startLocation(
      (pos) => {
        state.location = { lat: pos.lat, lon: pos.lon, label: 'GPS', isDefault: false };
        updateEphemeris(true);
      },
      (err) => {
        state.orientationWarning = err.message;
        refreshWarningBanner();
      }
    );
  },
  onManualOrientation(heading, pitch) {
    sensors.manualHeading = heading;
    sensors.manualPitch = pitch;
  },
});

function refreshWarningBanner() {
  const msgs = [];
  if (new Date().getFullYear() < 2024) {
    msgs.push('Device clock appears incorrect (year < 2024); positions may be inaccurate.');
  }
  if (sensors.manualMode) {
    msgs.push('No motion sensors detected — phone required for live AR. Using manual sliders.');
  }
  if (state.orientationWarning) {
    msgs.push(state.orientationWarning);
  }
  ui.setWarning(msgs.join(' '));
}

function getEffectiveDate() {
  return new Date(Date.now() + state.timeOffsetMin * 60 * 1000);
}

function updateEphemeris(force = false) {
  const nowMs = Date.now();
  const loc = state.location;
  const movedFar =
    !state.lastEphemerisLoc ||
    haversineKm(state.lastEphemerisLoc.lat, state.lastEphemerisLoc.lon, loc.lat, loc.lon) > 5;

  if (!force && !movedFar && nowMs - state.lastEphemerisMs < 1000) {
    return;
  }

  state.lastEphemerisMs = nowMs;
  state.lastEphemerisLoc = { lat: loc.lat, lon: loc.lon };

  const nowDate = new Date(nowMs);
  const effDate = getEffectiveDate();

  state.declination = getDeclination(loc.lat, loc.lon, effDate, state.manualDeclinationDeg);
  state.targets = getTargets(effDate, loc.lat, loc.lon, state.declination.deg);
  state.nowTargets =
    state.timeOffsetMin !== 0
      ? getTargets(nowDate, loc.lat, loc.lon, state.declination.deg)
      : state.targets;
  state.events = getEvents(effDate, loc.lat, loc.lon);

  if (state.showPath) {
    state.paths.sun = getPath(
      'sun',
      effDate,
      loc.lat,
      loc.lon,
      state.declination.deg,
      PATH_STEP_MIN,
      PATH_SPAN_HOURS
    );
    state.paths.moon = getPath(
      'moon',
      effDate,
      loc.lat,
      loc.lon,
      state.declination.deg,
      PATH_STEP_MIN,
      PATH_SPAN_HOURS
    );
  }

  ui.updateTopHud(effDate, loc);
  updateSettingsDisplay();
}

function updateSettingsDisplay() {
  const { W, H } = state.latestSize;
  const { hFov, vFov } = approxFovDeg(W, H, state.latestFPx);
  ui.updateSettingsReadout({
    fov: state.fovLong,
    hFov,
    vFov,
    decl: state.declination,
  });
}

let rafId = null;

function startLoop() {
  if (rafId !== null) return;
  state.lastFrameMs = performance.now();
  const tick = (nowMs) => {
    rafId = requestAnimationFrame(tick);
    if (document.hidden) return;
    renderFrame(nowMs);
  };
  rafId = requestAnimationFrame(tick);
}

function renderFrame(nowMs) {
  const dt = Math.max(0.001, Math.min(0.25, (nowMs - state.lastFrameMs) / 1000));
  state.lastFrameMs = nowMs;

  updateEphemeris(false);

  // Never draw overlay when video is not yet playing (Section 8)
  if (video.readyState < 2 || video.videoWidth <= 0 || video.paused) {
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth || window.innerWidth;
  const H = canvas.clientHeight || window.innerHeight;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  state.latestSize = { W, H };

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // Smoothing via slerp (Section 5.9)
  const R_raw = sensors.getCurrentMatrix();
  const qNew = quat.fromMat3(R_raw);
  if (!state.qSmooth || sensors.manualMode) {
    state.qSmooth = qNew;
  } else {
    const alphaS = 1 - Math.exp(-dt / SMOOTHING_TAU_S);
    state.qSmooth = quat.slerp(state.qSmooth, qNew, alphaS);
  }
  const R_smooth = mat3.fromQuaternion(state.qSmooth);
  const basis = cameraBasis(R_smooth);
  const hp = cameraHeadingPitch(basis);

  // Deadzone on heading/pitch for guidance text stability (Section 5.9)
  if (hp.headingCam !== null) {
    if (
      state.stableHeading === null ||
      Math.abs(angles.wrap180(hp.headingCam - state.stableHeading)) >= DEADZONE_DEG
    ) {
      state.stableHeading = hp.headingCam;
    }
  } else {
    state.stableHeading = null;
  }
  if (
    state.stablePitch === null ||
    Math.abs(hp.pitchCam - state.stablePitch) >= DEADZONE_DEG
  ) {
    state.stablePitch = hp.pitchCam;
  }

  const trackZoom = sensors.getVideoZoom();
  const fPx = focalPx(
    state.fovLong,
    video.videoWidth,
    video.videoHeight,
    W,
    H,
    trackZoom * state.userZoom
  );
  state.latestFPx = fPx;

  const targets = state.targets;
  const nowTargets = state.nowTargets;
  const hasTimeOffset = state.timeOffsetMin !== 0;

  if (state.showPath) {
    if (state.mode === 'sun' || state.mode === 'both') {
      drawPathArc(ctx, state.paths.sun, basis, W, H, fPx, 'rgba(255, 213, 79, 0.7)');
    }
    if (state.mode === 'moon' || state.mode === 'both') {
      drawPathArc(ctx, state.paths.moon, basis, W, H, fPx, 'rgba(144, 202, 249, 0.7)');
    }
  }

  const sunProj = project(targets.sun.vec, basis, W, H, fPx);
  const sunNowProj = hasTimeOffset ? project(nowTargets.sun.vec, basis, W, H, fPx) : null;
  const sunGuide = guidance(
    targets.sun.vec,
    basis,
    W,
    H,
    fPx,
    state.stableHeading,
    state.stablePitch,
    { arrowInset: ARROW_INSET_PX, lockedDeg: LOCKED_THRESHOLD_DEG }
  );

  const moonProj = project(targets.moon.vec, basis, W, H, fPx);
  const moonNowProj = hasTimeOffset ? project(nowTargets.moon.vec, basis, W, H, fPx) : null;
  const moonGuide = guidance(
    targets.moon.vec,
    basis,
    W,
    H,
    fPx,
    state.stableHeading,
    state.stablePitch,
    { arrowInset: ARROW_INSET_PX, lockedDeg: LOCKED_THRESHOLD_DEG }
  );

  if (state.mode === 'sun' || state.mode === 'both') {
    drawTargetMarker(ctx, {
      kind: 'sun',
      target: targets.sun,
      nowTarget: nowTargets.sun,
      proj: sunProj,
      nowProj: sunNowProj,
      guide: sunGuide,
      basis,
      fPx,
      events: state.events,
      iconRadius: ICON_RADIUS_PX,
      showTrueSizeRing: state.showTrueRing,
      hasTimeOffset,
    });
  }

  if (state.mode === 'moon' || state.mode === 'both') {
    drawTargetMarker(ctx, {
      kind: 'moon',
      target: targets.moon,
      nowTarget: nowTargets.moon,
      proj: moonProj,
      nowProj: moonNowProj,
      guide: moonGuide,
      basis,
      fPx,
      events: state.events,
      iconRadius: ICON_RADIUS_PX,
      showTrueSizeRing: state.showTrueRing,
      hasTimeOffset,
    });
  }

  ui.updateCompassIndicator(sensors.getHeadingJitterDeg(), sensors.manualMode);
  ui.updateFooter(state.mode, targets, state.events, nowMs);
  ui.updateDebugPanel(sensors.raw, hp, targets, fPx);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.started) {
    state.lastFrameMs = performance.now();
    updateEphemeris(true);
  }
});

// Register PWA service worker (M5)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Service worker requires HTTPS or localhost
    });
  });
}

