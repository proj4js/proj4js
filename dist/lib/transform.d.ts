/**
 * @param {import('./defs').ProjectionDefinition} source
 * @param {import('./defs').ProjectionDefinition} dest
 * @param {import('./core').TemplateCoordinates} point
 * @param {boolean} enforceAxis
 * @returns {import('./core').InterfaceCoordinates | undefined}
 */
export default function transform(source: import("./defs").ProjectionDefinition, dest: import("./defs").ProjectionDefinition, point: import("./core").TemplateCoordinates, enforceAxis: boolean): import("./core").InterfaceCoordinates | undefined;
