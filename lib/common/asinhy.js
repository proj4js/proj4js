import hypot from './hypot';
import log1py from './log1py';

export default function (x) {
  var y = Math.abs(x);
  y = log1py(y * (1 + y / (hypot(1, y) + 1)));

  return x < 0 ? -y : y;
}
