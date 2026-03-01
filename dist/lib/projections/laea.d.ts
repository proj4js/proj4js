/**
 * Initialize the Lambert Azimuthal Equal Area projection
 * @this {import('../defs.js').ProjectionDefinition & LocalThis}
 */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    mode: number;
    qp: number;
    mmf: number;
    apa: number[];
    dd: number;
    rq: number;
    xmf: number;
    ymf: number;
    sinb1: number;
    cosb1: number;
    sinph0: number;
    cosph0: number;
}
export function forward(p: any): any;
export function inverse(p: any): any;
/**
 * @typedef {Object} LocalThis
 * @property {number} mode
 * @property {Array<number>} apa
 * @property {number} dd
 * @property {number} e
 * @property {number} es
 * @property {number} mmf
 * @property {number} rq
 * @property {number} qp
 * @property {number} sinb1
 * @property {number} cosb1
 * @property {number} ymf
 * @property {number} xmf
 * @property {number} sinph0
 * @property {number} cosph0
 */
export const S_POLE: number;
export const N_POLE: number;
export const EQUIT: number;
export const OBLIQ: number;
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
    export { S_POLE };
    export { N_POLE };
    export { EQUIT };
    export { OBLIQ };
}
export default _default;
export type LocalThis = {
    mode: number;
    apa: Array<number>;
    dd: number;
    e: number;
    es: number;
    mmf: number;
    rq: number;
    qp: number;
    sinb1: number;
    cosb1: number;
    ymf: number;
    xmf: number;
    sinph0: number;
    cosph0: number;
};
