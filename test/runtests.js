Proj4js.proxyScript = '/mapbuilder/proxy?url=';

function runTests() {
  //crossProj();
  var xyEPSLN = 1.0e-2;
  var llEPSLN = 1.0e-6;
  var testTable = document.getElementById('testResult');
  for (var i=0; i < Proj4js.testPoints.length; ++i) {
    var row = document.createElement('tr');
    var test = Proj4js.testPoints[i];
    var proj = new Proj4js.Proj(test.code);
    //proj.getTestPoint();
    
    var td = document.createElement('td');
    td.innerHTML = test.code;
    row.appendChild(td);
    var td = document.createElement('td');
    td.innerHTML = proj.projName;
    row.appendChild(td);
    
    var xyResult = Proj4js.transform(Proj4js.WGS84, proj, new Proj4js.Point(test.ll));
    if (xyResult) {
      var deltaX = Math.abs(xyResult.x - test.xy[0]);
      var deltaY = Math.abs(xyResult.y - test.xy[1]);
      td = document.createElement('td');
      td.innerHTML = "in:"+test.ll[0]+","+test.ll[1];
      row.appendChild(td);
      td = document.createElement('td');
      td.innerHTML = "out:"+xyResult.x+","+xyResult.y;
      row.appendChild(td);
      td = document.createElement('td');
      td.innerHTML = "dx:"+deltaX+ " dy:"+deltaY;
      if ( deltaX>xyEPSLN || deltaY>xyEPSLN ) td.style.backgroundColor='red';
      row.appendChild(td);
    } else {
      td = document.createElement('td');
      td.innerHTML = "proj undefined";
      row.appendChild(td);
    }
    
    var llResult = Proj4js.transform(proj, Proj4js.WGS84, new Proj4js.Point(test.xy));
    if (llResult) {
      var deltaX = Math.abs(llResult.x - test.ll[0]);
      var deltaY = Math.abs(llResult.y - test.ll[1]);
      td = document.createElement('td');
      td.innerHTML = "in:"+test.xy[0]+","+test.xy[1];
      row.appendChild(td);
      td = document.createElement('td');
      td.innerHTML = "out:"+llResult.x+","+llResult.y;
      row.appendChild(td);
      td = document.createElement('td');
      td.innerHTML = "dx:"+deltaX+ " dy:"+deltaY;
      if ( deltaX>llEPSLN || deltaY>llEPSLN ) td.style.backgroundColor='red';
      row.appendChild(td);
    } else {
      td = document.createElement('td');
      td.innerHTML = "proj undefined";
      row.appendChild(td);
    }
    
    testTable.tBodies[0].appendChild(row);
  }
};
    
function crossProj() {
  var prefGoogle = new Proj4js.Point(1484259.88, 6024072.12, 0.0);
  var pref31285 = new Proj4js.Point(450055.70, 5262356.33, 0.0);
  var prefWGS84 = new Proj4js.Point(13.3333333333, 47.5, 0.0);
  var dest = new Proj4js.Proj('EPSG:31285');
  var google = new Proj4js.Proj('google');
  //var OLxform = new OpenLayers.Layer.SphericalMercator();
  
  var direct = Proj4js.transform(google, dest, prefGoogle.clone());//this should equal pref31285
  var indirect = Proj4js.transform(dest, google, pref31285.clone());//this should equal prefGoogle
  var WGS84Out = Proj4js.transform(dest, Proj4js.WGS84, pref31285.clone());
  var destOut = Proj4js.transform(Proj4js.WGS84, dest, prefWGS84.clone());
  var googleOut = Proj4js.transform(Proj4js.WGS84, google, prefWGS84.clone());
  var cross1 = Proj4js.transform(dest, google, destOut.clone());  //this should equal googleOut
  var cross2 = Proj4js.transform(google, dest, googleOut.clone());//this should equal destOut
  return;
}

Proj4js.Proj.prototype.getBbox = function() {
  //set AJAX options
  var options = {
    method: 'get',
    asynchronous: false,          //need to wait until defs are loaded before proceeding
    onSuccess: boundsLoaded.bind(this)
  }
  //load from web service via AJAX request
  var url = Proj4js.proxyScript?Proj4js.proxyScript:'';
  url += Proj4js.defsLookupService +'/' + this.srsAuth +'/'+ this.srsProjNumber + '/bbox';
  new OpenLayers.Ajax.Request(url, options);
};

function boundsLoaded(transport) {
  if (transport.responseText && transport.responseText.length>0 ) {
    eval('this.bbox='+transport.responseText);
  }
}
