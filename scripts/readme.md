The scripts in this directory can be used to update `lib/constants/Datum.js` and `lib/constants/Ellipsoid.js` with data from a [`proj.db`](https://proj.org/en/stable/resource_files.html#proj-db) file placed in the root of the repository.

They read the database through node's built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) module, so no dependencies need to be installed. This requires node 22.5 or newer.

After running the scripts, the formatting needs to be fixed.

A complete command sequence (issued from the root of the repository) would look like this:

    node scripts/updateDatums.mjs
    node scripts/updateEllipsoids.mjs
    npm run format

`updateEllipsoids.mjs` only adds ellipsoids that datums in `Datum.js` refer to but
`Ellipsoid.js` does not define. It matches on the `name` column of proj.db's
`ellipsoid` table, so proj4's short aliases (`clrk80`, `intl`, ...) will not be
found - such names are reported as `No proj.db ellipsoid named: ...` and need to
be resolved by hand.
