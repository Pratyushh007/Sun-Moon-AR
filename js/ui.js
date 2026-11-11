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

      // Warning chip
      warningChip:           document.getElementById('warning-chip'),
      warningText:           document.getElementById('warning-text'),

      // Calibrate banner
      calibrateBanner:       document.getElementById('calibrate-banner'),
      calibrateTargetSelect: document.getElementById('calibrate-target-select'),
      calibrateCancel:       document.getElementById('calibrate-cancel'),

      // Mode pill
      modeButtons:           document.querySelectorAll('[data-mode]'),

      // Bottom panel
      guidanceText:          document.getElementById('guidance-text'),
      drawerToggle:          document.getElementById('drawer-toggle'),
      drawerContent:         document.getElementById('drawer-content'),
      targetReadout:         document.getElementById('target-readout'),
      eventsReadout:         document.getElementById('events-readout'),
      timeSlider:            document.getElementById('time-slider'),
      timeOffsetLabel:       document.getElementById('time-offset-label'),
      timeResetBtn:          document.getElementById('time-reset-btn'),

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
      settingsCalibrateBtn:  document.getElementById('settings-calibrate-btn'),
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
      calStatus:             document.getElementById('cal-status'),
      calResetBtn:           document.getElementById('cal-reset-btn'),
      citySelect:            document.getElementById('city-select'),
      manualLat:             document.getElementById('manual-lat'),
      manualLon:             document.getElementById('manual-lon'),
      applyLocBtn:           document.getElementById('apply-loc-btn'),
      useGpsBtn:             document.getElementById('use-gps-btn'),
    };

    this._lastGuidanceUpdate = 0;
    this._lastGuidanceValues = { sun: '', moon: '' };
    this._drawerOpen = false;

    this._bindEvents();
    this._populateCities();
  }

  // ── City list ─────────────────────────────────────────
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

  // ── Event bindings ────────────────────────────────────
  _bindEvents() {
    // Landing
    this.el.startBtn.addEventListener('click', () => this.handlers.onStart());
    this.el.retryBtn.addEventListener('click', () => this.handlers.onStart());

    // Mode pill
    this.el.modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setActiveMode(mode);
        this.handlers.onModeChange(mode);
      });
    });

    // Calibrate (banner cancel)
    this.el.calibrateCancel.addEventListener('click', () =>
      this.handlers.onToggleCalibrate(false)
    );
    this.el.calibrateTargetSelect.addEventListener('change', (e) =>
      this.handlers.onCalibrateTargetChange(e.target.value)
    );

    // Calibrate button in settings sheet
    this.el.settingsCalibrateBtn.addEventListener('click', () => {
      this.toggleSettings(false);
      this.handlers.onToggleCalibrate();
    });

    // Settings sheet
    this.el.settingsBtn.addEventListener('click', () => this.toggleSettings(true));
    this.el.settingsClose.addEventListener('click', () => this.toggleSettings(false));
    this.el.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.el.settingsModal) this.toggleSettings(false);
    });

    // Drawer toggle
    this.el.drawerToggle.addEventListener('click', () => {
      this._drawerOpen = !this._drawerOpen;
      this.el.drawerContent.classList.toggle('open', this._drawerOpen);
      this.el.drawerToggle.classList.toggle('open', this._drawerOpen);
      this.el.drawerToggle.setAttribute('aria-expanded', String(this._drawerOpen));
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

    // Calibration reset
    this.el.calResetBtn.addEventListener('click', () =>
      this.handlers.onResetCalibration()
    );

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
  }

  setActiveMode(mode) {
    this.el.modeButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });
  }

  setCalibrateMode(active, targetKind) {
    this.el.settingsCalibrateBtn.classList.toggle('active', active);
    this.el.settingsCalibrateBtn.textContent = active ? 'Calibrating — tap the object…' : 'Start Calibration';
    this.el.calibrateBanner.hidden = !active;
    if (targetKind) this.el.calibrateTargetSelect.value = targetKind;
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
      this.el.compassIndicator.textContent = `Compass OK`;
      this.el.compassIndicator.className = 'pill ok';
    }
  }

  updateGuidanceText(mode, sunGuide, moonGuide, targets, hp, events, nowMs) {
    // Max 5 Hz update
    if (nowMs - this._lastGuidanceUpdate < 200) return;
    this._lastGuidanceUpdate = nowMs;

    const lines = [];
    if (mode === 'sun'  || mode === 'both') lines.push(`☀ ${sunGuide.text}`);
    if (mode === 'moon' || mode === 'both') lines.push(`☾ ${moonGuide.text}`);
    this.el.guidanceText.textContent = lines.join('  |  ');

    // Detailed readout (only rendered if drawer is open)
    const camH = hp.headingCam !== null ? `${hp.headingCam.toFixed(0)}°` : '—';
    const camP = `${hp.pitchCam.toFixed(0)}°`;
    const parts = [`Cam ${camH} / ${camP}`];
    if (mode === 'sun' || mode === 'both') {
      parts.push(`Sun Az ${targets.sun.azTrue.toFixed(1)}° Alt ${targets.sun.altApparent.toFixed(1)}°`);
    }
    if (mode === 'moon' || mode === 'both') {
      const pct = Math.round(targets.moon.fraction * 100);
      parts.push(`Moon Az ${targets.moon.azTrue.toFixed(1)}° Alt ${targets.moon.alt.toFixed(1)}° (${pct}%)`);
    }
    this.el.targetReadout.textContent = parts.join(' • ');

    if (events) {
      const sr = formatTimeHHMM(events.sunrise)  || '—';
      const ss = formatTimeHHMM(events.sunset)   || '—';
      const mr = events.moonAlwaysUp   ? 'Always up'   :
                 events.moonAlwaysDown ? 'Always down'  :
                 formatTimeHHMM(events.moonrise)  || '—';
      const ms = events.moonAlwaysUp   ? 'Always up'   :
                 events.moonAlwaysDown ? 'Always down'  :
                 formatTimeHHMM(events.moonset)   || '—';
      this.el.eventsReadout.textContent =
        `☀ Rise ${sr} / Set ${ss}  •  ☾ Rise ${mr} / Set ${ms}`;
    }
  }

  updateSettingsReadout({ fov, hFov, vFov, decl, calRecord, stale }) {
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
    if (calRecord) {
      const ageMin = Math.round((Date.now() - calRecord.timestamp) / 60000);
      this.el.calStatus.textContent =
        `Offset ψ = ${calRecord.psi.toFixed(1)}° (${ageMin}m ago)${stale ? ' — STALE' : ''}`;
    } else {
      this.el.calStatus.textContent = 'No calibration saved (ψ = 0°)';
    }
  }

  updateDebugPanel(raw, hp, targets, psiDeg, fPx) {
    if (this.el.debugPanel.hidden) return;
    const fmt = (v) => (typeof v === 'number' ? v.toFixed(2) : '—');
    const tSun = targets.sun.vec;
    this.el.debugPanel.textContent =
      `src: ${raw.source} | scr: ${raw.screenAngle}° | fPx: ${fPx.toFixed(1)}\n` +
      `raw a/b/g: ${fmt(raw.alpha)} / ${fmt(raw.beta)} / ${fmt(raw.gamma)}\n` +
      `webkitH: ${fmt(raw.webkitCompassHeading)} | abs: ${raw.absolute}\n` +
      `cam H/P: ${fmt(hp.headingCam)}° / ${fmt(hp.pitchCam)}° | ψ: ${psiDeg.toFixed(2)}°\n` +
      `sun t(ENU): (${tSun.x.toFixed(3)}, ${tSun.y.toFixed(3)}, ${tSun.z.toFixed(3)})`;
  }
}
