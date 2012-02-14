/* Loop through the test points and create a Proj object for each
 */
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
  
  
  for (var i=0; i < Proj4js.testPoints.length; ++i) {
    var test = Proj4js.testPoints[i];
    var proj = new Proj4js.Proj(test.code, Proj4js.bind(showResults, this, test));
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
    
    //transform from lon/lat to projected x/y and cmopare 
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
    
    //transform from map x/y to lon/lat and compare
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
    
    var testTable = document.getElementById('testResult');
    testTable.tBodies[0].appendChild(row);
};

