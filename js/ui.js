import { formatTimeHHMM } from './overlay.js';

export const CITIES = [
  { name: 'Lucknow, IN',        lat: 26.8467,  lon:  80.9462 },
  { name: 'New Delhi, IN',      lat: 28.6139,  lon:  77.2090 },
  { name: 'Mumbai, IN',         lat: 19.0760,  lon:  72.8777 },
  { name: 'Bengaluru, IN',      lat: 12.9716,  lon:  77.5946 },
  { name: 'London, UK',         lat: 51.5072,  lon:  -0.1276 },
  { name: 'New York, US',       lat: 40.7128,  lon: -74.0060 },
  { name: 'San Francisco, US',  lat: 37.7749,  lon:-122.4194 },
  { name: 'Tokyo, JP',          lat: 35.6762,  lon: 139.6503 },
  { name: 'Sydney, AU',         lat:-33.8688,  lon: 151.2093 },
  { name: 'Singapore, SG',      lat:  1.3521,  lon: 103.8198 },
  { name: 'Equator (0°, 0°)',   lat:  0,       lon:   0      },
];

const FIGURE8_DURATION_S = 10;

export function formatOffsetMinutes(min) {
  if (min === 0) return 'Now';
  const sign = min > 0 ? '+' : '-';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

export class UIController {
  constructor(handlers) {
    this.handlers = handlers;

    this.el = {
      // Landing
      landing:               document.getElementById('landing'),
      startBtn:              document.getElementById('start-btn'),
      errorBox:              document.getElementById('permission-error'),
      errorMsg:              document.getElementById('permission-error-msg'),
      retryBtn:              document.getElementById('retry-btn'),

      // HUD
      hud:                   document.getElementById('hud'),
      appTitle:              document.getElementById('app-title'),
      timeReadout:           document.getElementById('time-readout'),
      locReadout:            document.getElementById('loc-readout'),
      compassIndicator:      document.getElementById('compass-indicator'),
      settingsBtn:           document.getElementById('settings-btn'),

      // Figure-8 banner + timer
      figure8Banner:         document.getElementById('figure8-banner'),
      figure8Timer:          document.getElementById('figure8-timer'),
      figure8Close:          document.getElementById('figure8-close'),

      // Warning chip
      warningChip:           document.getElementById('warning-chip'),
      warningText:           document.getElementById('warning-text'),

      // Mode pill
      modeButtons:           document.querySelectorAll('[data-mode]'),

      // Footer
      targetReadout:         document.getElementById('target-readout'),
      eventsReadout:         document.getElementById('events-readout'),

      // Manual sensor bar
      manualSensorBar:       document.getElementById('manual-sensor-bar'),
      manualHeadingSlider:   document.getElementById('manual-heading'),
      manualPitchSlider:     document.getElementById('manual-pitch'),
      manualHeadingVal:      document.getElementById('manual-heading-val'),
      manualPitchVal:        document.getElementById('manual-pitch-val'),

      // Debug panel
      debugPanel:            document.getElementById('debug-panel'),

      // Settings modal
      settingsModal:         document.getElementById('settings-modal'),
      settingsClose:         document.getElementById('settings-close'),
      timeSlider:            document.getElementById('time-slider'),
      timeOffsetLabel:       document.getElementById('time-offset-label'),
      timeResetBtn:          document.getElementById('time-reset-btn'),
      fovSlider:             document.getElementById('fov-slider'),
      fovVal:                document.getElementById('fov-val'),
      fovApprox:             document.getElementById('fov-approx'),
      zoomSlider:            document.getElementById('zoom-slider'),
      zoomVal:               document.getElementById('zoom-val'),
      pathToggle:            document.getElementById('path-toggle'),
      trueRingToggle:        document.getElementById('true-ring-toggle'),
      declinationInput:      document.getElementById('declination-input'),
      declinationClear:      document.getElementById('declination-clear'),
      declinationInfo:       document.getElementById('declination-info'),
      citySelect:            document.getElementById('city-select'),
      manualLat:             document.getElementById('manual-lat'),
      manualLon:             document.getElementById('manual-lon'),
      applyLocBtn:           document.getElementById('apply-loc-btn'),
      useGpsBtn:             document.getElementById('use-gps-btn'),
    };

    this._lastFooterUpdate = 0;
    this._figure8Interval = null;

    this._bindEvents();
    this._populateCities();
  }

  _populateCities() {
    const sel = this.el.citySelect;
    sel.innerHTML = '<option value="">— Choose a city —</option>';
    for (let i = 0; i < CITIES.length; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = CITIES[i].name;
      sel.appendChild(opt);
    }
  }

  _bindEvents() {
    // Landing
    this.el.startBtn.addEventListener('click', () => this.handlers.onStart());
    this.el.retryBtn.addEventListener('click', () => this.handlers.onStart());

    // Mode pill
    this.el.modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setActiveMode(mode);
        this._lastFooterUpdate = 0;
        this.handlers.onModeChange(mode);
      });
    });

    // Figure-8 dismiss
    this.el.figure8Close.addEventListener('click', () => this._hideFigure8Banner());

    // Settings sheet
    this.el.settingsBtn.addEventListener('click', () => this.toggleSettings(true));
    this.el.settingsClose.addEventListener('click', () => this.toggleSettings(false));
    this.el.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.el.settingsModal) this.toggleSettings(false);
    });

    // Time slider
    this.el.timeSlider.addEventListener('input', (e) => {
      const min = Number(e.target.value);
      this.el.timeOffsetLabel.textContent = formatOffsetMinutes(min);
      this.handlers.onTimeOffsetChange(min);
    });
    this.el.timeResetBtn.addEventListener('click', () => {
      this.el.timeSlider.value = '0';
      this.el.timeOffsetLabel.textContent = 'Now';
      this.handlers.onTimeOffsetChange(0);
    });

    // FOV
    this.el.fovSlider.addEventListener('input', (e) => {
      const fov = Number(e.target.value);
      this.el.fovVal.textContent = `${fov}°`;
      this.handlers.onFovChange(fov);
    });

    // Zoom
    this.el.zoomSlider.addEventListener('input', (e) => {
      const z = Number(e.target.value);
      this.el.zoomVal.textContent = `${z.toFixed(1)}x`;
      this.handlers.onZoomChange(z);
    });

    // Toggles
    this.el.pathToggle.addEventListener('change', (e) =>
      this.handlers.onPathToggle(e.target.checked)
    );
    this.el.trueRingToggle.addEventListener('change', (e) =>
      this.handlers.onTrueRingToggle(e.target.checked)
    );

    // Declination
    this.el.declinationInput.addEventListener('change', (e) => {
      const val = e.target.value.trim();
      this.handlers.onManualDeclination(val === '' ? null : Number(val));
    });
    this.el.declinationClear.addEventListener('click', () => {
      this.el.declinationInput.value = '';
      this.handlers.onManualDeclination(null);
    });

    // City preset
    this.el.citySelect.addEventListener('change', (e) => {
      if (e.target.value === '') return;
      const city = CITIES[Number(e.target.value)];
      if (city) {
        this.el.manualLat.value = city.lat.toFixed(4);
        this.el.manualLon.value = city.lon.toFixed(4);
        this.handlers.onManualLocation(city.lat, city.lon, city.name);
      }
    });

    // Manual coords
    this.el.applyLocBtn.addEventListener('click', () => {
      const lat = Number(this.el.manualLat.value);
      const lon = Number(this.el.manualLon.value);
      if (
        Number.isFinite(lat) && Number.isFinite(lon) &&
        lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
      ) {
        this.handlers.onManualLocation(lat, lon, 'Manual');
      }
    });
    this.el.useGpsBtn.addEventListener('click', () => this.handlers.onUseGps());

    // Manual heading/pitch sliders
    this.el.manualHeadingSlider.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      this.el.manualHeadingVal.textContent = `${v}°`;
      this.handlers.onManualOrientation(v, Number(this.el.manualPitchSlider.value));
    });
    this.el.manualPitchSlider.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      this.el.manualPitchVal.textContent = `${v}°`;
      this.handlers.onManualOrientation(Number(this.el.manualHeadingSlider.value), v);
    });

    // Long-press on title → toggle debug panel
    let pressTimer = null;
    const startPress = () => {
      pressTimer = setTimeout(() => {
        this.el.debugPanel.hidden = !this.el.debugPanel.hidden;
      }, 650);
    };
    const cancelPress = () => {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    };
    this.el.appTitle.addEventListener('pointerdown', startPress);
    this.el.appTitle.addEventListener('pointerup',   cancelPress);
    this.el.appTitle.addEventListener('pointercancel', cancelPress);
    this.el.appTitle.addEventListener('pointerleave',  cancelPress);
  }

  _hideFigure8Banner() {
    if (this._figure8Interval !== null) {
      clearInterval(this._figure8Interval);
      this._figure8Interval = null;
    }
    this.el.figure8Banner.hidden = true;
  }

  _startFigure8Countdown() {
    this._hideFigure8Banner();
    let remaining = FIGURE8_DURATION_S;
    this.el.figure8Timer.textContent = `${remaining}s`;
    this.el.figure8Banner.hidden = false;

    this._figure8Interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        this._hideFigure8Banner();
        return;
      }
      this.el.figure8Timer.textContent = `${remaining}s`;
    }, 1000);
  }

  // ── Public API ────────────────────────────────────────

  showPermissionError(msg) {
    this.el.errorMsg.textContent = msg;
    this.el.errorBox.hidden = false;
  }
  hidePermissionError() {
    this.el.errorBox.hidden = true;
  }

  enterMainView() {
    this.el.landing.hidden = true;
    this.el.hud.hidden = false;
    this._startFigure8Countdown();
  }

  setActiveMode(mode) {
    this.el.modeButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });
  }

  toggleSettings(show) {
    this.el.settingsModal.hidden = !show;
  }

  setManualSensorMode(enabled, heading, pitch) {
    this.el.manualSensorBar.hidden = !enabled;
    if (enabled) {
      this.el.manualHeadingSlider.value = String(heading);
      this.el.manualPitchSlider.value   = String(pitch);
      this.el.manualHeadingVal.textContent = `${Math.round(heading)}°`;
      this.el.manualPitchVal.textContent   = `${Math.round(pitch)}°`;
    }
  }

  setWarning(msg) {
    if (msg) {
      this.el.warningText.textContent = msg;
      this.el.warningChip.hidden = false;
    } else {
      this.el.warningChip.hidden = true;
    }
  }

  updateTopHud(date, location) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    this.el.timeReadout.textContent = `${hh}:${mm}:${ss}`;
    if (location && Number.isFinite(location.lat) && Number.isFinite(location.lon)) {
      const label = location.label ? `${location.label} ` : '';
      this.el.locReadout.textContent =
        `${label}(${location.lat.toFixed(2)}°, ${location.lon.toFixed(2)}°)`;
    } else {
      this.el.locReadout.textContent = 'Locating…';
    }
  }

  updateCompassIndicator(jitterDeg, manualMode) {
    if (manualMode) {
      this.el.compassIndicator.textContent = 'Manual';
      this.el.compassIndicator.className = 'pill warn';
      return;
    }
    if (jitterDeg > 8) {
      this.el.compassIndicator.textContent = `Jitter ${jitterDeg.toFixed(1)}°`;
      this.el.compassIndicator.className = 'pill warn';
    } else {
      this.el.compassIndicator.textContent = 'Compass OK';
      this.el.compassIndicator.className = 'pill ok';
    }
  }

  updateFooter(mode, targets, events, nowMs) {
    if (nowMs - this._lastFooterUpdate < 200) return;
    this._lastFooterUpdate = nowMs;

    const altParts = [];
    if (mode === 'sun' || mode === 'both') {
      altParts.push(`☀ Alt ${targets.sun.altApparent.toFixed(1)}°`);
    }
    if (mode === 'moon' || mode === 'both') {
      altParts.push(`☾ Alt ${targets.moon.alt.toFixed(1)}°`);
    }
    this.el.targetReadout.textContent = altParts.join('  •  ');

    if (events) {
      const eventParts = [];
      if (mode === 'sun' || mode === 'both') {
        const sr = formatTimeHHMM(events.sunrise) || '—';
        const ss = formatTimeHHMM(events.sunset)  || '—';
        eventParts.push(`☀ Rise ${sr} / Set ${ss}`);
      }
      if (mode === 'moon' || mode === 'both') {
        const mr = events.moonAlwaysUp   ? 'Up' :
                   events.moonAlwaysDown ? 'Down' :
                   formatTimeHHMM(events.moonrise) || '—';
        const ms = events.moonAlwaysUp   ? 'Up' :
                   events.moonAlwaysDown ? 'Down' :
                   formatTimeHHMM(events.moonset)  || '—';
        eventParts.push(`☾ Rise ${mr} / Set ${ms}`);
      }
      this.el.eventsReadout.textContent = eventParts.join('  •  ');
    }
  }

  updateSettingsReadout({ fov, hFov, vFov, decl }) {
    this.el.fovSlider.value = String(fov);
    this.el.fovVal.textContent = `${fov}°`;
    if (hFov && vFov) {
      this.el.fovApprox.textContent =
        `Visible FOV ≈ ${hFov.toFixed(1)}° × ${vFov.toFixed(1)}°`;
    }
    if (decl) {
      this.el.declinationInfo.textContent =
        `Active: ${decl.deg.toFixed(2)}° (${decl.source})`;
    }
  }

  updateDebugPanel(raw, hp, targets, fPx) {
    if (this.el.debugPanel.hidden) return;
    const fmt = (v) => (typeof v === 'number' ? v.toFixed(2) : '—');
    const tSun = targets.sun.vec;
    this.el.debugPanel.textContent =
      `src: ${raw.source} | scr: ${raw.screenAngle}° | fPx: ${fPx.toFixed(1)}\n` +
      `raw a/b/g: ${fmt(raw.alpha)} / ${fmt(raw.beta)} / ${fmt(raw.gamma)}\n` +
      `webkitH: ${fmt(raw.webkitCompassHeading)} | abs: ${raw.absolute}\n` +
      `cam H/P: ${fmt(hp.headingCam)}° / ${fmt(hp.pitchCam)}°\n` +
      `sun t(ENU): (${tSun.x.toFixed(3)}, ${tSun.y.toFixed(3)}, ${tSun.z.toFixed(3)})`;
  }
}
