define(function(require) {
  var common = require('proj4/common');
  return function(srs, inverse, point) {
    var i, l, gi, ct, epsilon;
    if (srs.grids === null || srs.grids.length === 0) {
      return -38; //are these error codes?
    }
    var input = {
      "x": point.x,
      "y": point.y
    };
    var output = {
      "x": Number.NaN,
      "y": Number.NaN
    };
    /* keep trying till we find a table that works */
    var onlyMandatoryGrids = false;
    for (i = 0, l = srs.grids.length; i < l; i++) {
      gi = srs.grids[i];
      onlyMandatoryGrids = gi.mandatory;
      ct = gi.grid;
      if (ct === null) {
        if (gi.mandatory) {
          this.reportError("unable to find '" + gi.name + "' grid.");
          return -48; //are these error codes?
        }
        continue; //optional grid
      }
      /* skip tables that don't match our point at all.  */
      epsilon = (Math.abs(ct.del[1]) + Math.abs(ct.del[0])) / 10000;
      if (ct.ll[1] - epsilon > input.y || ct.ll[0] - epsilon > input.x || ct.ll[1] + (ct.lim[1] - 1) * ct.del[1] + epsilon < input.y || ct.ll[0] + (ct.lim[0] - 1) * ct.del[0] + epsilon < input.x) {
        continue;
      }
      /* If we have child nodes, check to see if any of them apply. */
      /* TODO : only plain grid has been implemented ... */
      /* we found a more refined child node to use */
      /* load the grid shift info if we don't have it. */
      /* TODO : proj4.grids pre-loaded (as they can be huge ...) */
      /* skip numerical computing error when "null" grid (identity grid): */
      if (gi.name === "null") {
        output.x = input.x;
        output.y = input.y;
      }
      else {
        output = common.nad_cvt(input, inverse, ct);
      }
      if (!isNaN(output.x)) {
        break;
      }
    }
    if (isNaN(output.x)) {
      if (!onlyMandatoryGrids) {
        this.reportError("failed to find a grid shift table for location '" + input.x * common.R2D + " " + input.y * common.R2D + " tried: '" + srs.nadgrids + "'");
        return -48;
      }
      return -1; //FIXME: no shift applied ...
    }
    point.x = output.x;
    point.y = output.y;
    return 0;
  };
});
