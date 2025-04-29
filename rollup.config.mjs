import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: './lib/index.js',
  output: [{
    file: './dist/proj4-src.js',
    format: 'umd',
    name: 'proj4'
  },
  {
    file: './dist/proj4.js',
    format: 'umd',
    name: 'proj4',
    plugins: [terser()]
  }],
  plugins: [
    replace({
      preventAssignment: true,
      __VERSION__: process.env.npm_package_version
    }),
    json(),
    nodeResolve(),
    commonjs()
  ]
};
