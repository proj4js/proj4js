import adjust_lon from './adjust_lon';

export default function (zone, lon) {
  if (zone === undefined) {
    zone = Math.floor((adjust_lon(lon) + Math.PI) * 30 / Math.PI) + 1;

    if (zone < 0) {
      return 0;
    } else if (zone > 60) {
      return 60;
    }
  }
  return zone;
}
