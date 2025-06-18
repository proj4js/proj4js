/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    phi1: number;
    en: number[];
    m1: number;
    am1: number;
    inverse: typeof e_inv;
    forward: typeof e_fwd;
    cphi1: number;
}
export const names: string[];
declare namespace _default {
    export { init };
    export { names };
}
export default _default;
export type LocalThis = {
    phi1: number;
    cphi1: number;
    es: number;
    en: Array<number>;
    m1: number;
    am1: number;
};
declare function e_inv(p: any): any;
declare function e_fwd(p: any): any;
