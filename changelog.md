## Change log

- 2.23.0: Add Laborde (labrd), Colombia Urban (col_urban) and modified Krovak (mod_krovak) projections; support the Guam variant of aeqd, hyperbolic Cassini-Soldner, south orientated tmerc, west orientated lcc, `+alpha` and `+k` in ortho, and ellipsoidal eqc (including ESRI Plate_Carree and Equidistant_Cylindrical_Ellipsoidal); apply datum shifts for geographic CRSs without towgs84 and for CRSs with a non-Greenwich prime meridian; pick the best datum shift per CRS, preferring EPSG transformations with a known accuracy; add the Amersfoort datum for WKT without TOWGS84; match PROJ's ellipsoid names for WGS72, APL4.9, danish, GSK2011 and PZ90; default x0, y0, lat0 and long0 to 0 like PROJ, instead of returning NaN; fix tmerc on spherical ellipsoids, Cassini far from the central meridian, ortho inverse near the horizon, spherical eqc, the inverse at the geocentric origin, and the hemisphere when inverting points beyond ±180 in eqearth, moll, robin, sinu and vandg; recognize WKT with parentheses as delimiters; make `forward` and `inverse` optional in the `ProjectionDefinition` type; transforms are about twice as fast; update wkt-parser to 1.9.0; the npm package now contains only the files needed to use proj4js
- 2.22.0: Support latlong, latlon and lonlat as aliases of longlat; preserve z when enforceAxis=true for omerc and robin; apply false easting in ortho projections
- 2.21.0: Add support for `+lon_wrap`
- 2.20.9: Add Eckert VI (eck6) projection; add geotiff@3 support (geotiff is now an optional peer dependency); fix unknown datum handling to match PROJ behavior; fix gamma without alpha in omerc; fix ob_tran lam offset and +over handling; fix enforceAxis for z and arbitrary axis orders

- 2.20.8: Add back TypeScript type definitions to the npm package (accidentally removed in 2.20.7)

- 2.20.7: GitHub releases now contain a separate dist.zip file, so users don't have to find the dist folder in the downloaded source code any more; removed bower.json and component.json; trusted OIDC publishing for the npm package; added security policy; vitest instead of mocha for the tests; removed grunt; renamed main branch to main

- 2.20.0: Include WGS84 UTM zones 1-60 North/South and WGS84 UPS North/South; add support for `+over`; add general oblique transformation; make projjson work with `proj4.defs(code, projjson)`

- 2.19.0: TypeScript type definitions are now included. When upgrading, please uninstall the `@types/proj4` package.

- 2.2.1: Documentation fixes and added proj4.defs('name') as an alias for proj4.defs['name'];

- 2.1.4: dist folder is added back in after accidentally omitting it in 2.1.1

- 2.1.3: skipped as issues with the dist folder are ironed out.

- 2.1.2: added sensible defaults for false eastings/northings

- 2.1.1: tweaks to how we publish it, fixes related to errors with the OSGB36 and Reseau National Belge 1972 datums, we took the first steps towards depreciating the proj4.Point class.

- 2.1.0: targeted builds for projections are now supported, and internally projection creation is more modular.

- 2.0.3: mgrs is broken out into it's own module loaded via npm.

- 2.0.2: module common is broken up into a collection of smaller modules. 

- 2.0.1: fix typo in eqc projection.

- 2.0.0: we start the change log.