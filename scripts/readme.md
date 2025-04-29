The scripts in this directory can be used to update `lib/constants/Datum.js` and `lib/constants/Ellipsoid.js` with data from a [`proj.db`](https://proj.org/en/stable/resource_files.html#proj-db) file placed in the root of the repository.

After running the scripts, the formatting needs to be fixed.

A complete command sequence (issued from the root of the repository) would look like this:

    npm install sqlite3
    node scripts/updateDatums.mjs
    node scripts/updateEllipsoids.mjs
    npm run format