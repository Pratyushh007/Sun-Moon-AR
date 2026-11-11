import SunCalc from './vendor/suncalc.js';
import { angles, vec3 } from './mathx.js';

export function applySunRefractionDeg(hDeg) {
  if (hDeg <= -1) return hDeg;
  const rArcmin = 1.02 / Math.tan(angles.rad(hDeg + 10.3 / (hDeg + 5.11)));
  return hDeg + rArcmin / 60;
}

export function sunCalcAzimuthToNorthDeg(azSouthRad) {
  return angles.deg(angles.wrap2pi(azSouthRad + Math.PI));
}

export function getTargets(date, lat, lon, declinationDeg = 0) {
  const s = SunCalc.getPosition(date, lat, lon);
  const sunAzTrue = sunCalcAzimuthToNorthDeg(s.azimuth);
  const sunAzSensor = angles.wrap360(sunAzTrue - declinationDeg);
  const sunAlt = angles.deg(s.altitude);
  const sunAltApparent = applySunRefractionDeg(sunAlt);
  const sunVec = vec3.fromAzAlt(angles.rad(sunAzSensor), angles.rad(sunAltApparent));

  const m = SunCalc.getMoonPosition(date, lat, lon);
  const ill = SunCalc.getMoonIllumination(date);
  const moonAzTrue = sunCalcAzimuthToNorthDeg(m.azimuth);
  const moonAzSensor = angles.wrap360(moonAzTrue - declinationDeg);
  const moonAlt = angles.deg(m.altitude);
  const moonVec = vec3.fromAzAlt(angles.rad(moonAzSensor), m.altitude);

  return {
    sun: {
      azTrue: sunAzTrue,
      azSensor: sunAzSensor,
      alt: sunAlt,
      altApparent: sunAltApparent,
      vec: sunVec,
    },
    moon: {
      azTrue: moonAzTrue,
      azSensor: moonAzSensor,
      alt: moonAlt,
      vec: moonVec,
      fraction: ill.fraction,
      phase: ill.phase,
      limbAngle: ill.angle,
      parallactic: m.parallacticAngle,
    },
  };
}

export function getPath(kind, date, lat, lon, declinationDeg = 0, stepMin = 10, spanHours = 12) {
  const samples = [];
  const totalMin = spanHours * 60;
  const startMs = date.getTime() - totalMin * 60 * 1000;
  const stepMs = stepMin * 60 * 1000;
  const count = Math.floor((2 * totalMin) / stepMin);

  for (let i = 0; i <= count; i++) {
    const sampleDate = new Date(startMs + i * stepMs);
    let azTrue, altDeg;
    if (kind === 'moon') {
      const m = SunCalc.getMoonPosition(sampleDate, lat, lon);
      azTrue = sunCalcAzimuthToNorthDeg(m.azimuth);
      altDeg = angles.deg(m.altitude);
    } else {
      const s = SunCalc.getPosition(sampleDate, lat, lon);
      azTrue = sunCalcAzimuthToNorthDeg(s.azimuth);
      altDeg = applySunRefractionDeg(angles.deg(s.altitude));
    }
    const azSensor = angles.wrap360(azTrue - declinationDeg);
    const vec = vec3.fromAzAlt(angles.rad(azSensor), angles.rad(altDeg));
    samples.push({ date: sampleDate, vec });
  }

  return samples;
}

function validDateOrNull(d) {
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
}

export function getEvents(date, lat, lon) {
  const sunTimes = SunCalc.getTimes(date, lat, lon);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lon);

  return {
    sunrise: validDateOrNull(sunTimes.sunrise),
    sunset: validDateOrNull(sunTimes.sunset),
    moonrise: validDateOrNull(moonTimes.rise),
    moonset: validDateOrNull(moonTimes.set),
    moonAlwaysUp: Boolean(moonTimes.alwaysUp),
    moonAlwaysDown: Boolean(moonTimes.alwaysDown),
  };
}

