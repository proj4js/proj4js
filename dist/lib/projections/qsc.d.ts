/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    x0: number;
    y0: number;
    lat0: number;
    long0: number;
    lat_ts: number;
    title: string;
    face: number;
    one_minus_f: number;
    one_minus_f_squared: number;
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
    face: number;
    x0: number;
    y0: number;
    es: number;
    one_minus_f: number;
    one_minus_f_squared: number;
};
