/*******************************************************************************
NAME                    VAN DER GRINTEN 

PURPOSE:  Transforms input Easting and Northing to longitude and
    latitude for the Van der Grinten projection.  The
    Easting and Northing must be in meters.  The longitude
    and latitude values will be returned in radians.

PROGRAMMER              DATE            
----------              ----           
T. Mittan    March, 1993

This function was adapted from the Van Der Grinten projection code
(FORTRAN) in the General Cartographic Transformation Package software
which is available from the U.S. Geological Survey National Mapping Division.
 
ALGORITHM REFERENCES

1.  "New Equal-Area Map Projections for Noncircular Regions", John P. Snyder,
    The American Cartographer, Vol 15, No. 4, October 1988, pp. 341-355.

2.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

3.  "Software Documentation for GCTP General Cartographic Transformation
    Package", U.S. Geological Survey National Mapping Division, May 1982.
*******************************************************************************/

proj4.Proj.vandg = {

/* Initialize the Van Der Grinten projection
  ----------------------------------------*/
  init: function() {
    //this.R = 6370997.0; //Radius of earth
    this.R = this.a;
  },

  forward: function(p) {

    var lon=p.x;
    var lat=p.y;

    /* Forward equations
    -----------------*/
    var dlon = proj4.common.adjust_lon(lon - this.long0);
    var x,y;

    if (Math.abs(lat) <= proj4.common.EPSLN) {
      x = this.x0  + this.R * dlon;
      y = this.y0;
    }
    var theta = proj4.common.asinz(2.0 * Math.abs(lat / proj4.common.PI));
    if ((Math.abs(dlon) <= proj4.common.EPSLN) || (Math.abs(Math.abs(lat) - proj4.common.HALF_PI) <= proj4.common.EPSLN)) {
      x = this.x0;
      if (lat >= 0) {
        y = this.y0 + proj4.common.PI * this.R * Math.tan(0.5 * theta);
      } else {
        y = this.y0 + proj4.common.PI * this.R * - Math.tan(0.5 * theta);
      }
      //  return(OK);
    }
    var al = 0.5 * Math.abs((proj4.common.PI / dlon) - (dlon / proj4.common.PI));
    var asq = al * al;
    var sinth = Math.sin(theta);
    var costh = Math.cos(theta);

    var g = costh / (sinth + costh - 1.0);
    var gsq = g * g;
    var m = g * (2.0 / sinth - 1.0);
    var msq = m * m;
    var con = proj4.common.PI * this.R * (al * (g - msq) + Math.sqrt(asq * (g - msq) * (g - msq) - (msq + asq) * (gsq - msq))) / (msq + asq);
    if (dlon < 0) {
      con = -con;
    }
    x = this.x0 + con;
    //con = Math.abs(con / (proj4.common.PI * this.R));
    var q =asq+g;
    con=proj4.common.PI*this.R*(m*q-al*Math.sqrt((msq+asq)*(asq+1.0)-q*q))/(msq+asq);
    if (lat >= 0) {
      //y = this.y0 + proj4.common.PI * this.R * Math.sqrt(1.0 - con * con - 2.0 * al * con);
      y=this.y0 + con;
    } else {
      //y = this.y0 - proj4.common.PI * this.R * Math.sqrt(1.0 - con * con - 2.0 * al * con);
      y=this.y0 - con;
    }
    p.x = x;
    p.y = y;
    return p;
  },

/* Van Der Grinten inverse equations--mapping x,y to lat/long
  ---------------------------------------------------------*/
  inverse: function(p) {
    var lon, lat;
    var xx,yy,xys,c1,c2,c3;
    var a1;
    var m1;
    var con;
    var th1;
    var d;

    /* inverse equations
    -----------------*/
    p.x -= this.x0;
    p.y -= this.y0;
    con = proj4.common.PI * this.R;
    xx = p.x / con;
    yy =p.y / con;
    xys = xx * xx + yy * yy;
    c1 = -Math.abs(yy) * (1.0 + xys);
    c2 = c1 - 2.0 * yy * yy + xx * xx;
    c3 = -2.0 * c1 + 1.0 + 2.0 * yy * yy + xys * xys;
    d = yy * yy / c3 + (2.0 * c2 * c2 * c2 / c3 / c3 / c3 - 9.0 * c1 * c2 / c3 /c3) / 27.0;
    a1 = (c1 - c2 * c2 / 3.0 / c3) / c3;
    m1 = 2.0 * Math.sqrt( -a1 / 3.0);
    con = ((3.0 * d) / a1) / m1;
    if (Math.abs(con) > 1.0) {
      if (con >= 0.0) {
        con = 1.0;
      } else {
        con = -1.0;
      }
    }
    th1 = Math.acos(con) / 3.0;
    if (p.y >= 0) {
      lat = (-m1 *Math.cos(th1 + proj4.common.PI / 3.0) - c2 / 3.0 / c3) * proj4.common.PI;
    } else {
      lat = -(-m1 * Math.cos(th1 + proj4.common.PI / 3.0) - c2 / 3.0 / c3) * proj4.common.PI;
    }

    if (Math.abs(xx) < proj4.common.EPSLN) {
      lon = this.long0;
    } else {
      lon = proj4.common.adjust_lon(this.long0 + proj4.common.PI * (xys - 1.0 + Math.sqrt(1.0 + 2.0 * (xx * xx - yy * yy) + xys * xys)) / 2.0 / xx);
    }

    p.x=lon;
    p.y=lat;
    return p;
  }
};
