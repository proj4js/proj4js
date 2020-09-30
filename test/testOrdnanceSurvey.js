function startTests(chai, proj4, testPoints, nadgridData) {
  var assert = chai.assert;
  describe('proj4', function() {
    if (nadgridData !== undefined) {
      describe('Nadgrids', function() {
        const testCases = getOSGBTestData();
        proj4.nadgrid('ostn15', nadgridData);
        proj4.defs('WGS84', "+proj=longlat +datum=WGS84 +no_defs ");
        proj4.defs('OSGB', "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs  +nadgrids=ostn15,null")
        const converter = proj4('OSGB', 'WGS84');

        for (const testCase of testCases) {
          it(`should convert ${testCase.id}: ${testCase.osPoint} -> ${testCase.etrsPoint}`, () => {
            const actual = converter.forward(testCase.osPoint)
            assert.approximately(actual[0], testCase.etrsPoint[0], 0.000001)
            assert.approximately(actual[1], testCase.etrsPoint[1], 0.000001)
          })

          it(`should convert the inverse ${testCase.id}: ${testCase.etrsPoint} -> ${testCase.osPoint}`, () => {
            const actual = converter.inverse(testCase.etrsPoint)
            assert.approximately(actual[0], testCase.osPoint[0], 0.1)
            assert.approximately(actual[1], testCase.osPoint[1], 0.1)
          })
        }
      });
    }
  });
}
if(typeof process !== 'undefined'&&process.toString() === '[object process]'){
  (function(){
    startTests(require('chai'), require('../dist/proj4-src'), require('./testData'), loadNadgridData());
  })();
}

// TODO: How to load in browser?
function loadNadgridData() {
  var fs = require('fs');
  return fs.readFileSync('./OSTN15-NTv2/OSTN15_NTv2_OSGBtoETRS.gsb').buffer
  // return fs.readFileSync('./test/ntv2_0_downsampled.gsb').buffer
}

// TODO: Move to testData.js
function getOSGBTestData() {
  var fs = require('fs');
  const Papa = require('papaparse')
  const testInputs = Papa.parse(fs.readFileSync('./OSTN15-NTv2/OSTN15_TestInput_OSGBtoETRS.txt', 'utf8'),
    { header: true })
  const testOutputs = Papa.parse(fs.readFileSync('./OSTN15-NTv2/OSTN15_TestOutput_OSGBtoETRS.txt', 'utf8'),
    { header: true })
  const testData = []
  for (let i = 0; i < testInputs.data.length; i++) {
    const input = testInputs.data[i]
    const output = testOutputs.data[i]
    if (input['PointID'] === '') continue
    const test = {
      id: input['PointID'],
      osPoint: [parseFloat(input['OSGB36 Eastings']), parseFloat(input['OSGB36 Northing'])],
      etrsPoint: [parseFloat(output['ETRSLong']), parseFloat(output['ETRSLat'])]
    }
    testData.push(test)
  }
  return testData
}
