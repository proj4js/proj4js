/**
 * @typedef {Object} LocalThis
 * @property {number} es
 * @property {Array<number>} en
 * @property {number} ml0
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    x0: number;
    y0: number;
    long0: number;
    lat0: number;
    en: number[];
    ml0: number;
}
/**
    Transverse Mercator Forward  - long/lat to x/y
    long/lat in radians
  */
export function forward(p: any): any;
/**
    Transverse Mercator Inverse  -  x/y to long/lat
  */
export function inverse(p: any): any;
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
}
export default _default;
export type LocalThis = {
    es: number;
    en: Array<number>;
    ml0: number;
};
