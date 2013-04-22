goog.provide('Proj4js.Proj.somerc');

/*******************************************************************************
NAME                       SWISS OBLIQUE MERCATOR

PURPOSE:	Swiss projection.
WARNING:  X and Y are inverted (weird) in the swiss coordinate system. Not
   here, since we want X to be horizontal and Y vertical.

ALGORITHM REFERENCES
1. "Formules et constantes pour le Calcul pour la
 projection cylindrique conforme à axe oblique et pour la transformation entre
 des systèmes de référence".
 http://www.swisstopo.admin.ch/internet/swisstopo/fr/home/topics/survey/sys/refsys/switzerland.parsysrelated1.31216.downloadList.77004.DownloadFile.tmp/swissprojectionfr.pdf

*******************************************************************************/

/**
 * @param {Proj4js.Proj} proj
 * @implements {Proj4js.Proj.transform}
 * @constructor
 */
Proj4js.Proj.somerc = function(proj) {
  	  this.proj = proj;
  
    var phy0 = this.proj.lat0;
    this.proj.lambda0 = this.proj.long0;
    var sinPhy0 = Math.sin(phy0);
    var semiMajorAxis = this.proj.a;
    var invF = this.proj.rf;
    var flattening = 1 / invF;
    var e2 = 2 * flattening - Math.pow(flattening, 2);
    var e = this.proj.e = Math.sqrt(e2);
    this.proj.R = this.proj.k0 * semiMajorAxis * Math.sqrt(1 - e2) / (1 - e2 * Math.pow(sinPhy0, 2.0));
    this.proj.alpha = Math.sqrt(1 + e2 / (1 - e2) * Math.pow(Math.cos(phy0), 4.0));
    this.proj.b0 = Math.asin(sinPhy0 / this.proj.alpha);
    this.proj.K = Math.log(Math.tan(Math.PI / 4.0 + this.proj.b0 / 2.0))
            - this.proj.alpha
            * Math.log(Math.tan(Math.PI / 4.0 + phy0 / 2.0))
            + this.proj.alpha
            * e / 2
            * Math.log((1 + e * sinPhy0)
            / (1 - e * sinPhy0));
};

/**
 *  -----------------------------------------------------------------
 * @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} p the lat long input value
 * @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the point x,y transformed.
 */
Proj4js.Proj.somerc.prototype.forward = function(p) {
    var Sa1 = Math.log(Math.tan(Math.PI / 4.0 - p.y / 2.0));
    var Sa2 = this.proj.e / 2.0
            * Math.log((1 + this.proj.e * Math.sin(p.y))
            / (1 - this.proj.e * Math.sin(p.y)));
    var S = -this.proj.alpha * (Sa1 + Sa2) + this.proj.K;

        // spheric latitude
    var b = 2.0 * (Math.atan(Math.exp(S)) - Math.PI / 4.0);

        // spheric longitude
    var I = this.proj.alpha * (p.x - this.proj.lambda0);

        // psoeudo equatorial rotation
    var rotI = Math.atan(Math.sin(I)
            / (Math.sin(this.proj.b0) * Math.tan(b) +
               Math.cos(this.proj.b0) * Math.cos(I)));

    var rotB = Math.asin(Math.cos(this.proj.b0) * Math.sin(b) -
                         Math.sin(this.proj.b0) * Math.cos(b) * Math.cos(I));

    p.y = this.proj.R / 2.0
            * Math.log((1 + Math.sin(rotB)) / (1 - Math.sin(rotB)))
            + this.proj.y0;
    p.x = this.proj.R * rotI + this.proj.x0;
    return p;
};

/**
 *  -----------------------------------------------------------------
* @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} p the x,y input value
* @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the lat long point transformed.
*/
Proj4js.Proj.somerc.prototype.inverse = function(p) {
    var Y = p.x - this.proj.x0;
    var X = p.y - this.proj.y0;

    var rotI = Y / this.proj.R;
    var rotB = 2 * (Math.atan(Math.exp(X / this.proj.R)) - Math.PI / 4.0);

    var b = Math.asin(Math.cos(this.proj.b0) * Math.sin(rotB)
            + Math.sin(this.proj.b0) * Math.cos(rotB) * Math.cos(rotI));
    var I = Math.atan(Math.sin(rotI)
            / (Math.cos(this.proj.b0) * Math.cos(rotI) - Math.sin(this.proj.b0)
            * Math.tan(rotB)));

    var lambda = this.proj.lambda0 + I / this.proj.alpha;

    var S = 0.0;
    var phy = b;
    var prevPhy = -1000.0;
    var iteration = 0;
    while (Math.abs(phy - prevPhy) > 0.0000001)
    {
      if (++iteration > 20)
      {
        Proj4js.reportError("omercFwdInfinity");
        return null; 
      }
      //S = Math.log(Math.tan(Math.PI / 4.0 + phy / 2.0));
      S = 1.0
              / this.proj.alpha
              * (Math.log(Math.tan(Math.PI / 4.0 + b / 2.0)) - this.proj.K)
              + this.proj.e
              * Math.log(Math.tan(Math.PI / 4.0
              + Math.asin(this.proj.e * Math.sin(phy))
              / 2.0));
      prevPhy = phy;
      phy = 2.0 * Math.atan(Math.exp(S)) - Math.PI / 2.0;
    }

    p.x = lambda;
    p.y = phy;
    return p;
};
