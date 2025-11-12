/**
 * @typedef {Object} LocalThis
 * @property {number} es
 * @property {number} e
 * @property {number} k
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    es: number;
    x0: number;
    y0: number;
    e: number;
    k0: number;
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
    es: number;
    e: number;
    k: number;
};
