function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplifyFractionStr(s: string): string {
  const m = s.match(/^(-?\d+)\/(\d+)$/);
  if (!m) return s;
  let num = parseInt(m[1], 10);
  let den = parseInt(m[2], 10);
  if (den === 0) return s;
  const sign = (num < 0) ? -1 : 1;
  num = Math.abs(num);
  const g = gcd(num, den);
  num = sign * (num / g);
  den = den / g;
  if (den === 1) return `${num}`;
  return `${num}/${den}`;
}

export function normalizeMathInput(s: string): string {
  let r = s.trim();

  r = r.replace(/√/g, "sqrt");
  r = r.replace(/≤/g, "<=");
  r = r.replace(/≥/g, ">=");
  r = r.replace(/×/g, "*");
  r = r.replace(/·/g, "*");
  r = r.replace(/−/g, "-");

  r = r.replace(/\s*([+\-*/=<>^])\s*/g, "$1");
  r = r.replace(/\s+/g, "");

  r = r.replace(/sqrt(\d+)(?!\()/g, "sqrt($1)");

  r = r.replace(/(\d)(sqrt\()/g, "$1*$2");

  r = r.toLowerCase();

  const SQRT_PH = "\x00SQRT\x00";
  r = r.replace(/sqrt\(/g, SQRT_PH);

  r = r.replace(/\)\(/g, ")*(");
  r = r.replace(/(\d)\(/g, "$1*(");
  r = r.replace(/([a-z])\(/g, "$1*(");
  r = r.replace(/\)([a-z0-9])/g, ")*$1");

  r = r.replace(new RegExp(SQRT_PH.replace(/\x00/g, "\\x00"), "g"), "sqrt(");

  r = r.replace(/^m=/i, "");

  r = simplifyFractionStr(r);

  return r;
}
