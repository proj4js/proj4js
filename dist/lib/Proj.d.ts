export default Projection;
export type DatumDefinition = {
    /**
     * - The type of datum.
     */
    datum_type: number;
    /**
     * - Semi-major axis of the ellipsoid.
     */
    a: number;
    /**
     * - Semi-minor axis of the ellipsoid.
     */
    b: number;
    /**
     * - Eccentricity squared of the ellipsoid.
     */
    es: number;
    /**
     * - Second eccentricity squared of the ellipsoid.
     */
    ep2: number;
};
/**
 * @typedef {Object} DatumDefinition
 * @property {number} datum_type - The type of datum.
 * @property {number} a - Semi-major axis of the ellipsoid.
 * @property {number} b - Semi-minor axis of the ellipsoid.
 * @property {number} es - Eccentricity squared of the ellipsoid.
 * @property {number} ep2 - Second eccentricity squared of the ellipsoid.
 */
/**
 * @param {string | import('./core').PROJJSONDefinition | import('./defs').ProjectionDefinition} srsCode
 * @param {(errorMessage?: string, instance?: Projection) => void} [callback]
 */
declare function Projection(srsCode: string | import("./core").PROJJSONDefinition | import("./defs").ProjectionDefinition, callback?: (errorMessage?: string, instance?: Projection) => void): Projection;
declare class Projection {
    /**
     * @typedef {Object} DatumDefinition
     * @property {number} datum_type - The type of datum.
     * @property {number} a - Semi-major axis of the ellipsoid.
     * @property {number} b - Semi-minor axis of the ellipsoid.
     * @property {number} es - Eccentricity squared of the ellipsoid.
     * @property {number} ep2 - Second eccentricity squared of the ellipsoid.
     */
    /**
     * @param {string | import('./core').PROJJSONDefinition | import('./defs').ProjectionDefinition} srsCode
     * @param {(errorMessage?: string, instance?: Projection) => void} [callback]
     */
    constructor(srsCode: string | import("./core").PROJJSONDefinition | import("./defs").ProjectionDefinition, callback?: (errorMessage?: string, instance?: Projection) => void);
    /** @type {<T extends import('./core').TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} */
    forward: <T extends import("./core").TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T;
    /** @type {<T extends import('./core').TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} */
    inverse: <T extends import("./core").TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T;
    /** @type {function(): void} */
    init: () => void;
    /** @type {string} */
    name: string;
    /** @type {Array<string>} */
    names: Array<string>;
    /** @type {string} */
    title: string;
    a: any;
    b: any;
    rf: any;
    sphere: any;
    es: number;
    e: number;
    ep2: number;
    datum: DatumDefinition;
}
declare namespace Projection {
    export { projections };
}
import projections from './projections';
