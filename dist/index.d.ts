import proj4 from "./lib/index";
export type { ProjectionDefinition } from "./lib/defs";
export type { Converter, InterfaceCoordinates, TemplateCoordinates } from "./lib/core";
export type { DatumDefinition } from "./lib/Proj";
export default proj4;
export as namespace proj4;