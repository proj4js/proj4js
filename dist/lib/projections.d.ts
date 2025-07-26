/**
 * @param {import('./Proj').default} proj
 * @param {number} i
 */
export function add(proj: import("./Proj").default, i: number): any;
export function getNormalizedProjName(n: any): any;
/**
 * Get a projection by name.
 * @param {string} name
 * @returns {import('./Proj').default|false}
 */
export function get(name: string): import("./Proj").default | false;
export function start(): void;
declare namespace _default {
    export { start };
    export { add };
    export { get };
}
export default _default;
