/**
 * @typedef {Object} LocalThis
 * @property {number} R - Radius of the Earth
 */
/**
 * Initialize the Van Der Grinten projection
 * @this {import('../defs.js').ProjectionDefinition & LocalThis}
 */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    R: number;
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
    /**
     * - Radius of the Earth
     */
    R: number;
};
