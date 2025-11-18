/**
 * @typedef {Object} LocalThis
 * @property {number} coslat0
 * @property {number} sinlat0
 * @property {number} ms1
 * @property {number} X0
 * @property {number} cosX0
 * @property {number} sinX0
 * @property {number} con
 * @property {number} cons
 * @property {number} e
 */
export function ssfn_(phit: any, sinphi: any, eccen: any): number;
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    x0: number;
    y0: number;
    lat0: number;
    long0: number;
    coslat0: number;
    sinlat0: number;
    k0: number;
    con: number;
    cons: number;
    ms1: number;
    X0: number;
    cosX0: number;
    sinX0: number;
}
export function forward(p: any): any;
export function inverse(p: any): any;
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
    export { ssfn_ };
}
export default _default;
export type LocalThis = {
    coslat0: number;
    sinlat0: number;
    ms1: number;
    X0: number;
    cosX0: number;
    sinX0: number;
    con: number;
    cons: number;
    e: number;
};
