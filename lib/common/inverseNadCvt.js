import nad_intr from './nad_intr';
import adjust_lon from './adjust_lon';

export default function(t, val, tb, ct) {
  if (isNaN(t.x)) {
    return val;
  }
  t.x = tb.x + t.x;
  t.y = tb.y - t.y;
  var i = 9,
    tol = 1e-12;
  var dif, del;
  do {
    del = nad_intr(t, ct);
    if (isNaN(del.x)) {
      break;
    }
    dif = {
      "x": t.x - del.x - tb.x,
      "y": t.y + del.y - tb.y
    };
    t.x -= dif.x;
    t.y -= dif.y;
  } while (i-- && Math.abs(dif.x) > tol && Math.abs(dif.y) > tol);
  if (i < 0) {
    return val;
  }
  val.x = adjust_lon(t.x + ct.ll[0]);
  val.y = t.y + ct.ll[1];
  return val;
}