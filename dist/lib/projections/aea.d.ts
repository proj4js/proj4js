/**
 * @typedef {Object} LocalThis
 * @property {number} temp
 * @property {number} es
 * @property {number} e3
 * @property {number} sin_po
 * @property {number} cos_po
 * @property {number} t1
 * @property {number} con
 * @property {number} ms1
 * @property {number} qs1
 * @property {number} t2
 * @property {number} ms2
 * @property {number} qs2
 * @property {number} t3
 * @property {number} qs0
 * @property {number} ns0
 * @property {number} c
 * @property {number} rh
 * @property {number} sin_phi
 * @property {number} cos_phi
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    temp: number;
    es: number;
    e3: number;
    sin_po: number;
    cos_po: number;
    t1: number;
    con: number;
    ms1: number;
    qs1: number;
    t2: number;
    ms2: number;
    qs2: number;
    t3: number;
    qs0: number;
    ns0: number;
    c: number;
    rh: number;
}
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function forward(this: import("../defs.js").ProjectionDefinition & LocalThis, p: any): any;
export class forward {
    /** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
    constructor(this: import("../defs.js").ProjectionDefinition & LocalThis, p: any);
    sin_phi: number;
    cos_phi: number;
}
export function inverse(p: any): any;
export function phi1z(eccent: any, qs: any): number;
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
    export { phi1z };
}
export default _default;
export type LocalThis = {
    temp: number;
    es: number;
    e3: number;
    sin_po: number;
    cos_po: number;
    t1: number;
    con: number;
    ms1: number;
    qs1: number;
    t2: number;
    ms2: number;
    qs2: number;
    t3: number;
    qs0: number;
    ns0: number;
    c: number;
    rh: number;
    sin_phi: number;
    cos_phi: number;
};
