export default function(esinp, exp) {
  return (Math.pow((1 - esinp) / (1 + esinp), exp));
}