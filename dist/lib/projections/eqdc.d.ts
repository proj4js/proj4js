/**
 * @typedef {Object} LocalThis
 * @property {number} temp
 * @property {number} es
 * @property {number} e
 * @property {number} e0
 * @property {number} e1
 * @property {number} e2
 * @property {number} e3
 * @property {number} sin_phi
 * @property {number} cos_phi
 * @property {number} ms1
 * @property {number} ml1
 * @property {number} ms2
 * @property {number} ml2
 * @property {number} ns
 * @property {number} g
 * @property {number} ml0
 * @property {number} rh
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    lat2: number;
    temp: number;
    es: number;
    e: number;
    e0: number;
    e1: number;
    e2: number;
    e3: number;
    sin_phi: number;
    cos_phi: number;
    ms1: number;
    ml1: number;
    ns: number;
    ms2: number;
    ml2: number;
    g: number;
    ml0: number;
    rh: number;
}
export function forward(p: any): any;
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
    temp: number;
    es: number;
    e: number;
    e0: number;
    e1: number;
    e2: number;
    e3: number;
    sin_phi: number;
    cos_phi: number;
    ms1: number;
    ml1: number;
    ms2: number;
    ml2: number;
    ns: number;
    g: number;
    ml0: number;
    rh: number;
};
