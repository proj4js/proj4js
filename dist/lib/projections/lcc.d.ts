/**
 * @typedef {Object} LocalThis
 * @property {number} e
 * @property {number} ns
 * @property {number} f0
 * @property {number} rh
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    lat2: number;
    k0: number;
    x0: number;
    y0: number;
    e: number;
    ns: number;
    f0: number;
    rh: number;
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
    ns: number;
    f0: number;
    rh: number;
};
