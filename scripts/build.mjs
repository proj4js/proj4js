import { writeFileSync } from 'fs';

const allProjs = [
  'tmerc',
  'etmerc',
  'utm',
  'sterea',
  'stere',
  'somerc',
  'omerc',
  'lcc',
  'krovak',
  'cass',
  'laea',
  'aea',
  'gnom',
  'cea',
  'eqc',
  'poly',
  'nzmg',
  'mill',
  'sinu',
  'eck6',
  'moll',
  'eqdc',
  'vandg',
  'aeqd',
  'ortho',
  'qsc',
  'robin',
  'geocent',
  'tpers',
  'geos',
  'eqearth',
  'bonne',
  'ob_tran'
];

const arg = process.argv[2];
let projections;

if (!arg) {
  projections = allProjs;
} else {
  projections = arg.split(',').map(p => p.trim()).filter(Boolean);
  if (projections.length === 0) {
    projections = allProjs;
  }
}

const isDefault = projections.length === 0
  || (projections.length === 1 && projections[0] === 'default');

let content;
if (isDefault) {
  content = 'export default function(){};\n';
} else {
  content = [
    projections.map(proj =>
      `import ${proj} from './lib/projections/${proj}';`
    ).join('\n'),
    'export default function (proj4) {',
    projections.map(proj =>
      `  proj4.Proj.projections.add(${proj});`
    ).join('\n'),
    '}',
    ''
  ].join('\n');
}

writeFileSync('./projs.js', content);
