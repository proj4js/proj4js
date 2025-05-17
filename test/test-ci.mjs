import * as chai from 'chai';
import { fromArrayBuffer } from 'geotiff';
import proj4 from '../dist/proj4-src.js';
import testData from './testData.js';
import startTests from './test.js';

if (typeof process !== 'undefined' && process.toString() === '[object process]') {
  (async function () {
    startTests(chai, proj4, fromArrayBuffer, testData);
  })();
}
