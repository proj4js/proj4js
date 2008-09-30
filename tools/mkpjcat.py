#!/usr/bin/env python

import sys
sys.path.append(".")

import pjjs

resourcesDirectory = "catalogues"
targetDirectory = "../lib/defs"

if len(sys.argv) > 1:
    resourcesDirectory = sys.argv[1]

if len(sys.argv) > 2:
    targetDirectory = sys.argv[2]

print "Generating Proj4js catalogues."
pjjs.pjcat2js_clean(resourcesDirectory,targetDirectory)
pjjs.pjcat2js_run(resourcesDirectory,targetDirectory)

print "Done."
