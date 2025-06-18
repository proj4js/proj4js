/**
 * @typedef {Object} LocalThis
 * @property {number} sinc0
 * @property {number} cosc0
 * @property {number} R2
 * @property {number} rc
 * @property {number} phic0
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    sinc0: number;
    cosc0: number;
    R2: number;
    title: string;
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
    sinc0: number;
    cosc0: number;
    R2: number;
    rc: number;
    phic0: number;
};
