define(function(require, exports) {
  var sinu = require('proj4/projCode/sinu');
  exports.dependsOn = 'sinu';
  exports.init = function() {
		/* force spherical handling */
		this.sphere = true;
		this.b = this.a;

		/* constants from proj4  implementation */
		this.m = 1.0;
		this.n = 2.570796326794896619231321691; /* 1 + pi/2 */
		this.es = 0;

		/* from sinu.js */
		this.C_y = Math.sqrt((this.m + 1.0) / this.n);
		this.C_x = this.C_y / (this.m + 1.0);

		this.forward = sinu.forward;
		this.inverse = sinu.inverse;
  };
  exports.names = ["Eckert_VI", "eck6"];
});
