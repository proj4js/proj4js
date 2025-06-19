export default parse;
/**
 * @param {string | import('./core').PROJJSONDefinition | import('./defs').ProjectionDefinition} code
 * @returns {import('./defs').ProjectionDefinition}
 */
declare function parse(code: string | import("./core").PROJJSONDefinition | import("./defs").ProjectionDefinition): import("./defs").ProjectionDefinition;
