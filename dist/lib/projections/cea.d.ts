/**
 * @typedef {Object} LocalThis
 * @property {number} e
 */
/**
  reference:
    "Cartographic Projection Procedures for the UNIX Environment-
    A User's Manual" by Gerald I. Evenden,
    USGS Open File Report 90-284and Release 4 Interim Reports (2003)
  @this {import('../defs.js').ProjectionDefinition & LocalThis}
*/
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    k0: number;
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
};
