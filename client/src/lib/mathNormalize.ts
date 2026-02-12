export function normalizeMathInput(s: string): string {
  let r = s.trim();

  r = r.replace(/\s+/g, " ");

  r = r.replace(/√/g, "sqrt");
  r = r.replace(/≤/g, "<=");
  r = r.replace(/≥/g, ">=");
  r = r.replace(/×/g, "*");
  r = r.replace(/·/g, "*");
  r = r.replace(/−/g, "-");

  r = r.replace(/sqrt(\d+)/g, "sqrt($1)");

  r = r.replace(/(\d)(sqrt\()/g, "$1*$2");

  r = r.replace(/\)\(/g, ")*(");

  r = r.replace(/\s*([+\-*/=<>^])\s*/g, "$1");

  r = r.replace(/\s+/g, "");

  r = r.toLowerCase();

  return r;
}
