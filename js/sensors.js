import { angles, mat3, vec3 } from './mathx.js';

export const IOS_OFFSET_SIGN = 1;

export function getScreenAngleDeg() {
  if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.angle === 'number') {
    return screen.orientation.angle;
  }
  if (typeof window !== 'undefined' && typeof window.orientation === 'number') {
    return window.orientation;
  }
  return 0;
}

export function buildManualMatrix(headingDeg, pitchDeg) {
  const alpha = angles.rad(-headingDeg);
  const beta = angles.rad(90 + pitchDeg);
  return mat3.fromAlphaBetaGamma(alpha, beta, 0);
}

export function computeHeadingJitterDeg(samples) {
  if (samples.length < 3) return 0;
  const ref = samples[0].heading;
  const diffs = samples.map((s) => angles.wrap180(s.heading - ref));
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance =
    diffs.reduce((acc, d) => acc + (d - mean) * (d - mean), 0) / diffs.length;
  return Math.sqrt(variance);
}

export class SensorManager {
  constructor(options = {}) {
    this.onOrientationWarning = options.onOrientationWarning || (() => {});
    this.onNoSensorFallback = options.onNoSensorFallback || (() => {});

    this.raw = {
      source: 'none',
      alpha: null,
      beta: null,
      gamma: null,
      quat: null,
      webkitCompassHeading: null,
      absolute: false,
      screenAngle: 0,
      timestamp: 0,
    };

    this.latestR = null;
    this.hasOrientation = false;
    this.compassAvailable = true;
    this.manualMode = false;
    this.manualHeading = 180;
    this.manualPitch = 20;

    this._iosYawOffsetDeg = null;
    this._iosLastTs = 0;
    this._headingSamples = [];
    this._absSensor = null;
    this._watchId = null;
    this._fallbackTimer = null;
    this._orientationListener = null;
    this._absListener = null;
    this._stream = null;
  }

  async requestOrientationPermission() {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      let res;
      try {
        res = await DeviceOrientationEvent.requestPermission();
      } catch (err) {
        throw new Error(
          'Motion sensor permission requires HTTPS on iOS Safari. (' + err.message + ')'
        );
      }
      if (res !== 'granted') {
        throw new Error(
          'Motion & orientation permission was denied. Enable Motion & Orientation Access in Safari settings and tap Retry.'
        );
      }
    }

    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        await Promise.all([
          navigator.permissions.query({ name: 'accelerometer' }),
          navigator.permissions.query({ name: 'gyroscope' }),
          navigator.permissions.query({ name: 'magnetometer' }),
        ]);
      } catch {
        // Not all browsers expose these permission descriptors
      }
    }
  }

  async startCamera(videoEl) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API is not available in this browser (HTTPS required).');
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      this._stream = stream;
      videoEl.srcObject = stream;

      await new Promise((resolve, reject) => {
        let timer = null;
        const cleanup = () => {
          if (timer !== null) {
            clearTimeout(timer);
            timer = null;
          }
          videoEl.removeEventListener('loadedmetadata', onLoaded);
          videoEl.removeEventListener('loadeddata', onLoaded);
          videoEl.removeEventListener('error', onError);
        };
        const onLoaded = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error('Camera video failed to load.'));
        };
        if (videoEl.readyState >= 1) {
          resolve();
        } else {
          timer = setTimeout(() => {
            cleanup();
            resolve();
          }, 4000);
          videoEl.addEventListener('loadedmetadata', onLoaded);
          videoEl.addEventListener('loadeddata', onLoaded);
          videoEl.addEventListener('error', onError);
        }
      });

      await videoEl.play();
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera access was denied. Please allow camera permission and tap Retry.');
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No rear camera was found on this device.');
      }
      throw new Error('Could not start camera: ' + (err.message || err.name));
    }
  }

  getVideoZoom() {
    if (!this._stream) return 1;
    const track = this._stream.getVideoTracks()[0];
    if (!track || typeof track.getSettings !== 'function') return 1;
    const settings = track.getSettings();
    return typeof settings.zoom === 'number' && settings.zoom > 0 ? settings.zoom : 1;
  }

  startLocation(onPosition, onError) {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported by this browser. Enter coordinates or pick a city.'));
      return;
    }
    this._watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'gps',
        });
      },
      (err) => {
        let msg = 'Location unavailable.';
        if (err.code === 1) {
          msg = 'Location permission denied. You can retry or enter coordinates / choose a city.';
        } else if (err.code === 2) {
          msg = 'Location position unavailable. Enter coordinates or choose a city.';
        } else if (err.code === 3) {
          msg = 'Location lookup timed out. Enter coordinates or choose a city.';
        }
        onError(new Error(msg));
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60000,
        timeout: 12000,
      }
    );
  }

  startOrientation() {
    this.stopOrientation();
    this.hasOrientation = false;

    this._fallbackTimer = setTimeout(() => {
      if (!this.hasOrientation) {
        this.manualMode = true;
        this.onNoSensorFallback();
      }
    }, 2000);

    // Prefer AbsoluteOrientationSensor on Android Chrome
    if (typeof window !== 'undefined' && 'AbsoluteOrientationSensor' in window) {
      try {
        const sensor = new window.AbsoluteOrientationSensor({
          frequency: 60,
          referenceFrame: 'device',
        });
        sensor.addEventListener('reading', () => {
          const [x, y, z, w] = sensor.quaternion;
          const R = mat3.fromQuaternion({ x, y, z, w });
          this._recordReading(R, {
            source: 'AbsoluteOrientationSensor',
            quat: { x, y, z, w },
            alpha: null,
            beta: null,
            gamma: null,
            webkitCompassHeading: null,
            absolute: true,
          });
        });
        sensor.addEventListener('error', () => {
          this._absSensor = null;
          this._attachDeviceOrientationListeners();
        });
        sensor.start();
        this._absSensor = sensor;
        return;
      } catch {
        this._absSensor = null;
      }
    }

    this._attachDeviceOrientationListeners();
  }

  _attachDeviceOrientationListeners() {
    let absFired = false;

    this._absListener = (event) => {
      if (event.alpha == null || event.beta == null || event.gamma == null) return;
      absFired = true;
      this.compassAvailable = true;
      const R = mat3.fromAlphaBetaGamma(
        angles.rad(event.alpha),
        angles.rad(event.beta),
        angles.rad(event.gamma)
      );
      this._recordReading(R, {
        source: 'deviceorientationabsolute',
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        quat: null,
        webkitCompassHeading: null,
        absolute: true,
      });
    };

    this._orientationListener = (event) => {
      if (absFired) return;
      if (event.beta == null || event.gamma == null) return;

      const hasWebkit =
        typeof event.webkitCompassHeading === 'number' &&
        Number.isFinite(event.webkitCompassHeading);

      if (hasWebkit) {
        this.compassAvailable = true;
        const hIos = event.webkitCompassHeading;
        const alphaRaw = typeof event.alpha === 'number' ? event.alpha : 0;
        const now = performance.now();

        let R;
        if (Math.abs(event.gamma) < 15 && typeof event.alpha === 'number') {
          const sampleOffset = angles.wrap180(
            IOS_OFFSET_SIGN * (angles.wrap360(360 - hIos) - alphaRaw)
          );
          if (this._iosYawOffsetDeg === null) {
            this._iosYawOffsetDeg = sampleOffset;
          } else {
            const dt = Math.max(0.001, (now - this._iosLastTs) / 1000);
            const alphaLp = 1 - Math.exp(-dt / 1.0);
            const delta = angles.wrap180(sampleOffset - this._iosYawOffsetDeg);
            this._iosYawOffsetDeg = angles.wrap180(
              this._iosYawOffsetDeg + alphaLp * delta
            );
          }
          this._iosLastTs = now;
        }

        if (this._iosYawOffsetDeg !== null && typeof event.alpha === 'number') {
          const Rraw = mat3.fromAlphaBetaGamma(
            angles.rad(alphaRaw),
            angles.rad(event.beta),
            angles.rad(event.gamma)
          );
          R = mat3.mul(mat3.Rz(angles.rad(this._iosYawOffsetDeg)), Rraw);
        } else {
          const alphaCorr = angles.wrap360(360 - hIos);
          R = mat3.fromAlphaBetaGamma(
            angles.rad(alphaCorr),
            angles.rad(event.beta),
            angles.rad(event.gamma)
          );
        }

        this._recordReading(R, {
          source: 'iOS-webkitCompassHeading',
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
          quat: null,
          webkitCompassHeading: hIos,
          absolute: true,
        });
        return;
      }

      if (event.alpha == null) return;
      const isAbs = event.absolute === true;
      if (!isAbs && this.compassAvailable) {
        this.compassAvailable = false;
        this.onOrientationWarning('Compass not available; use Tap-to-calibrate');
      }

      const R = mat3.fromAlphaBetaGamma(
        angles.rad(event.alpha),
        angles.rad(event.beta),
        angles.rad(event.gamma)
      );
      this._recordReading(R, {
        source: isAbs ? 'deviceorientation(absolute)' : 'deviceorientation(relative)',
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        quat: null,
        webkitCompassHeading: null,
        absolute: isAbs,
      });
    };

    window.addEventListener('deviceorientationabsolute', this._absListener);
    window.addEventListener('deviceorientation', this._orientationListener);
  }

  _recordReading(R_device, meta) {
    const screenAngle = getScreenAngleDeg();
    const R_screen =
      screenAngle !== 0 ? mat3.mul(R_device, mat3.Rz(angles.rad(-screenAngle))) : R_device;

    this.latestR = R_screen;
    this.hasOrientation = true;
    this.manualMode = false;

    if (this._fallbackTimer) {
      clearTimeout(this._fallbackTimer);
      this._fallbackTimer = null;
    }

    const now = performance.now();
    this.raw = { ...meta, screenAngle, timestamp: now };

    const f = vec3.scale(mat3.col(R_screen, 2), -1);
    if (Math.hypot(f.x, f.y) > 0.1) {
      const heading = angles.wrap360(angles.deg(Math.atan2(f.x, f.y)));
      this._headingSamples.push({ t: now, heading });
      const cutoff = now - 2000;
      while (this._headingSamples.length > 0 && this._headingSamples[0].t < cutoff) {
        this._headingSamples.shift();
      }
    }
  }

  getHeadingJitterDeg() {
    const cutoff = performance.now() - 2000;
    while (this._headingSamples.length > 0 && this._headingSamples[0].t < cutoff) {
      this._headingSamples.shift();
    }
    return computeHeadingJitterDeg(this._headingSamples);
  }

  getCurrentMatrix() {
    if (this.manualMode || !this.latestR) {
      return buildManualMatrix(this.manualHeading, this.manualPitch);
    }
    return this.latestR;
  }

  stopOrientation() {
    if (this._fallbackTimer) {
      clearTimeout(this._fallbackTimer);
      this._fallbackTimer = null;
    }
    if (this._absSensor) {
      try {
        this._absSensor.stop();
      } catch {
        // ignore
      }
      this._absSensor = null;
    }
    if (this._absListener) {
      window.removeEventListener('deviceorientationabsolute', this._absListener);
      this._absListener = null;
    }
    if (this._orientationListener) {
      window.removeEventListener('deviceorientation', this._orientationListener);
      this._orientationListener = null;
    }
  }

  stopAll() {
    this.stopOrientation();
    if (this._watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this._watchId);
      this._watchId = null;
    }
    if (this._stream) {
      for (const t of this._stream.getTracks()) {
        t.stop();
      }
      this._stream = null;
    }
  }
}

