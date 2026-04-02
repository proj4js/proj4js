/**
 * Initialize the Oblique Mercator  projection
 * @this {import('../defs.js').ProjectionDefinition & LocalThis}
 */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    no_off: boolean;
    no_rot: boolean;
    B: number;
    A: number;
    E: number;
    lam0: any;
    singam: number;
    cosgam: number;
    sinrot: number;
    cosrot: number;
    rB: number;
    ArB: number;
    BrA: number;
    u_0: number;
    v_pole_n: number;
    v_pole_s: number;
}
export function forward(p: any): {
    x: any;
    y: any;
};
export function inverse(p: any): {
    x: number;
    y: any;
};
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
}
export default _default;
export type LocalThis = {
    no_off: boolean;
    no_rot: boolean;
    rectified_grid_angle: number;
    es: number;
    A: number;
    B: number;
    E: number;
    e: number;
    lam0: number;
    singam: number;
    cosgam: number;
    sinrot: number;
    cosrot: number;
    rB: number;
    ArB: number;
    BrA: number;
    u_0: number;
    v_pole_n: number;
    v_pole_s: number;
};
