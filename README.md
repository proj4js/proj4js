#PROJ4JS

Proj4js is a JavaScript library to transform point coordinates from one coordinate system to another, including datum transformations.
Origionally a port of [PROJ.4](http://trac.osgeo.org/proj/) and [GCTCP C](http://edcftp.cr.usgs.gov/pub//software/gctpc) it is
a part of the [MetaCRS](http://wiki.osgeo.org/wiki/MetaCRS) group of projects.

##Installing

Depending on your preferences

```bash
npm install proj4js
bower install proj4js
jam install proj4js
```

or just manually grab the file `dist/proj4.js`

##Using

the basic signature is:

```javascript
proj4(projection1[, projection2, coordinates])
```

Projections can be proj or wkt strings, or a proj4.Proj object.

Coordinates may be proj4.Point objects, an object of the form `{x:x,y:y}`, or an array of the form `[x,y]`.

When all 3 arguments  are given, the result is that the coordinates are transformed from projection1 to projection 2. And returned in the same format that they were given in.

```javascript
var ourProjection = "+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs"
//this will be used for all the examples
```


If only 1 projection is given then it is assumed that it is being projected *from* WGS84 (projection1 is WGS84).

If no coordinates are given an object with two methods is returned, its methods are `forward` which projects from the first projection to the second and `reverse` which projects from the second to the first.

##Developing
to set up build tools make sure you have node installed and run `npm install`

to build run `grunt` if that doesn't work try:

```bash
npm install -g grunt-cli #you may need a sudo in front of that
```
