export function init(): void;
export class init {
    A: number[];
    B_re: number[];
    B_im: number[];
    C_re: number[];
    C_im: number[];
    D: number[];
}
/**
    New Zealand Map Grid Forward  - long/lat to x/y
    long/lat in radians
  */
export function forward(p: any): any;
/**
    New Zealand Map Grid Inverse  -  x/y to long/lat
  */
export function inverse(p: any): any;
/**
 * iterations: Number of iterations to refine inverse transform.
 *     0 -> km accuracy
 *     1 -> m accuracy -- suitable for most mapping applications
 *     2 -> mm accuracy
 */
export const iterations: number;
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
}
export default _default;
