/**
 * @typedef {Object} LocalThis
 * @property {number} sin_p14
 * @property {number} cos_p14
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    sin_p14: number;
    cos_p14: number;
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
    sin_p14: number;
    cos_p14: number;
};
