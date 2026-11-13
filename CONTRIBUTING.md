# Contributing to proj4js

Thanks for your interest in contributing. proj4js is maintained by a small group of volunteers, and review time is the scarcest resource we have. These guidelines help us spend it on changes that matter to people who use proj4js.

For setting up a development environment, building and running the tests, see the [Developing](README.md#developing) section of the readme.

## Real-world use case

Bug reports and bug fixes need a real-world use case. That means one of:

- A published CRS definition (e.g. an EPSG, ESRI or IAU code, as found on [spatialreference.org](https://spatialreference.org) that gives wrong results, with coordinates inside the CRS's area of use.
- A definition or workflow from an application you or your users actually depend on.

Describe the use case in the issue or pull request. Differences from PROJ that only show up with made-up parameter combinations, or with coordinates far outside the area where a projection is meant to be used, are not considered bugs.

New features (e.g. a new projection or parameter) need a use case too: tell us who needs it and for which CRS.

## One pull request per change

Keep each pull request to a single fix or feature, and leave unrelated code alone. Don't reformat, rename or restructure code you're not otherwise changing.

Before opening a pull request, check the open pull requests. If one already addresses the same problem, review or comment on it instead of opening another.

For anything bigger than a small fix, open an issue first and wait for feedback from a maintainer before investing time in a pull request.

## Keep descriptions short

Keep issue and pull request descriptions short and focused on what a reviewer needs to know: the use case, what was wrong, and what the change does. As a rule of thumb, a reviewer should be able to read and understand a pull request description in less than a minute. Don't include test run statistics or lists of every check you ran; our CI runs those.

Keep commit messages short as well. Don't repeat the pull request description, and don't reference issues or pull requests in commit messages; GitHub links those for us.

## Tests

Bug fixes need a test that fails without the fix, and new features need tests that cover them.

- Write as few tests as needed. Use the smallest input that exercises the code path, and don't assert the same behavior twice.
- Add tests to an existing test file and follow its conventions, instead of creating a new file.
- Provide a proof that expected values are correct, e.g. by using a publicly published formula or a common tool (e.g. [PROJ](https://proj.org)'s `cs2cs`).
- Use test points inside the area of use of the CRS.
- Leave existing tests alone unless the expected behavior has changed. If an existing test has to change, explain why in the pull request description.

## Code comments

Keep code comments concise. They should help readers understand code that isn't self-explanatory, not describe the reasoning or history behind a change; that belongs in the pull request. Don't add decorative comment banners (such as the dashed-line comments in older GCTP-derived code).

## Datums and ellipsoids

`lib/constants/Datum.js` and `lib/constants/Ellipsoid.js` are generated from PROJ's `proj.db`. To add or correct a datum or ellipsoid, update the generating scripts and run them as described in [scripts/readme.md](scripts/readme.md), instead of editing the generated files by hand.

The first line of each of these files names the EPSG version of the `proj.db` they were last updated with. The `proj.db` you use must not have an older EPSG version; the scripts refuse to run otherwise.

## Before submitting

Make sure `npm test` passes; it includes linting, type checking and the full test suite.
