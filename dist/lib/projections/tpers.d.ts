/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    mode: number;
    sinph0: number;
    cosph0: number;
    pn1: number;
    p: number;
    rp: number;
    h1: number;
    pfact: number;
    es: number;
    cg: number;
    sg: number;
    cw: number;
    sw: number;
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
    mode: number;
    sinph0: number;
    cosph0: number;
    pn1: number;
    h: number;
    rp: number;
    p: number;
    h1: number;
    pfact: number;
    es: number;
    tilt: number;
    azi: number;
    cg: number;
    sg: number;
    cw: number;
    sw: number;
};
