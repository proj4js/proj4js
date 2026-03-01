/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    x0: number;
    y0: number;
    long0: number;
    title: string;
    isIdentity: boolean;
    obliqueProjection: import("../defs.js").ProjectionDefinition;
    lamp: number;
    cphip: number;
    sphip: number;
    projectionType: {
        forward: typeof forwardOblique;
        inverse: typeof inverseOblique;
    };
}
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function forward(this: import("../defs.js").ProjectionDefinition & LocalThis, p: any): any;
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function inverse(this: import("../defs.js").ProjectionDefinition & LocalThis, p: any): any;
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
}
export default _default;
export type LocalThis = {
    lamp: number;
    cphip: number;
    sphip: number;
    projectionType: any;
    o_proj: string | undefined;
    o_lon_p: string | undefined;
    o_lat_p: string | undefined;
    o_alpha: string | undefined;
    o_lon_c: string | undefined;
    o_lat_c: string | undefined;
    o_lon_1: string | undefined;
    o_lat_1: string | undefined;
    o_lon_2: string | undefined;
    o_lat_2: string | undefined;
    oLongP: number | undefined;
    oLatP: number | undefined;
    oAlpha: number | undefined;
    oLongC: number | undefined;
    oLatC: number | undefined;
    oLong1: number | undefined;
    oLat1: number | undefined;
    oLong2: number | undefined;
    oLat2: number | undefined;
    isIdentity: boolean;
    obliqueProjection: import("..").Converter;
};
/**
 * Forward (lng, lat) to (x, y) for oblique case
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
declare function forwardOblique(self: import("../defs.js").ProjectionDefinition & LocalThis, lp: {
    x: number;
    y: number;
}): {
    x: number;
    y: number;
};
/**
 * Inverse (x, y) to (lng, lat) for oblique case
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
declare function inverseOblique(self: import("../defs.js").ProjectionDefinition & LocalThis, lp: {
    x: number;
    y: number;
}): {
    x: number;
    y: number;
};
