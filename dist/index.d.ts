// Legacy type definitions for CommonJS support
import proj4 from './lib/';
export type { ProjectionDefinition, TemplateCoordinates, InterfaceCoordinates, Converter, DatumDefinition } from './lib/';
//@ts-ignore
export = proj4;
export as namespace proj4;
