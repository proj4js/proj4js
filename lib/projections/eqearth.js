/**
 * Copyright 2018 Bernie Jenny, Monash University, Melbourne, Australia.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Equal Earth is a projection inspired by the Robinson projection, but unlike
 * the Robinson projection retains the relative size of areas. The projection
 * was designed in 2018 by Bojan Savric, Tom Patterson and Bernhard Jenny.
 *
 * Publication:
 * Bojan Savric, Tom Patterson & Bernhard Jenny (2018). The Equal Earth map
 * projection, International Journal of Geographical Information Science,
 * DOI: 10.1080/13658816.2018.1504949
 *
 * Code released August 2018
 * Ported to JavaScript and adapted for mapshaper-proj by Matthew Bloch August 2018
 * Modified for proj4js by Andreas Hocevar by Andreas Hocevar March 2024
 */

import adjust_lon from '../common/adjust_lon';

var A1 = 1.340264,
  A2 = -0.081106,
  A3 = 0.000893,
  A4 = 0.003796,
  M = Math.sqrt(3) / 2.0;

export function init() {
  this.es = 0;
  this.long0 = this.long0 !== undefined ? this.long0 : 0;
}

export function forward(p) {
  var lam = adjust_lon(p.x - this.long0);
  var phi = p.y;
  var paramLat = Math.asin(M * Math.sin(phi)),
    paramLatSq = paramLat * paramLat,
    paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
  p.x = lam * Math.cos(paramLat)
    / (M * (A1 + 3 * A2 * paramLatSq + paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq)));
  p.y = paramLat * (A1 + A2 * paramLatSq + paramLatPow6 * (A3 + A4 * paramLatSq));

  p.x = this.a * p.x + this.x0;
  p.y = this.a * p.y + this.y0;
  return p;
}

export function inverse(p) {
  p.x = (p.x - this.x0) / this.a;
  p.y = (p.y - this.y0) / this.a;

  var EPS = 1e-9,
    NITER = 12,
    paramLat = p.y,
    paramLatSq, paramLatPow6, fy, fpy, dlat, i;

  for (i = 0; i < NITER; ++i) {
    paramLatSq = paramLat * paramLat;
    paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
    fy = paramLat * (A1 + A2 * paramLatSq + paramLatPow6 * (A3 + A4 * paramLatSq)) - p.y;
    fpy = A1 + 3 * A2 * paramLatSq + paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq);
    paramLat -= dlat = fy / fpy;
    if (Math.abs(dlat) < EPS) {
      break;
    }
  }
  paramLatSq = paramLat * paramLat;
  paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
  p.x = M * p.x * (A1 + 3 * A2 * paramLatSq + paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq))
    / Math.cos(paramLat);
  p.y = Math.asin(Math.sin(paramLat) / M);

  p.x = adjust_lon(p.x + this.long0);
  return p;
}

export var names = ['eqearth', 'Equal Earth', 'Equal_Earth'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
