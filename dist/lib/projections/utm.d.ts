/** @this {import('../defs.js').ProjectionDefinition} */
export function init(this: import("../defs.js").ProjectionDefinition): void;
export class init {
    lat0: number;
    long0: number;
    x0: number;
    y0: number;
    k0: number;
    forward: typeof import("./etmerc").forward;
    inverse: typeof import("./etmerc").inverse;
}
export const dependsOn: string;
export const names: string[];
declare namespace _default {
    export { init };
    export { names };
    export { dependsOn };
}
export default _default;
