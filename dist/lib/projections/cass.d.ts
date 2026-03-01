/**
 * @typedef {Object} LocalThis
 * @property {number} es
 * @property {number} e0
 * @property {number} e1
 * @property {number} e2
 * @property {number} e3
 * @property {number} ml0
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    e0: number;
    e1: number;
    e2: number;
    e3: number;
    ml0: number;
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
    e0: number;
    e1: number;
    e2: number;
    e3: number;
    ml0: number;
};
