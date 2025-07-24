export default defs;
export type ProjectionDefinition = {
    title: string;
    projName?: string;
    ellps?: string;
    datum?: import("./Proj.js").DatumDefinition;
    datumName?: string;
    rf?: number;
    lat0?: number;
    lat1?: number;
    lat2?: number;
    lat_ts?: number;
    long0?: number;
    long1?: number;
    long2?: number;
    alpha?: number;
    longc?: number;
    x0?: number;
    y0?: number;
    k0?: number;
    a?: number;
    b?: number;
    R_A?: true;
    zone?: number;
    utmSouth?: true;
    datum_params?: string | Array<number>;
    to_meter?: number;
    units?: string;
    from_greenwich?: number;
    datumCode?: string;
    nadgrids?: string;
    axis?: string;
    sphere?: boolean;
    rectified_grid_angle?: number;
    approx?: boolean;
    inverse: <T extends import("./core").TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T;
    forward: <T extends import("./core").TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T;
};
/**
 * @overload
 * @param {string} name
 * @param {string|ProjectionDefinition|import('./core.js').PROJJSONDefinition} projection
 * @returns {void}
 */
declare function defs(name: string, projection: string | ProjectionDefinition | import("./core.js").PROJJSONDefinition): void;
/**
 * @overload
 * @param {Array<[string, string]>} name
 * @returns {Array<ProjectionDefinition|undefined>}
 */
declare function defs(name: Array<[string, string]>): Array<ProjectionDefinition | undefined>;
/**
 * @overload
 * @param {string} name
 * @returns {ProjectionDefinition}
 */
declare function defs(name: string): ProjectionDefinition;
