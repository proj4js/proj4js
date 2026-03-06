/**
 * @typedef {Object} LocalThis
 * @property {1 | 0} flip_axis
 * @property {number} h
 * @property {number} radius_g_1
 * @property {number} radius_g
 * @property {number} radius_p
 * @property {number} radius_p2
 * @property {number} radius_p_inv2
 * @property {'ellipse'|'sphere'} shape
 * @property {number} C
 * @property {string} sweep
 * @property {number} es
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    flip_axis: number;
    h: number;
    radius_g_1: number;
    radius_g: number;
    C: number;
    radius_p: number;
    radius_p2: number;
    radius_p_inv2: number;
    shape: string;
    title: string;
}
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
}
export default _default;
export type LocalThis = {
    flip_axis: 1 | 0;
    h: number;
    radius_g_1: number;
    radius_g: number;
    radius_p: number;
    radius_p2: number;
    radius_p_inv2: number;
    shape: "ellipse" | "sphere";
    C: number;
    sweep: string;
    es: number;
};
declare function forward(p: any): any;
declare function inverse(p: any): any;
