#!/usr/bin/env python
#
# TODO explain
#
# -- Copyright 2007 IGN France / Geoportail project --
#

import sys
import os
import re

SUFFIX_JAVASCRIPT = ".js"

def _pjcat2js_remove(rezDirectory,catName,targetDirectory):
    pjCatFilename = os.path.join(rezDirectory, catName)
    pjCat = open(pjCatFilename,'r')
    comment_re = re.compile("^#")
    srsdef_re = re.compile("^<([^>]*)>.* <>$")
    l = pjCat.readline()
    while len(l) != 0:
        if comment_re.search(l) is None:
            srsdef_mo = srsdef_re.match(l)
            srsdef_fn = os.path.join(targetDirectory, catName+srsdef_mo.group(1)+".js")
            if os.path.exists(srsdef_fn):
                os.remove(srsdef_fn)
        l = pjCat.readline()
    pjCat.close()

def _pjcat2js_make(rezDirectory,catName,targetDirectory):
    pjCatFilename = os.path.join(rezDirectory, catName)
    pjCat = open(pjCatFilename,'r')
    comment_re = re.compile("^#")
    srsdef_re = re.compile("^<([^>]*)> *(.*) <>$")
    l = pjCat.readline()
    while len(l) != 0:
        if comment_re.search(l) is None:
            srsdef_mo = srsdef_re.match(l)
            srsdef_fn = os.path.join(targetDirectory, catName+srsdef_mo.group(1)+".js")
            srsdef = 'Proj4js.defs["'+catName+':'+srsdef_mo.group(1)+'"]="'+srsdef_mo.group(2)+'";'
            file(srsdef_fn,'w').write(srsdef)
        l = pjCat.readline()
    pjCat.close()

def pjcat2js_clean(rezDirectory,targetDirectory):
    if not os.path.isdir(rezDirectory):
        return
    if not os.path.isdir(targetDirectory):
        return
    if os.path.abspath(rezDirectory) == '/':
        return
    if os.path.abspath(targetDirectory) == '/':
        return
    rezDirectory_name_len = len(rezDirectory)
    for root, dirs, filenames in os.walk(rezDirectory):
        if 'CVS' in dirs:
            dirs.remove('CVS')
        if '.svn' in dirs:
            dirs.remove('.svn')
        for filename in filenames:
            if not filename.endswith(SUFFIX_JAVASCRIPT) and not filename.startswith("."):
                filepath = os.path.join(root, filename)[rezDirectory_name_len+1:]
                filepath = filepath.replace("\\", "/")
                _pjcat2js_remove(rezDirectory,filepath,targetDirectory)

def pjcat2js_run(rezDirectory,targetDirectory):
    if not os.path.isdir(rezDirectory):
        return
    if not os.path.isdir(targetDirectory):
        return
    if os.path.abspath(rezDirectory) == '/':
        return
    if os.path.abspath(targetDirectory) == '/':
        return
    rezDirectory_name_len = len(rezDirectory)
    for root, dirs, filenames in os.walk(rezDirectory):
        if 'CVS' in dirs:
            dirs.remove('CVS')
        if '.svn' in dirs:
            dirs.remove('.svn')
        for filename in filenames:
            if not filename.endswith(SUFFIX_JAVASCRIPT) and not filename.startswith("."):
                filepath = os.path.join(root, filename)[rezDirectory_name_len+1:]
                filepath = filepath.replace("\\", "/")
                _pjcat2js_make(rezDirectory,filepath,targetDirectory)

