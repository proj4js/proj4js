#!/bin/bash
#you may need to run npm install -g tin
tin -v $1
git checkout -b build
grunt
git add dist
git add lib/version.js
git add package.json
git add bower.json
git add component.json
git commit -m build
git tag $1
git push origin $version
npm publish
jam publish
git checkout master
git branch -D build