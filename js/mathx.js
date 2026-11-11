export const angles = {
  deg(rad) {
    return (rad * 180) / Math.PI;
  },
  rad(deg) {
    return (deg * Math.PI) / 180;
  },
  wrap360(x) {
    return ((x % 360) + 360) % 360;
  },
  wrap180(x) {
    return angles.wrap360(x + 180) - 180;
  },
  wrap2pi(x) {
    const twoPi = 2 * Math.PI;
    return ((x % twoPi) + twoPi) % twoPi;
  },
  clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
  },
};

export const vec3 = {
  create(x = 0, y = 0, z = 0) {
    return { x, y, z };
  },
  add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  },
  sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  },
  scale(v, s) {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  },
  dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  },
  cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  },
  norm(v) {
    return Math.hypot(v.x, v.y, v.z);
  },
  normalize(v) {
    const n = Math.hypot(v.x, v.y, v.z);
    if (n === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / n, y: v.y / n, z: v.z / n };
  },
  fromAzAlt(azRad, altRad) {
    const cosAlt = Math.cos(altRad);
    return {
      x: cosAlt * Math.sin(azRad),
      y: cosAlt * Math.cos(azRad),
      z: Math.sin(altRad),
    };
  },
  toAzAlt(v) {
    const azDeg = angles.wrap360(angles.deg(Math.atan2(v.x, v.y)));
    const altDeg = angles.deg(Math.asin(angles.clamp(v.z, -1, 1)));
    return { azDeg, altDeg };
  },
};

export const mat3 = {
  identity() {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
  },
  fromAlphaBetaGamma(alphaRad, betaRad, gammaRad) {
    const cA = Math.cos(alphaRad);
    const sA = Math.sin(alphaRad);
    const cB = Math.cos(betaRad);
    const sB = Math.sin(betaRad);
    const cG = Math.cos(gammaRad);
    const sG = Math.sin(gammaRad);

    return [
      [cA * cG - sA * sB * sG, -cB * sA, cG * sA * sB + cA * sG],
      [cG * sA + cA * sB * sG, cA * cB, sA * sG - cA * cG * sB],
      [-cB * sG, sB, cB * cG],
    ];
  },
  fromQuaternion(q) {
    const { x, y, z, w } = quat.normalize(q);
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const xy = x * y;
    const xz = x * z;
    const yz = y * z;
    const xw = x * w;
    const yw = y * w;
    const zw = z * w;

    return [
      [1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (xz + yw)],
      [2 * (xy + zw), 1 - 2 * (xx + zz), 2 * (yz - xw)],
      [2 * (xz - yw), 2 * (yz + xw), 1 - 2 * (xx + yy)],
    ];
  },
  mulVec(R, v) {
    return {
      x: R[0][0] * v.x + R[0][1] * v.y + R[0][2] * v.z,
      y: R[1][0] * v.x + R[1][1] * v.y + R[1][2] * v.z,
      z: R[2][0] * v.x + R[2][1] * v.y + R[2][2] * v.z,
    };
  },
  mul(A, B) {
    const out = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        out[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
      }
    }
    return out;
  },
  Rz(angleRad) {
    const c = Math.cos(angleRad);
    const s = Math.sin(angleRad);
    return [
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1],
    ];
  },
  col(R, idx) {
    return { x: R[0][idx], y: R[1][idx], z: R[2][idx] };
  },
};

export const quat = {
  normalize(q) {
    const n = Math.hypot(q.x, q.y, q.z, q.w);
    if (n === 0) return { x: 0, y: 0, z: 0, w: 1 };
    return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n };
  },
  fromMat3(R) {
    const m00 = R[0][0], m01 = R[0][1], m02 = R[0][2];
    const m10 = R[1][0], m11 = R[1][1], m12 = R[1][2];
    const m20 = R[2][0], m21 = R[2][1], m22 = R[2][2];
    const tr = m00 + m11 + m22;
    let x, y, z, w;

    if (tr > 0) {
      const S = Math.sqrt(tr + 1.0) * 2;
      w = 0.25 * S;
      x = (m21 - m12) / S;
      y = (m02 - m20) / S;
      z = (m10 - m01) / S;
    } else if (m00 > m11 && m00 > m22) {
      const S = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
      w = (m21 - m12) / S;
      x = 0.25 * S;
      y = (m01 + m10) / S;
      z = (m02 + m20) / S;
    } else if (m11 > m22) {
      const S = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
      w = (m02 - m20) / S;
      x = (m01 + m10) / S;
      y = 0.25 * S;
      z = (m12 + m21) / S;
    } else {
      const S = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
      w = (m10 - m01) / S;
      x = (m02 + m20) / S;
      y = (m12 + m21) / S;
      z = 0.25 * S;
    }

    return quat.normalize({ x, y, z, w });
  },
  slerp(a, b, t) {
    let bx = b.x, by = b.y, bz = b.z, bw = b.w;
    let dot = a.x * bx + a.y * by + a.z * bz + a.w * bw;

    if (dot < 0) {
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
      dot = -dot;
    }

    dot = angles.clamp(dot, -1, 1);

    if (dot > 0.9995) {
      return quat.normalize({
        x: a.x + t * (bx - a.x),
        y: a.y + t * (by - a.y),
        z: a.z + t * (bz - a.z),
        w: a.w + t * (bw - a.w),
      });
    }

    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - (dot * sinTheta) / sinTheta0;
    const s1 = sinTheta / sinTheta0;

    return quat.normalize({
      x: s0 * a.x + s1 * bx,
      y: s0 * a.y + s1 * by,
      z: s0 * a.z + s1 * bz,
      w: s0 * a.w + s1 * bw,
    });
  },
};

