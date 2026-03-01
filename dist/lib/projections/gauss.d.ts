/**
 * @typedef {Object} LocalThis
 * @property {number} rc
 * @property {number} C
 * @property {number} phic0
 * @property {number} ratexp
 * @property {number} K
 * @property {number} e
 * @property {number} es
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    rc: number;
    C: number;
    phic0: number;
    ratexp: number;
    K: number;
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
    rc: number;
    C: number;
    phic0: number;
    ratexp: number;
    K: number;
    e: number;
    es: number;
};
