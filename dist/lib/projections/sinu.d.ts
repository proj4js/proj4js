/**
 * @typedef {Object} LocalThis
 * @property {Array<number>} en
 * @property {number} n
 * @property {number} m
 * @property {number} C_y
 * @property {number} C_x
 * @property {number} es
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    en: number[];
    n: number;
    m: number;
    es: number;
    C_y: number;
    C_x: number;
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
    en: Array<number>;
    n: number;
    m: number;
    C_y: number;
    C_x: number;
    es: number;
};
