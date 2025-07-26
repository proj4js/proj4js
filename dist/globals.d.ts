interface InterfaceCoordinates {
  x: number;
  y: number;
  z?: number;
  m?: number;
}

type TemplateCoordinates = number[] | InterfaceCoordinates;

interface DatumDefinition {
  datum_type: number;
  a: number;
  b: number;
  es: number;
  ep2: number;
}

interface ProjectionDefinition {
  title: string;
  projName?: string;
  ellps?: string;
  datum?: DatumDefinition;
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
  inverse<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean): T;
  forward<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean): T;
}

interface InterfaceProjection {
  init: () => void;
  name: string;
  names: string[];
  title: string;
  a: number;
  datum: DatumDefinition;
  b: number;
  rf: number;
  sphere: number;
  es: number;
  e: number;
  ep2: number;
  forward<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean): T;
  inverse<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean): T;
}

interface Converter {
  forward<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean): T;
  inverse<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean): T;
  oProj?: InterfaceProjection;
}
