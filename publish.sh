#!/bin/bash

# get current version
VERSION=$(node -e "console.log(require('./package.json').version)")

# Build
git checkout -b build
npm run build
git add dist -f
git commit -m "build $VERSION"

# Tag and push
git tag -f v$VERSION -m "$VERSION"
git push --tags git@github.com:proj4js/proj4js.git v$VERSION

# Publish
npm publish

# Cleanup
git checkout master
git branch -D build
