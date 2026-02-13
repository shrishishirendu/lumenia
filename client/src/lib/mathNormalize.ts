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

function safeEvalPoly(expr: string, xVal: number): number | null {
  let s = normalizeMathInput(expr);
  s = s.replace(/\^/g, "**");
  s = s.replace(/(\d)(x)/g, "$1*$2");
  s = s.replace(/(x)(\d)/g, "$1*$2");
  s = s.replace(/(x)(x)/g, "$1*$2");
  s = s.replace(/x/g, `(${xVal})`);
  if (/[^0-9+\-*/()._ ]/.test(s)) return null;
  try {
    const result = Function(`"use strict"; return (${s})`)() as number;
    if (!isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

function stripEquationLHS(expr: string): string {
  const norm = normalizeMathInput(expr);
  const m = norm.match(/^y=(.*)/);
  if (m) return m[1];
  return norm;
}

export function normalizeCoordinatePairInput(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (/no\s*solution/.test(s)) return "no solution";
  if (/infinite/.test(s)) return "infinitely many solutions";

  const cleaned = s.replace(/[()]/g, "").replace(/\s/g, "");

  const labeled = cleaned.match(/x\s*=\s*(-?[\d.]+(?:\/\d+)?).*?y\s*=\s*(-?[\d.]+(?:\/\d+)?)/);
  if (labeled) {
    return `(${labeled[1]},${labeled[2]})`;
  }

  const pair = cleaned.match(/^(-?[\d.]+(?:\/\d+)?)[,;]\s*(-?[\d.]+(?:\/\d+)?)$/);
  if (pair) {
    return `(${pair[1]},${pair[2]})`;
  }

  return raw.trim();
}

export function mathExpressionsEquivalent(a: string, b: string): boolean {
  const na = normalizeMathInput(a);
  const nb = normalizeMathInput(b);
  if (na === nb) return true;

  const isEqA = na.includes("y=");
  const isEqB = nb.includes("y=");
  if (isEqA || isEqB) {
    const exprA = isEqA ? stripEquationLHS(a) : na;
    const exprB = isEqB ? stripEquationLHS(b) : nb;
    if (exprA === exprB) return true;

    const testValues = [-3, -2, -1, 0, 1, 2, 3, 5, 7];
    let matched = 0;
    let tested = 0;
    for (const x of testValues) {
      const va = safeEvalPoly(exprA, x);
      const vb = safeEvalPoly(exprB, x);
      if (va === null || vb === null) continue;
      tested++;
      if (Math.abs(va - vb) < 0.001) {
        matched++;
      } else {
        return false;
      }
    }
    return tested >= 3;
  }

  const testValues = [-3, -2, -1, 0, 1, 2, 3, 5, 7];
  let matched = 0;
  let tested = 0;

  for (const x of testValues) {
    const va = safeEvalPoly(a, x);
    const vb = safeEvalPoly(b, x);
    if (va === null || vb === null) continue;
    tested++;
    if (Math.abs(va - vb) < 0.001) {
      matched++;
    } else {
      return false;
    }
  }

  return tested >= 3;
}
