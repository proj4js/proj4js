import { TWO_PI, SPI } from '../constants/values';
import sign from './sign';

export default function (x) {
  return (Math.abs(x) <= SPI) ? x : (x - (sign(x) * TWO_PI));
}
