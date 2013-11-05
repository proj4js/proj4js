#!/bin/bash
#you may need to run npm install -g tin
tin -v $1
git checkout -b build
grunt
git add dist/proj4.js -f
git add dist/proj4-src.js -f
git add package.json
git add bower.json
git add component.json
git commit -m build
git tag $1
git push git@github.com:proj4js/proj4js.git $1
npm publish
jam publish
git checkout master
git branch -D build
