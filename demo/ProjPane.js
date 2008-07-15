var panes = {
  mapL: {},
  mapLL: {},
  mapR: {}
};

ProjPane = Class.create();
ProjPane.prototype = {
  id: null,
  map: null,
  proj: null,

  initialize: function(pane, code) {
    this.id = pane;
    if (code) this.setProj(code);
  },

  updateCoords: function(coords) {
    document.getElementById(this.id+'_coords').innerHTML = coords.toString();
    var pt = this.map.getLayerPxFromLonLat(coords);
    this.marker.moveTo(pt);
  },

  setProj: function(code) {
    document.getElementById(this.id+'_proj').value = code; 

    this.proj = new Proj4js.Proj(code);
    var mapDef = Proj4js.maps[this.proj.srsCode];

    if (this.map) this.map.destroy();
    this.map = new OpenLayers.Map(this.id, mapDef.mapOptions);
    this.mapLayer = new OpenLayers.Layer.WMS(mapDef.layerName, mapDef.layerUrl, mapDef.layerParams, mapDef.layerOptions);
    this.map.addLayer(this.mapLayer);

    this.map.addLayer(new OpenLayers.Layer.Markers(''));
    this.marker = new OpenLayers.Marker(new OpenLayers.LonLat(0,0));
    this.map.layers[1].addMarker(this.marker);
    this.marker.map = this.map;
    if (window.bounds) {
      this.map.addLayer(new OpenLayers.Layer.Boxes());
      this.map.layers[2].addMarker(new OpenLayers.Marker.Box(bounds));
      this.map.setCenter(bounds.getCenterLonLat());
    } else {    
      this.map.zoomToMaxExtent();
    }    
    this.map.events.register('click', this.map, this.mapClicked.bind(this));

    document.getElementById(this.id+'_units').innerHTML = this.proj.units; 
    document.getElementById(this.id+'_title').innerHTML = this.proj.title; 
    document.getElementById(this.id+'_class').innerHTML = this.proj.projName; 
  },

  mapClicked: function(ev) { 
    var olc = this.map.getLonLatFromViewPortPx(ev.xy);
    c = new Proj4js.Point(olc.lon, olc.lat);
    this.updateCoords(c);
  
    if (this.opposite && this.opposite.proj) {
      var newCoords = this.proj.transform(c, this.opposite.proj);
      this.opposite.updateCoords(newCoords);
    }
    if (this.common) {
      var newCoords = this.proj.inverse(c);
      this.common.updateCoords(newCoords);
    }
    if (this.projected1 && this.projected1.proj) {
      var newCoords = this.projected1.proj.forward(c);
      this.projected1.updateCoords(newCoords);
    }
    if (this.projected2 && this.projected2.proj) {
      var newCoords = this.projected2.proj.forward(c);
      this.projected2.updateCoords(newCoords);
    }
  }
};


function init() {
  panes['mapLL'] = new ProjPane('mapLL',Proj4js.defaultDatum);
  panes['mapL'] = new ProjPane('mapL');
  panes['mapR'] = new ProjPane('mapR');

  panes['mapLL'].projected1 = panes['mapL'];
  panes['mapLL'].projected2 = panes['mapR'];
  panes['mapL'].opposite = panes['mapR'];
  panes['mapR'].opposite = panes['mapL'];
  panes['mapL'].common = panes['mapLL'];
  panes['mapR'].common = panes['mapLL'];

};

