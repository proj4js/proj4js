The scripts in this directory update `lib/constants/Datum.js` and `lib/constants/Ellipsoid.js` with data from a [`proj.db`](https://proj.org/en/stable/resource_files.html#proj-db) file placed in the root of the repository.

They read the database through node's built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) module, so no dependencies need to be installed. This requires node 22.5 or newer.

## Getting proj.db

`proj.db` is not part of the PROJ release archives, which only contain the SQL sources it is built from. Copy it from a recent PROJ installation instead, using one of these:

- **An installed PROJ** (e.g. from Homebrew, conda-forge or OSGeo4W). `projinfo --searchpaths` lists the directories PROJ looks in; `proj.db` is in one of them. Linux distribution packages are often several releases behind.
- **The pyproj wheel from PyPI**, which bundles `proj.db` and doesn't need PROJ to be installed:

      python3 -m pip download --no-deps --only-binary=:all: pyproj -d pyproj-wheel
      unzip -j pyproj-wheel/pyproj-*.whl 'pyproj/proj_dir/share/proj/proj.db' -d .
      rm -r pyproj-wheel

The EPSG version of `proj.db` must not be older than the one in the first line of `Datum.js` and `Ellipsoid.js`. The scripts check this, write the new version to that line, and refuse to run with an older database. To see the versions of a `proj.db`:

    sqlite3 proj.db "SELECT key, value FROM metadata WHERE key IN ('PROJ.VERSION', 'EPSG.VERSION')"

## Running the scripts

After running the scripts, the formatting needs to be fixed. A complete command sequence (issued from the root of the repository) looks like this:

    node scripts/updateDatums.mjs
    node scripts/updateEllipsoids.mjs
    npm run format

`updateEllipsoids.mjs` only adds ellipsoids that datums in `Datum.js` refer to but
`Ellipsoid.js` does not define. It matches on the `name` column of proj.db's
`ellipsoid` table, so proj4's short aliases (`clrk80`, `intl`, ...) will not be
found - such names are reported as `No proj.db ellipsoid named: ...` and need to
be resolved by hand.
