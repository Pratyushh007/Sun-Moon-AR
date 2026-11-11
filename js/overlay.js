import { angles, vec3 } from './mathx.js';
import { project } from './projection.js';

export const MOON_ROT_SIGN = 1;

export function formatTimeHHMM(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getAltitudeState(kind, altDeg, events) {
  if (altDeg >= 0) {
    return { mode: 'bright', subLabel: null };
  }
  if (altDeg >= -6) {
    return { mode: 'dim', subLabel: 'Just below horizon (civil twilight)' };
  }
  if (altDeg >= -18) {
    return { mode: 'ghost', subLabel: 'Below horizon' };
  }

  let riseLabel = 'Below horizon';
  if (kind === 'sun') {
    const t = formatTimeHHMM(events?.sunrise);
    riseLabel = t ? `Rises at ${t}` : 'No sunrise today';
  } else {
    if (events?.moonAlwaysUp) {
      riseLabel = 'Moon always up';
    } else if (events?.moonAlwaysDown) {
      riseLabel = 'Moon below horizon';
    } else {
      const t = formatTimeHHMM(events?.moonrise);
      riseLabel = t ? `Rises at ${t}` : 'No moonrise today';
    }
  }
  return { mode: 'ghost', subLabel: riseLabel };
}

export function drawPathArc(ctx, samples, basis, W, H, fPx, color) {
  if (!samples || samples.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.globalAlpha = 0.65;

  let prev = null;
  ctx.beginPath();
  let pathOpen = false;

  for (const s of samples) {
    const p = project(s.vec, basis, W, H, fPx);
    if (p.zc <= 0 || p.x === null || p.y === null) {
      prev = null;
      pathOpen = false;
      continue;
    }

    if (prev) {
      const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (dist > 0.6 * W) {
        pathOpen = false;
      }
    }

    if (!pathOpen) {
      ctx.moveTo(p.x, p.y);
      pathOpen = true;
    } else {
      ctx.lineTo(p.x, p.y);
    }
    prev = p;
  }

  ctx.stroke();
  ctx.restore();
}

export function drawMoonPhase(ctx, x, y, radius, phase, fraction, rotRad, mode) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotRad);

  const alpha = mode === 'bright' ? 1 : mode === 'dim' ? 0.55 : 0.35;
  ctx.globalAlpha = alpha;

  const darkFill = '#222a36';
  const litFill = '#f3f7ff';
  const waxing = phase < 0.5;
  const rx = radius * Math.abs(Math.cos(2 * Math.PI * phase));

  // 1. Dark unlit disc
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillStyle = darkFill;
  ctx.fill();

  // 2. Clip to circle and fill lit semicircle
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.clip();

  ctx.beginPath();
  if (waxing) {
    // Right half lit
    ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  } else {
    // Left half lit
    ctx.arc(0, 0, radius, Math.PI / 2, (3 * Math.PI) / 2, false);
  }
  ctx.closePath();
  ctx.fillStyle = litFill;
  ctx.fill();

  // 3. Crescent cuts away ellipse on lit side; gibbous adds ellipse on dark side
  if (rx > 0.25) {
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, radius, 0, 0, 2 * Math.PI);
    ctx.fillStyle = fraction < 0.5 ? darkFill : litFill;
    ctx.fill();
  }

  ctx.restore();

  // Outline ring (dashed for ghost)
  ctx.beginPath();
  ctx.arc(0, 0, radius + 2, 0, 2 * Math.PI);
  ctx.strokeStyle = mode === 'ghost' ? 'rgba(144, 202, 249, 0.85)' : 'rgba(227, 242, 253, 0.9)';
  ctx.lineWidth = 1.75;
  if (mode === 'ghost') ctx.setLineDash([5, 4]);
  ctx.stroke();

  ctx.restore();
}

export function drawSunIcon(ctx, x, y, radius, mode) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = mode === 'bright' ? 1 : mode === 'dim' ? 0.55 : 0.35;

  if (mode === 'bright') {
    const grad = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 1.6);
    grad.addColorStop(0, 'rgba(255, 224, 102, 0.9)');
    grad.addColorStop(0.6, 'rgba(255, 179, 0, 0.35)');
    grad.addColorStop(1, 'rgba(255, 179, 0, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.6, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.78, 0, 2 * Math.PI);
  ctx.fillStyle = mode === 'ghost' ? 'rgba(255, 193, 7, 0.35)' : '#ffd54f';
  ctx.fill();

  // Rays
  const rayInner = radius * 0.95;
  const rayOuter = radius * 1.25;
  ctx.strokeStyle = '#ffca28';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * rayInner, Math.sin(a) * rayInner);
    ctx.lineTo(Math.cos(a) * rayOuter, Math.sin(a) * rayOuter);
    ctx.stroke();
  }

  if (mode === 'ghost' || mode === 'dim') {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffca28';
    ctx.lineWidth = 1.75;
    if (mode === 'ghost') ctx.setLineDash([5, 4]);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawTrueSizeRing(ctx, x, y, fPx, color) {
  const diam = 2 * fPx * Math.tan(angles.rad(0.265));
  const r = Math.max(2, diam / 2);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.globalAlpha = 0.85;
  ctx.stroke();
  ctx.restore();
}

export function drawEdgeArrow(ctx, pos, angleRad, color, label) {
  ctx.save();
  ctx.translate(pos.x, pos.y);

  ctx.save();
  ctx.rotate(angleRad);
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-10, -12);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-10, 12);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  if (label) {
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const offsetX = -Math.cos(angleRad) * 24;
    const offsetY = -Math.sin(angleRad) * 24;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeText(label, offsetX, offsetY);
    ctx.fillStyle = color;
    ctx.fillText(label, offsetX, offsetY);
  }

  ctx.restore();
}

export function drawTargetMarker(ctx, opts) {
  const {
    kind,
    target,
    nowTarget,
    proj,
    nowProj,
    guide,
    basis,
    fPx,
    events,
    iconRadius,
    showTrueSizeRing,
    hasTimeOffset,
  } = opts;

  const isSun = kind === 'sun';
  const color = isSun ? '#ffd54f' : '#90caf9';
  const altDeg = isSun ? target.altApparent : target.alt;
  const state = getAltitudeState(kind, altDeg, events);

  if (hasTimeOffset && nowTarget && nowProj && nowProj.onScreen) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(nowProj.x, nowProj.y, 7, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 3;
    ctx.strokeText('now', nowProj.x, nowProj.y - 14);
    ctx.fillText('now', nowProj.x, nowProj.y - 14);
    ctx.restore();
  }

  if (proj.onScreen) {
    if (isSun) {
      drawSunIcon(ctx, proj.x, proj.y, iconRadius, state.mode);
    } else {
      const zenithScreen = Math.atan2(basis.r.z, basis.u.z);
      const rotClockwise =
        MOON_ROT_SIGN * (target.limbAngle - target.parallactic) + zenithScreen;
      drawMoonPhase(
        ctx,
        proj.x,
        proj.y,
        iconRadius,
        target.phase,
        target.fraction,
        rotClockwise,
        state.mode
      );
    }

    if (showTrueSizeRing) {
      drawTrueSizeRing(ctx, proj.x, proj.y, fPx, color);
    }

    // Label below icon
    const title = isSun ? 'SUN' : 'MOON';
    ctx.save();
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    const labelY = proj.y + iconRadius + 18;
    ctx.strokeText(title, proj.x, labelY);
    ctx.fillStyle = color;
    ctx.fillText(title, proj.x, labelY);

    if (state.subLabel) {
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.strokeText(state.subLabel, proj.x, labelY + 15);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(state.subLabel, proj.x, labelY + 15);
    }
    ctx.restore();
  } else if (!guide.locked) {
    drawEdgeArrow(ctx, guide.arrowPos, guide.arrowAngle, color, isSun ? 'SUN' : 'MOON');
  }
}

export function drawCalibrateReticle(ctx, W, H) {
  const cx = W / 2;
  const cy = H / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

