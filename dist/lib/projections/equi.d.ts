/**
 * @typedef {Object} LocalThis
 * @property {number} t1
 * @property {number} t2
 */
/** @this {import('../defs.js').ProjectionDefinition} */
export function init(this: import("../defs.js").ProjectionDefinition): void;
export class init {
    x0: number;
    y0: number;
    lat0: number;
    long0: number;
}
/**
 * Equirectangular forward equations--mapping lat,long to x,y
 * @this {import('../defs.js').ProjectionDefinition & LocalThis}
 */
export function forward(this: import("../defs.js").ProjectionDefinition & LocalThis, p: any): any;
export class forward {
    /**
     * Equirectangular forward equations--mapping lat,long to x,y
     * @this {import('../defs.js').ProjectionDefinition & LocalThis}
     */
    constructor(this: import("../defs.js").ProjectionDefinition & LocalThis, p: any);
    t1: number;
    t2: number;
}
export function inverse(p: any): void;
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
}
export default _default;
export type LocalThis = {
    t1: number;
    t2: number;
};
