export function compareDatums(source: any, dest: any): boolean;
export function geodeticToGeocentric(p: any, es: any, a: any): {
    x: number;
    y: number;
    z: any;
};
export function geocentricToGeodetic(p: any, es: any, a: any, b: any): {
    x: any;
    y: any;
    z: any;
};
/****************************************************************/
/** point object, nothing fancy, just allows values to be
    passed back and forth by reference rather than by value.
    Other point classes may be used as long as they have
    x and y properties, which will get modified in the transform method.
*/
export function geocentricToWgs84(p: any, datum_type: any, datum_params: any): {
    x: any;
    y: any;
    z: any;
};
/****************************************************************/
export function geocentricFromWgs84(p: any, datum_type: any, datum_params: any): {
    x: number;
    y: number;
    z: number;
};
