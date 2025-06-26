/**
 * @overload
 * @param {string} key - The key to associate with the loaded grid.
 * @param {ArrayBuffer} data - The NTv2 grid data as an ArrayBuffer.
 * @param {NTV2GridOptions} [options] - Optional parameters for loading the grid.
 * @returns {NADGrid} - The loaded NAD grid information.
 */
export default function nadgrid(key: string, data: ArrayBuffer, options?: NTV2GridOptions): NADGrid;
/**
 * @overload
 * @param {string} key - The key to associate with the loaded grid.
 * @param {GeoTIFF} data - The GeoTIFF instance to read the grid from.
 * @returns {{ready: Promise<NADGrid>}} - A promise that resolves to the loaded grid information.
 */
export default function nadgrid(key: string, data: GeoTIFF): {
    ready: Promise<NADGrid>;
};
/**
 * Given a proj4 value for nadgrids, return an array of loaded grids
 * @param {string} nadgrids A comma-separated list of grid names, optionally prefixed with '@' to indicate optional grids.
 * @returns
 */
export function getNadgrids(nadgrids: string): NadgridInfo[];
export type NadgridInfo = {
    /**
     * The name of the NAD grid or 'null' if not specified.
     */
    name: string;
    /**
     * Indicates if the grid is mandatory (true) or optional (false).
     */
    mandatory: boolean;
    /**
     * The loaded NAD grid object, or null if not loaded or not applicable.
     */
    grid: any;
    /**
     * True if the grid is explicitly 'null', otherwise false.
     */
    isNull: boolean;
};
export type NTV2GridOptions = {
    /**
     * Whether to include error fields in the subgrids.
     */
    includeErrorFields?: boolean;
};
export type NadgridHeader = {
    /**
     * Number of fields in the header.
     */
    nFields?: number;
    /**
     * Number of fields in each subgrid header.
     */
    nSubgridFields?: number;
    /**
     * Number of subgrids in the file.
     */
    nSubgrids: number;
    /**
     * Type of shift (e.g., "SECONDS").
     */
    shiftType?: string;
    /**
     * Source ellipsoid semi-major axis.
     */
    fromSemiMajorAxis?: number;
    /**
     * Source ellipsoid semi-minor axis.
     */
    fromSemiMinorAxis?: number;
    /**
     * Target ellipsoid semi-major axis.
     */
    toSemiMajorAxis?: number;
    /**
     * Target ellipsoid semi-minor axis.
     */
    toSemiMinorAxis?: number;
};
export type Subgrid = {
    /**
     * Lower left corner of the grid in radians [longitude, latitude].
     */
    ll: Array<number>;
    /**
     * Grid spacing in radians [longitude interval, latitude interval].
     */
    del: Array<number>;
    /**
     * Number of columns in the grid [longitude columns, latitude columns].
     */
    lim: Array<number>;
    /**
     * Total number of grid nodes.
     */
    count?: number;
    /**
     * Mapped node values for the grid.
     */
    cvs: any[];
};
export type NADGrid = {
    header: NadgridHeader;
    subgrids: Array<Subgrid>;
};
export type GeoTIFF = {
    /**
     * - Returns the number of images in the GeoTIFF.
     */
    getImageCount: () => Promise<number>;
    /**
     * - Returns a GeoTIFFImage for the given index.
     */
    getImage: (index: number) => Promise<GeoTIFFImage>;
};
export type GeoTIFFImage = {
    /**
     * - Returns the width of the image.
     */
    getWidth: () => number;
    /**
     * - Returns the height of the image.
     */
    getHeight: () => number;
    /**
     * - Returns the bounding box as [minX, minY, maxX, maxY] in degrees.
     */
    getBoundingBox: () => number[];
    /**
     * - Returns the raster data as an array of bands.
     */
    readRasters: () => Promise<ArrayLike<ArrayLike<number>>>;
    /**
     * - The file directory object containing metadata.
     */
    fileDirectory: {
        ModelPixelScale: any;
    };
};
