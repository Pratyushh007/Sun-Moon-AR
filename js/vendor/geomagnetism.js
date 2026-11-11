/*
 * geomagnetism v0.2.0 (Apache-2.0) - ES Module bundle with WMM-2025 & WMM-2020
 * https://github.com/naturalatlas/geomagnetism
 */

const WMM_2025 = {
  main_field_coeff_g: [
    0, -29351.8, -1410.8, -2556.6, 2951.1, 1649.3, 1361, -2404.1, 1243.8, 453.6,
    895, 799.5, 55.7, -281.1, 12.1, -233.2, 368.9, 187.2, -138.7, -142, 20.9,
    64.4, 63.8, 76.9, -115.7, -40.9, 14.9, -60.7, 79.5, -77, -8.8, 59.3, 15.8,
    2.5, -11.1, 14.2, 23.2, 10.8, -17.5, 2, -21.7, 16.9, 15, -16.8, 0.9, 4.6,
    7.8, 3, -0.2, -2.5, -13.1, 2.4, 8.6, -8.7, -12.9, -1.3, -6.4, 0.2, 2, -1,
    -0.6, -0.9, 1.5, 0.9, -2.7, -3.9, 2.9, -1.5, -2.5, 2.4, -0.6, -0.1, -0.6,
    -0.1, 1.1, -1, -0.2, 2.6, -2, -0.2, 0.3, 1.2, -1.3, 0.6, 0.6, 0.5, -0.1,
    -0.4, -0.2, -1.3, -0.7
  ],
  main_field_coeff_h: [
    0, 0, 4545.4, 0, -3133.6, -815.1, 0, -56.6, 237.5, -549.5, 0, 278.6, -133.9,
    212, -375.6, 0, 45.4, 220.2, -122.9, 43, 106.1, 0, -18.4, 16.8, 48.8, -59.8,
    10.9, 72.7, 0, -48.9, -14.4, -1, 23.4, -7.4, -25.1, -2.3, 0, 7.1, -12.6,
    11.4, -9.7, 12.7, 0.7, -5.2, 3.9, 0, -24.8, 12.2, 8.3, -3.3, -5.2, 7.2, -0.6,
    0.8, 10, 0, 3.3, 0, 2.4, 5.3, -9.1, 0.4, -4.2, -3.8, 0.9, -9.1, 0, 0, 2.9,
    -0.6, 0.2, 0.5, -0.3, -1.2, -1.7, -2.9, -1.8, -2.3, 0, -1.3, 0.7, 1, -1.4, 0,
    0.6, -0.1, 0.8, 0.1, -1, 0.1, 0.2
  ],
  secular_var_coeff_g: [
    0, 12, 9.7, -11.6, -5.2, -8, -1.3, -4.2, 0.4, -15.6, -1.6, -2.4, -6, 5.6, -7,
    0.6, 1.4, 0, 0.6, 2.2, 0.9, -0.2, -0.4, 0.9, 1.2, -0.9, 0.3, 0.9, 0, -0.1,
    -0.1, 0.5, -0.1, -0.8, -0.8, 0.8, -0.1, 0.2, 0, 0.5, -0.1, 0.3, 0.2, 0, 0.2,
    0, -0.1, 0.1, 0.3, -0.3, 0, 0.3, -0.1, 0.1, -0.1, 0.1, 0, 0.1, 0.1, 0, -0.3,
    0, -0.1, -0.1, 0, 0, 0, 0, 0, 0, 0, -0.1, 0, 0, -0.1, -0.1, -0.1, -0.1, 0, 0,
    0, 0, 0, 0, 0.1, 0, 0, 0, -0.1, 0, -0.1
  ],
  secular_var_coeff_h: [
    0, 0, -21.5, 0, -27.7, -12.1, 0, 4, -0.3, -4.1, 0, -1.1, 4.1, 1.6, -4.4, 0,
    -0.5, 2.2, 0.4, 1.7, 1.9, 0, 0.3, -1.6, -0.4, 0.9, 0.7, 0.9, 0, 0.6, 0.5,
    -0.8, 0, -1, 0.6, -0.2, 0, -0.2, 0.5, -0.4, 0.4, -0.5, -0.6, 0.3, 0.2, 0,
    -0.3, 0.3, -0.3, 0.3, 0.2, -0.1, -0.2, 0.4, 0.1, 0, 0, 0, -0.2, 0.1, -0.1,
    0.1, 0, -0.1, 0.2, 0, 0, 0, 0.1, 0, 0.1, 0, 0, 0.1, 0, 0, 0, 0, 0, 0, 0, 0,
    -0.1, 0.1, 0, 0, 0, 0, 0, 0, -0.1
  ],
  n_max: 12,
  n_max_sec_var: 12,
  epoch: 2025,
  name: "WMM-2025",
  start_date: "2024-11-13T03:00:00.000Z",
  end_date: "2029-11-13T03:00:00.000Z"
};

const WMM_2020 = {
  main_field_coeff_g: [
    0, -29404.5, -1450.7, -2500, 2982, 1676.8, 1363.9, -2381, 1236.2, 525.7,
    903.1, 809.4, 86.2, -309.4, 47.9, -234.4, 363.1, 187.8, -140.7, -151.2, 13.7,
    65.9, 65.6, 73, -121.5, -36.2, 13.5, -64.7, 80.6, -76.8, -8.3, 56.5, 15.8,
    6.4, -7.2, 9.8, 23.6, 9.8, -17.5, -0.4, -21.1, 15.3, 13.7, -16.5, -0.3, 5,
    8.2, 2.9, -1.4, -1.1, -13.3, 1.1, 8.9, -9.3, -11.9, -1.9, -6.2, -0.1, 1.7,
    -0.9, 0.6, -0.9, 1.9, 1.4, -2.4, -3.9, 3, -1.4, -2.5, 2.4, -0.9, 0.3, -0.7,
    -0.1, 1.4, -0.6, 0.2, 3.1, -2, -0.1, 0.5, 1.3, -1.2, 0.7, 0.3, 0.5, -0.2,
    -0.5, 0.1, -1.1, -0.3
  ],
  main_field_coeff_h: [
    0, 0, 4652.9, 0, -2991.6, -734.8, 0, -82.2, 241.8, -542.9, 0, 282, -158.4,
    199.8, -350.1, 0, 47.7, 208.4, -121.3, 32.2, 99.1, 0, -19.1, 25, 52.7, -64.4,
    9, 68.1, 0, -51.4, -16.8, 2.3, 23.5, -2.2, -27.2, -1.9, 0, 8.4, -15.3, 12.8,
    -11.8, 14.9, 3.6, -6.9, 2.8, 0, -23.3, 11.1, 9.8, -5.1, -6.2, 7.8, 0.4,
    -1.5, 9.7, 0, 3.4, -0.2, 3.5, 4.8, -8.6, -0.1, -4.2, -3.4, -0.1, -8.8, 0, 0,
    2.6, -0.5, -0.4, 0.6, -0.2, -1.7, -1.6, -3, -2, -2.6, 0, -1.2, 0.5, 1.3,
    -1.8, 0.1, 0.7, -0.1, 0.6, 0.2, -0.9, 0, 0.5
  ],
  secular_var_coeff_g: [
    0, 6.7, 7.7, -11.5, -7.1, -2.2, 2.8, -6.2, 3.4, -12.2, -1.1, -1.6, -6, 5.4,
    -5.5, -0.3, 0.6, -0.7, 0.1, 1.2, 1, -0.6, -0.4, 0.5, 1.4, -1.4, 0, 0.8, -0.1,
    -0.3, -0.1, 0.7, 0.2, -0.5, -0.8, 1, -0.1, 0.1, -0.1, 0.5, -0.1, 0.4, 0.5, 0,
    0.4, -0.1, -0.2, 0, 0.4, -0.3, 0, 0.3, 0, 0, -0.4, 0, 0, 0, 0.2, -0.1, -0.2,
    0, -0.1, -0.2, -0.1, 0, 0, -0.1, 0, 0, 0, -0.1, 0, 0, -0.1, -0.1, -0.1, -0.1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.1
  ],
  secular_var_coeff_h: [
    0, 0, -25.1, 0, -30.2, -23.9, 0, 5.7, -1, 1.1, 0, 0.2, 6.9, 3.7, -5.6, 0,
    0.1, 2.5, -0.9, 3, 0.5, 0, 0.1, -1.8, -1.4, 0.9, 0.1, 1, 0, 0.5, 0.6, -0.7,
    -0.2, -1.2, 0.2, 0.3, 0, -0.3, 0.7, -0.2, 0.5, -0.3, -0.5, 0.4, 0.1, 0, -0.3,
    0.2, -0.4, 0.4, 0.1, 0, -0.2, 0.5, 0.2, 0, 0, 0.1, -0.3, 0.1, -0.2, 0.1, 0,
    -0.1, 0.2, 0, 0, 0, 0.1, 0, 0.2, 0, 0, 0.1, 0, -0.1, 0, 0, 0, 0, 0, -0.1,
    0.1, 0, 0, 0, 0.1, 0, 0, 0, -0.1
  ],
  n_max: 12,
  n_max_sec_var: 12,
  epoch: 2020,
  name: "WMM-2020",
  start_date: "2019-12-10T08:00:00.000Z",
  end_date: "2024-12-10T08:00:00.000Z"
};

function Ellipsoid(options) {
  options = options || {
    a: 6378.137,
    b: 6356.7523142,
    fla: 1 / 298.257223563,
    re: 6371.2,
  };
  this.a = options.a;
  this.b = options.b;
  this.fla = options.fla;
  this.re = options.re;
  this.eps = Math.sqrt(1 - (this.b * this.b) / (this.a * this.a));
  this.epssq = this.eps * this.eps;
}

function PcupLow(x, n_max) {
  let k, z, n, m, i, i1, i2;
  const schmidt_quasi_norm = [1.0];
  const pcup = [1.0];
  const dpcup = [0.0];

  z = Math.sqrt((1 - x) * (1 + x));

  for (n = 1; n <= n_max; n++) {
    for (m = 0; m <= n; m++) {
      i = (n * (n + 1)) / 2 + m;
      if (n === m) {
        i1 = ((n - 1) * n) / 2 + m - 1;
        pcup[i] = z * pcup[i1];
        dpcup[i] = z * dpcup[i1] + x * pcup[i1];
      } else if (n === 1 && m === 0) {
        i1 = ((n - 1) * n) / 2 + m;
        pcup[i] = x * pcup[i1];
        dpcup[i] = x * dpcup[i1] - z * pcup[i1];
      } else if (n > 1 && n !== m) {
        i1 = ((n - 2) * (n - 1)) / 2 + m;
        i2 = ((n - 1) * n) / 2 + m;
        if (m > n - 2) {
          pcup[i] = x * pcup[i2];
          dpcup[i] = x * dpcup[i2] - z * pcup[i2];
        } else {
          k = ((n - 1) * (n - 1) - m * m) / ((2 * n - 1) * (2 * n - 3));
          pcup[i] = x * pcup[i2] - k * pcup[i1];
          dpcup[i] = x * dpcup[i2] - z * pcup[i2] - k * dpcup[i1];
        }
      }
    }
  }

  for (n = 1; n <= n_max; n++) {
    i = (n * (n + 1)) / 2;
    i1 = ((n - 1) * n) / 2;
    schmidt_quasi_norm[i] = (schmidt_quasi_norm[i1] * (2 * n - 1)) / n;
    for (m = 1; m <= n; m++) {
      i = (n * (n + 1)) / 2 + m;
      i1 = (n * (n + 1)) / 2 + m - 1;
      schmidt_quasi_norm[i] =
        schmidt_quasi_norm[i1] *
        Math.sqrt(((n - m + 1) * (m === 1 ? 2 : 1)) / (n + m));
    }
  }

  for (n = 1; n <= n_max; n++) {
    for (m = 0; m <= n; m++) {
      i = (n * (n + 1)) / 2 + m;
      pcup[i] *= schmidt_quasi_norm[i];
      dpcup[i] *= -schmidt_quasi_norm[i];
    }
  }

  return { pcup, dpcup };
}

function LegendreFunction(coord_spherical, n_max) {
  const sin_phi = Math.sin((Math.PI / 180) * coord_spherical.phig);
  const result = PcupLow(sin_phi, n_max);
  this.pcup = result.pcup;
  this.dpcup = result.dpcup;
}

function SphericalCoord(options) {
  this.lambda = options.lambda;
  this.phig = options.phig;
  this.r = options.r;
}

SphericalCoord.prototype.getHarmonicVariables = function (ellipsoid, n_max) {
  let m, n;
  const cos_lambda = Math.cos((Math.PI / 180) * this.lambda);
  const sin_lambda = Math.sin((Math.PI / 180) * this.lambda);
  const cos_mlambda = [1.0, cos_lambda];
  const sin_mlambda = [0.0, sin_lambda];
  const relative_radius_power = [
    (ellipsoid.re / this.r) * (ellipsoid.re / this.r),
  ];

  for (n = 1; n <= n_max; n++) {
    relative_radius_power[n] =
      relative_radius_power[n - 1] * (ellipsoid.re / this.r);
  }
  for (m = 2; m <= n_max; m++) {
    cos_mlambda[m] =
      cos_mlambda[m - 1] * cos_lambda - sin_mlambda[m - 1] * sin_lambda;
    sin_mlambda[m] =
      cos_mlambda[m - 1] * sin_lambda + sin_mlambda[m - 1] * cos_lambda;
  }

  return { relative_radius_power, cos_mlambda, sin_mlambda };
};

SphericalCoord.prototype.getLegendreFunction = function (n_max) {
  return new LegendreFunction(this, n_max);
};

function GeodeticCoord(options) {
  this.options = options;
  this.lambda = options.lambda || options.lon;
  this.phi = options.phi || options.lat;
  this.height_above_ellipsoid = options.height_above_ellipsoid || 0;
  this.ellipsoid = options.ellipsoid || new Ellipsoid();
}

GeodeticCoord.prototype.toSpherical = function () {
  const ellipsoid = this.ellipsoid;
  const coslat = Math.cos((this.phi * Math.PI) / 180);
  const sinlat = Math.sin((this.phi * Math.PI) / 180);
  const rc = ellipsoid.a / Math.sqrt(1 - ellipsoid.epssq * sinlat * sinlat);
  const xp = (rc + this.height_above_ellipsoid) * coslat;
  const zp =
    (rc * (1 - ellipsoid.epssq) + this.height_above_ellipsoid) * sinlat;
  const r = Math.sqrt(xp * xp + zp * zp);
  return new SphericalCoord({
    r,
    phig: (180 / Math.PI) * Math.asin(zp / r),
    lambda: this.lambda,
  });
};

function MagneticVector(options) {
  this.bx = options.bx;
  this.by = options.by;
  this.bz = options.bz;
}

MagneticVector.prototype.rotate = function (coord_spherical, coord_geodetic) {
  const psi = (Math.PI / 180) * (coord_spherical.phig - coord_geodetic.phi);
  return new MagneticVector({
    bz: this.bx * Math.sin(psi) + this.bz * Math.cos(psi),
    bx: this.bx * Math.cos(psi) - this.bz * Math.sin(psi),
    by: this.by,
  });
};

function MagneticElements(options) {
  this.x = options.x;
  this.y = options.y;
  this.z = options.z;
  this.h = options.h;
  this.f = options.f;
  this.incl = options.incl;
  this.decl = options.decl;
}

MagneticElements.fromGeoMagneticVector = function (magnetic_vector) {
  const bx = magnetic_vector.bx;
  const by = magnetic_vector.by;
  const bz = magnetic_vector.bz;
  const h = Math.sqrt(bx * bx + by * by);
  return new MagneticElements({
    x: bx,
    y: by,
    z: bz,
    h,
    f: Math.sqrt(h * h + bz * bz),
    decl: (180 / Math.PI) * Math.atan2(by, bx),
    incl: (180 / Math.PI) * Math.atan2(bz, h),
  });
};

function Model(options) {
  this.epoch = options.epoch;
  this.start_date = new Date(options.start_date);
  this.end_date = new Date(options.end_date);
  this.name = options.name || "";
  this.main_field_coeff_g = options.main_field_coeff_g || [0];
  this.main_field_coeff_h = options.main_field_coeff_h || [0];
  this.secular_var_coeff_g = options.secular_var_coeff_g || [0];
  this.secular_var_coeff_h = options.secular_var_coeff_h || [0];
  this.n_max = options.n_max || 0;
  this.n_max_sec_var = options.n_max_sec_var || 0;
  this.num_terms = (this.n_max * (this.n_max + 1)) / 2 + this.n_max;
}

Model.prototype.getTimedModel = function (date, allowOutOfBoundsModel = false) {
  const year_int = date.getUTCFullYear();
  const fractional_year =
    (date.valueOf() - Date.UTC(year_int)) / (1000 * 3600 * 24 * 365);
  const year = year_int + fractional_year;
  const dyear = year - this.epoch;

  if (date < this.start_date || date > this.end_date) {
    if (!allowOutOfBoundsModel) {
      throw new Error(
        "Model is only valid from " +
          this.start_date.toDateString() +
          " to " +
          this.end_date.toDateString()
      );
    }
  }

  const model = new Model({
    epoch: this.epoch,
    n_max: this.n_max,
    n_max_sec_var: this.n_max_sec_var,
    name: this.name,
    start_date: this.start_date,
    end_date: this.end_date,
  });
  const a = model.n_max_sec_var;
  const b = (a * (a + 1)) / 2 + a;
  for (let n = 1; n <= this.n_max; n++) {
    for (let m = 0; m <= n; m++) {
      const i = (n * (n + 1)) / 2 + m;
      const hnm = this.main_field_coeff_h[i];
      const gnm = this.main_field_coeff_g[i];
      const dhnm = this.secular_var_coeff_h[i];
      const dgnm = this.secular_var_coeff_g[i];
      if (i <= b) {
        model.main_field_coeff_h[i] = hnm + dyear * dhnm;
        model.main_field_coeff_g[i] = gnm + dyear * dgnm;
        model.secular_var_coeff_h[i] = dhnm;
        model.secular_var_coeff_g[i] = dgnm;
      } else {
        model.main_field_coeff_h[i] = hnm;
        model.main_field_coeff_g[i] = gnm;
      }
    }
  }
  return model;
};

Model.prototype.getSummation = function (
  legendre,
  sph_variables,
  coord_spherical
) {
  let bx = 0,
    by = 0,
    bz = 0;
  let n, m, i, k;
  const relative_radius_power = sph_variables.relative_radius_power;
  const cos_mlambda = sph_variables.cos_mlambda;
  const sin_mlambda = sph_variables.sin_mlambda;
  const g = this.main_field_coeff_g;
  const h = this.main_field_coeff_h;

  for (n = 1; n <= this.n_max; n++) {
    for (m = 0; m <= n; m++) {
      i = (n * (n + 1)) / 2 + m;
      bz -=
        relative_radius_power[n] *
        (g[i] * cos_mlambda[m] + h[i] * sin_mlambda[m]) *
        (n + 1) *
        legendre.pcup[i];
      by +=
        relative_radius_power[n] *
        (g[i] * sin_mlambda[m] - h[i] * cos_mlambda[m]) *
        m *
        legendre.pcup[i];
      bx -=
        relative_radius_power[n] *
        (g[i] * cos_mlambda[m] + h[i] * sin_mlambda[m]) *
        legendre.dpcup[i];
    }
  }
  const cos_phi = Math.cos((Math.PI / 180) * coord_spherical.phig);
  if (Math.abs(cos_phi) > 1e-10) {
    by = by / cos_phi;
  } else {
    by = 0;
    let schmidt_quasi_norm1 = 1.0,
      schmidt_quasi_norm2,
      schmidt_quasi_norm3;
    const pcup_s = [1];
    const sin_phi = Math.sin((Math.PI / 180) * coord_spherical.phig);

    for (n = 1; n <= this.n_max; n++) {
      i = (n * (n + 1)) / 2 + 1;
      schmidt_quasi_norm2 = (schmidt_quasi_norm1 * (2 * n - 1)) / n;
      schmidt_quasi_norm3 =
        schmidt_quasi_norm2 * Math.sqrt((2 * n) / (n + 1));
      schmidt_quasi_norm1 = schmidt_quasi_norm2;
      if (n === 1) {
        pcup_s[n] = pcup_s[n - 1];
      } else {
        k = ((n - 1) * (n - 1) - 1) / ((2 * n - 1) * (2 * n - 3));
        pcup_s[n] = sin_phi * pcup_s[n - 1] - k * pcup_s[n - 2];
      }
      by +=
        relative_radius_power[n] *
        (g[i] * sin_mlambda[1] - h[i] * cos_mlambda[1]) *
        pcup_s[n] *
        schmidt_quasi_norm3;
    }
  }
  return new MagneticVector({ bx, by, bz });
};

Model.prototype.point = function (coords) {
  const altitude =
    coords.length > 2 && typeof coords[2] === "number" ? coords[2] : 0;

  const coord_geodetic = new GeodeticCoord({
    lat: coords[0],
    lon: coords[1],
    height_above_ellipsoid: altitude,
  });
  const coord_spherical = coord_geodetic.toSpherical();
  const legendre = coord_spherical.getLegendreFunction(this.n_max);
  const harmonic_variables = coord_spherical.getHarmonicVariables(
    coord_geodetic.ellipsoid,
    this.n_max
  );

  const magnetic_vector_sph = this.getSummation(
    legendre,
    harmonic_variables,
    coord_spherical
  );
  const magnetic_vector_geo = magnetic_vector_sph.rotate(
    coord_spherical,
    coord_geodetic
  );

  return MagneticElements.fromGeoMagneticVector(magnetic_vector_geo);
};

const modelData = [
  {
    file: WMM_2025,
    startDate: new Date("2024-11-13T03:00:00.000Z"),
    endDate: new Date("2029-11-13T03:00:00.000Z"),
  },
  {
    file: WMM_2020,
    startDate: new Date("2019-12-10T08:00:00.000Z"),
    endDate: new Date("2024-12-10T08:00:00.000Z"),
  },
];

const geomagnetism = {
  model(date, options = {}) {
    date = date || new Date();
    const ts = date.getTime();
    const allowOutOfBoundsModel =
      (options && options.allowOutOfBoundsModel) || false;

    let matchingModelData = modelData.find(
      (m) => ts >= m.startDate.getTime() && ts <= m.endDate.getTime()
    );

    if (
      !matchingModelData &&
      ts < modelData[modelData.length - 1].startDate.getTime()
    ) {
      matchingModelData = modelData[modelData.length - 1];
    } else if (!matchingModelData && ts > modelData[0].endDate.getTime()) {
      matchingModelData = modelData[0];
    }

    if (!matchingModelData) {
      matchingModelData = modelData[0];
    }

    const matchingModel = new Model(matchingModelData.file);
    return matchingModel.getTimedModel(date, allowOutOfBoundsModel);
  },
};

export default geomagnetism;

