/**
 * @typedef {Object} LocalThis
 * @property {number} lambda0
 * @property {number} e
 * @property {number} R
 * @property {number} b0
 * @property {number} K
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    lambda0: number;
    e: number;
    R: number;
    alpha: number;
    b0: number;
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
    lambda0: number;
    e: number;
    R: number;
    b0: number;
    K: number;
};
