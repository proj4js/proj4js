import krovak from './krovak';

/** @this {import('../defs.js').ProjectionDefinition & { modified: boolean }} */
export function init() {
  krovak.init.apply(this);
  this.modified = true;
  this.forward = krovak.forward;
  this.inverse = krovak.inverse;
}

export var names = ['Krovak Modified', 'Krovak Modified (North Orientated)', 'mod_krovak'];
export default {
  init: init,
  names: names
};
