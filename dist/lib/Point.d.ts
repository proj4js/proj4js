export default Point;
/**
 * @deprecated v3.0.0 - use proj4.toPoint instead
 * @param {number | import('./core').TemplateCoordinates | string} x
 * @param {number} [y]
 * @param {number} [z]
 */
declare function Point(x: number | import("./core").TemplateCoordinates | string, y?: number, z?: number): Point;
declare class Point {
    /**
     * @deprecated v3.0.0 - use proj4.toPoint instead
     * @param {number | import('./core').TemplateCoordinates | string} x
     * @param {number} [y]
     * @param {number} [z]
     */
    constructor(x: number | import("./core").TemplateCoordinates | string, y?: number, z?: number);
    x: string | number;
    y: number;
    z: number;
    toMGRS(accuracy: any): any;
}
declare namespace Point {
    function fromMGRS(mgrsStr: any): Point;
}
