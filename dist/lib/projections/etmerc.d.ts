/**
 * @typedef {Object} LocalThis
 * @property {number} es
 * @property {Array<number>} cbg
 * @property {Array<number>} cgb
 * @property {Array<number>} utg
 * @property {Array<number>} gtu
 * @property {number} Qn
 * @property {number} Zb
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    forward: typeof import("../projections/tmerc").forward;
    inverse: typeof import("../projections/tmerc").inverse;
    x0: number;
    y0: number;
    long0: number;
    lat0: number;
    cgb: number[];
    cbg: number[];
    utg: number[];
    gtu: number[];
    Qn: number;
    Zb: number;
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
    cbg: Array<number>;
    cgb: Array<number>;
    utg: Array<number>;
    gtu: Array<number>;
    Qn: number;
    Zb: number;
};
