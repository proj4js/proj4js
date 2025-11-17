/**
 * @typedef {Object} LocalThis
 * @property {number} e
 * @property {number} lc
 * @property {number} rs
 * @property {number} cp
 * @property {number} n2
 * @property {number} xs
 * @property {number} ys
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    e: number;
    lc: number;
    rs: number;
    cp: number;
    n2: number;
    xs: number;
    ys: number;
    title: string;
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
    e: number;
    lc: number;
    rs: number;
    cp: number;
    n2: number;
    xs: number;
    ys: number;
};
