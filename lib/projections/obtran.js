import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';

export function init() {
    this.x0 = this.x0 || 0;
    this.y0 = this.y0 || 0;
    this.lat0 = this.lat0 || 0;
    this.long0 = this.long0 || 0;
    this.lat_ts = this.lat_ts || 0;
    this.title = this.title || "General Oblique Transformation";
  
}

export function o_forward() {
    // spheroid


}

export function t_forward() {

}

export function o_inverse() {

}

export function t_inverse() {

}

export var names = ["obtran"];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};