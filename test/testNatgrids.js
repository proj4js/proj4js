/* globals describe, it */
const fs = require('fs')
const { assert } = require('chai')
const Papa = require('papaparse')
const proj4 = require('../dist/proj4-src')
// const { readNadgrids } = require('../lib/nadgridsReader')
const { readNadgrids } = require('../dist/proj4-src')

describe('nadgrids', () => {
  const testCases = getOSGBTestData();
  // proj4.defs('WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
  proj4.defs('WGS84', "+proj=longlat +datum=WGS84 +no_defs ");
  // proj4.defs('OSGB', "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +datum=OSGB36 +ellps=airy +units=m +no_defs +nadgrids=./OSTN15-NTv2/OSTN15_NTv2_OSGBtoETRS.gsb")
  proj4.defs('OSGB', "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs  +nadgrids=./OSTN15-NTv2/OSTN15_NTv2_OSGBtoETRS.gsb")
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
})

function getOSGBTestData() {
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

// describe('nadgridsReader', function () {
//   it('should parse a valid file', function () {
//     const grid = readNadgrids('./OSTN15-NTv2/OSTN15_NTv2_OSGBtoETRS.gsb');
//     assert.approximately(grid.ll[0], -7200, 0.1);
//     assert.approximately(grid.ll[1], 176400, 0.1);
//     assert.approximately(grid.del[0], 60, 0.1);
//     assert.approximately(grid.del[1], 30, 0.1);
//     assert.approximately(grid.lim[0], 661, 0.1);
//     assert.approximately(grid.lim[1], 1441, 0.1);
//     assert.approximately(grid.count, 952501, 0.1);
//     assert.equal(grid.cvs.length, 952501);
//     assert.approximately(grid.cvs[0][0], 6.2597, 0.001);
//     assert.approximately(grid.cvs[0][1], 2.9986, 0.001);
//   });
// });
