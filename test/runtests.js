/* Loop through the test points and create a Proj object for each
 */
var wgs84 = new Proj4js.Proj('WGS84');
var src, dest;
function runTests() {
  
  //src = new Proj4js.Proj(Proj4js.defs["WKT0"],cb2);
  /*
  src = new Proj4js.Proj("EPSG:900913",cb1);
  var testPt = new Proj4js.Point([1113194.9079327357, 6800125.454397307]);
  var testRes = Proj4js.transform(src, dest, testPt);
  alert(testRes.toString());
  */

  /* 
  //testing the conversion bewteen CSs which use the towgs84 params (ticket #64)
  //TODO convert this to asserts
  src = new Proj4js.Proj("EPSG:21781");
  dest = new Proj4js.Proj("EPSG:900913");
  var testPt = new Proj4js.Point([699212,227132]);
  var testRes = Proj4js.transform(src, dest, testPt);
  alert(testRes.toString());
  //result should be 973791.60867,5972764.60117 
  */
  
  
  for (var i=0; i < window.Proj4jsTestPoints.length; ++i) {
    var test = window.Proj4jsTestPoints[i];
    var proj = new Proj4js.Proj(test.code);
	showResults(test, proj);
  }
}
function cb1() {
  dest = new Proj4js.Proj("EPSG:2303X",cb2);
}
function cb2(arg1) {
  //alert('all set');
}

/* a callback function to run the test for this test point since we are using
 the dynamic load capabilities in the test page
 */
function showResults(test, proj) {
  //var test = proj.testPoint;
  var xyEPSLN = 1.0e-2;
  var llEPSLN = 1.0e-6;
    var row = document.createElement('tr');
    var td = document.createElement('td');
    td.innerHTML = test.code;
    row.appendChild(td);
    var td = document.createElement('td');
    td.innerHTML = proj.projName;
    row.appendChild(td);
    
    //transform from lon/lat to projected x/y and compare 
    var xyResult = Proj4js.transform(wgs84, proj, new Proj4js.Point(test.ll));
    if (xyResult) {
      var deltaX = Math.abs(xyResult.x - test.xy[0]);
      var deltaY = Math.abs(xyResult.y - test.xy[1]);
      td = document.createElement('td');
      td.innerHTML = "in:"+test.ll[0].toPrecision(8)+","+test.ll[1].toPrecision(8);
      row.appendChild(td);
      td = document.createElement('td');
      td.innerHTML = "out:"+xyResult.x.toFixed(3)+","+xyResult.y.toFixed(3);
      row.appendChild(td);
      td = document.createElement('td');
      td.innerHTML = "dx:"+deltaX.toPrecision(3)+ " dy:"+deltaY.toPrecision(3);
      if ( deltaX>xyEPSLN || deltaY>xyEPSLN ) td.style.backgroundColor='red';
      row.appendChild(td);
    } else {
      td = document.createElement('td');
      td.innerHTML = "proj undefined";
      row.appendChild(td);
    }
    
    //transform from map x/y to lon/lat and compare
    var llResult = Proj4js.transform(proj, wgs84, new Proj4js.Point(test.xy));
    if (llResult) {
      var deltaX = Math.abs(llResult.x - test.ll[0]);
      var deltaY = Math.abs(llResult.y - test.ll[1]);
      td = document.createElement('td');
      td.innerHTML = "in:"+test.xy[0].toFixed(3)+","+test.xy[1].toFixed(3);
      row.appendChild(td);
      td = document.createElement('td');
      td.innerHTML = "out:"+llResult.x.toPrecision(8)+","+llResult.y.toPrecision(8);
      row.appendChild(td);
      td = document.createElement('td');
      td.innerHTML = "dx:"+deltaX.toPrecision(3)+ " dy:"+deltaY.toPrecision(3);
      if ( deltaX>llEPSLN || deltaY>llEPSLN ) td.style.backgroundColor='red';
      row.appendChild(td);
    } else {
      td = document.createElement('td');
      td.innerHTML = "proj undefined";
      row.appendChild(td);
    }
    
    var testTable = document.getElementById('testResult');
    testTable.tBodies[0].appendChild(row);
};

