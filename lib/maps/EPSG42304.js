Proj4js.maps.EPSG43204 = {
  mapOptions : {
    maxExtent: new OpenLayers.Bounds(-3631568.75,-1293815.5,4491139.5833333321,4937122), 
    scales: [50000000,23207944.16806,10772173.45016,5000000,2320794.41681,1077217.34502,500000,232079.44168,107721.7345,50000],
    units: 'm', 
    projection: 'EPSG:42304'
  },
  layerName: 'DM Solutions Demo',
  layerUrl: "http://localhost/cgi-bin/mapserv.exe?MAP=/ms4w/apps/gmap/htdocs/gmap75_wms.map",
  layerParams: {layers: "bathymetry,land_fn,park,drain_fn,drainage,prov_bound,fedlimit,rail,road,popplace", transparent: "false", format: "image/png" },
  layerOptions: {singleTile: true}
};
