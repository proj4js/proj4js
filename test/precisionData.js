// Points close to the poles and to the projection centres, where the
// longitude is ill-conditioned: a test in degrees cannot tell the error of a
// projection from the rounding of its input. These points are checked as
// distances in metres on the sphere instead. Expected values are from a
// 50-digit computation on the same input. All use a sphere of radius 6371000 m.
//
// fwd: 'xy' (default) compares x and y in metres; 'eqc' (ob_tran with
// o_proj=eqc) compares x / R and y / R as longitude and latitude on the
// rotated sphere.
export default [
  // stere sphere, polar: latitude from asin() lost precision near the pole
  {
    code: '+proj=stere +lat_0=90 +R=6371000 +k_0=0.994 +x_0=0 +y_0=0 +lon_0=0',
    ll: [30, 89.9999999],
    xy: [0.0055263875261430016, -0.0095719839775945559]
  },
  // ortho sphere, oblique: latitude from asin() lost precision near the pole
  {
    code: '+proj=ortho +lat_0=45 +R=6371000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [10, 89.9999999],
    xy: [0.0019308795231307598, 4504977.2951962777]
  },
  // aeqd sphere, oblique: latitude from asin() lost precision near the pole
  {
    code: '+proj=aeqd +lat_0=-30 +R=6371000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [-120, -89.9999999],
    xy: [-0.011644304801302344, -6671695.6042332702]
  },
  // laea sphere, oblique: latitude from asin() lost precision near the pole
  {
    code: '+proj=laea +lat_0=45 +R=6371000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [60, 89.9999999],
    xy: [0.01042317987605592, 4876152.2900594383]
  },
  // laea sphere, equatorial: points within 1e-10 * R of the centre came back on the equator
  {
    code: '+proj=laea +lat_0=0 +R=6371000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [1e-09, -2e-09],
    xy: [0.00011119492664455874, -0.00022238985328911749]
  },
  // gnom sphere, polar: latitude from asin() lost precision near the pole
  {
    code: '+proj=gnom +lat_0=-90 +R=6371000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [45, -89.9999999],
    xy: [0.0078626681995985214, 0.0078626681995985214]
  },
  // gnom: the centre itself came back with an undefined latitude
  {
    code: '+proj=gnom +lat_0=90 +R=6371000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [0, 90],
    xy: [0.0, 0.0]
  },
  // tpers: latitude from asin() lost precision near the pole
  {
    code: '+proj=tpers +lat_0=45 +R=6371000 +h=3000000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [100, 89.9999999],
    xy: [0.0067512397377098711, 2777408.3169169292]
  },
  // tpers: the centre itself came back with latitude 0 instead of lat_0
  {
    code: '+proj=tpers +lat_0=45 +R=6371000 +h=3000000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [0, 45],
    xy: [0.0, 0.0]
  },
  // ob_tran: the rotated latitude from asin() lost precision near the rotated pole
  {
    code: '+proj=ob_tran +o_proj=eqc +o_lat_p=40 +o_lon_p=10 +R=6371000',
    ll: [180, 39.9999999],
    xy: [-18903137.529574985, 10007543.386890794],
    fwd: 'eqc'
  },
  // moll: near the poles the Newton iteration stopped early and the inverse clamped sin(theta)
  {
    code: '+proj=moll +R=6371000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [-179, -89.99999],
    xy: [-591.0783918084689, -9009954.6009776294]
  },
  // moll: near the poles the Newton iteration stopped early and the inverse clamped sin(theta)
  {
    code: '+proj=moll +R=6371000 +x_0=0 +y_0=0 +lon_0=0',
    ll: [100, 89.99],
    xy: [33021.103249211675, 9009905.5922611956]
  }
];
