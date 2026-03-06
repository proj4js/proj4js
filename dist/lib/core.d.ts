export default proj4;
export type InterfaceCoordinates = {
    x: number;
    y: number;
    z?: number;
    m?: number;
};
export type TemplateCoordinates = Array<number> | InterfaceCoordinates;
export type Converter = {
    forward: <T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T;
    inverse: <T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T;
    oProj?: proj;
};
export type PROJJSONDefinition = {
    $schema?: string;
    type: string;
    name?: string;
    id?: {
        authority: string;
        code: number;
    };
    scope?: string;
    area?: string;
    bbox?: {
        south_latitude: number;
        west_longitude: number;
        north_latitude: number;
        east_longitude: number;
    };
    components?: PROJJSONDefinition[];
    datum?: {
        type: string;
        name: string;
    };
    datum_ensemble?: {
        name: string;
        members: Array<{
            name: string;
            id?: {
                authority: string;
                code: number;
            };
        }>;
        ellipsoid?: {
            name: string;
            semi_major_axis: number;
            inverse_flattening?: number;
        };
        accuracy?: string;
        id?: {
            authority: string;
            code: number;
        };
    };
    coordinate_system?: {
        subtype: string;
        axis: Array<{
            name: string;
            abbreviation?: string;
            direction: string;
            unit: string;
        }>;
    };
    conversion?: {
        name: string;
        method: {
            name: string;
        };
        parameters: Array<{
            name: string;
            value: number;
            unit?: string;
        }>;
    };
    transformation?: {
        name: string;
        method: {
            name: string;
        };
        parameters: Array<{
            name: string;
            value: number;
            unit?: string;
            type?: string;
            file_name?: string;
        }>;
    };
};
/**
 * @overload
 * @param {string | PROJJSONDefinition | proj} toProj
 * @returns {Converter}
 */
declare function proj4(toProj: string | PROJJSONDefinition | proj): Converter;
/**
 * @overload
 * @param {string | PROJJSONDefinition | proj} fromProj
 * @param {string | PROJJSONDefinition | proj} toProj
 * @returns {Converter}
 */
declare function proj4(fromProj: string | PROJJSONDefinition | proj, toProj: string | PROJJSONDefinition | proj): Converter;
/**
 * @template {TemplateCoordinates} T
 * @overload
 * @param {string | PROJJSONDefinition | proj} toProj
 * @param {T} coord
 * @returns {T}
 */
declare function proj4<T extends TemplateCoordinates>(toProj: string | PROJJSONDefinition | proj, coord: T): T;
/**
 * @template {TemplateCoordinates} T
 * @overload
 * @param {string | PROJJSONDefinition | proj} fromProj
 * @param {string | PROJJSONDefinition | proj} toProj
 * @param {T} coord
 * @returns {T}
 */
declare function proj4<T extends TemplateCoordinates>(fromProj: string | PROJJSONDefinition | proj, toProj: string | PROJJSONDefinition | proj, coord: T): T;
import proj from './Proj';
