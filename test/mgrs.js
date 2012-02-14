(function() {
    assert(typeof Proj4js.util.MGRS, "object", "MGRS available in the Proj4js.util namespace");
    assert(typeof Proj4js.Point.fromMGRS, "function", "fromMGRS method added to Proj4js.Point prototype");
    assert(typeof Proj4js.Point.prototype.toMGRS, "function", "toMGRS method added to Proj4js.Point prototype");

    // Conversions cross-tested with http://geographiclib.sourceforge.net/cgi-bin/GeoConvert
    var mgrs, point;
    mgrs = "33UXP04";
    point = Proj4js.Point.fromMGRS(mgrs);
    assert(point.x.toPrecision(7), "16.41450", "Longitude of point from MGRS correct.");
    assert(point.y.toPrecision(7), "48.24949", "Latitude of point from MGRS correct.");
    assert(point.toMGRS(), "33UXP0500444998", "MGRS reference with highest accuracy correct.");
    assert(point.toMGRS(1), mgrs, "MGRS reference with 1-digit accuracy correct.");
    mgrs = "24XWT783908"; // near UTM zone border, so there are two ways to reference this
    point = Proj4js.Point.fromMGRS(mgrs);
    assert(point.x.toPrecision(7), "-32.66433", "Longitude of point from MGRS correct.");
    assert(point.y.toPrecision(7), "83.62778", "Latitude of point from MGRS correct.");
    assert(point.toMGRS(3), "25XEN041865", "MGRS reference with 3-digit accuracy correct.");


    function assert(got, expected, msg) {
        if (got == expected) {
            document.write('<div>' + msg + '</div>');
        } else {
            document.write('<div style="background-color:red">' + msg + ' - got ' + got + ', but expected ' + expected + '</div>');
        }
    }
})();
