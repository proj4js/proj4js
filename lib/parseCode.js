import defs from './defs';
import wkt from 'wkt-parser';
import projStr from './projString';
function testObj(code){
  return typeof code === 'string';
}
function testDef(code){
  return code in defs;
}
 var codeWords = ['PROJECTEDCRS', 'PROJCRS', 'GEOGCS','GEOCCS','PROJCS','LOCAL_CS', 'GEODCRS', 'GEODETICCRS', 'GEODETICDATUM', 'ENGCRS', 'ENGINEERINGCRS']; 
function testWKT(code){
  return codeWords.some(function (word) {
    return code.indexOf(word) > -1;
  });
}
function testProj(code){
  return code[0] === '+';
}
function parse(code){
  if (testObj(code)) {
    //check to see if this is a WKT string
    if (testDef(code)) {
      //return defs[code];
      //return deep-copy instead of reference
      //due to performance reasons should be changed to some other deep-copy mechanism
      return  JSON.parse(JSON.stringify(defs[code]));
    }
    if (testWKT(code)) {
      return wkt(code);
    }
    if (testProj(code)) {
      return projStr(code);
    }
  }else{
    return code;
  }
}

export default parse;
