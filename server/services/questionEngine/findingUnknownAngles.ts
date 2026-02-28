import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "finding_unknown_angles_trig";
  difficulty: "easy" | "medium" | "hard" | "challenge";
  archetype: string;
  prompt: string;
  answer: string;
  worked_solution: string[];
  metadata: {
    params: Record<string, number | string>;
    skills: string[];
    estimated_time_sec: number;
    visual: {
      type: "svg";
      svg: string;
      alt: string;
      width: number;
      height: number;
    };
    explain?: {
      title: string;
      bullets: string[];
      example: string;
    };
  };
}

class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }
  randInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

function makeId(difficulty: string, archetype: string, params: Record<string, number | string>): string {
  const sorted = Object.keys(params).sort().reduce((acc, k) => { acc[k] = params[k]; return acc; }, {} as Record<string, number | string>);
  const raw = `${difficulty}:${archetype}:${JSON.stringify(sorted)}`;
  return createHash("sha256").update(raw).digest("hex").substring(0, 12);
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplifyFrac(n: number, d: number): string {
  if (d === 0) return "0";
  const sign = (n < 0) !== (d < 0) ? -1 : 1;
  n = Math.abs(n); d = Math.abs(d);
  const g = gcd(n, d);
  n = sign * (n / g); d = d / g;
  if (d === 1) return `${n}`;
  return `${n}/${d}`;
}

const PYTHAGOREAN_TRIPLES: [number, number, number][] = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25],
  [6, 8, 10], [9, 12, 15], [12, 16, 20], [15, 20, 25],
  [9, 40, 41], [11, 60, 61], [20, 21, 29], [28, 45, 53],
];

type TrigFn = "sin" | "cos" | "tan";

function makeRightTriangleSvg(opts: {
  opp: number | string; adj: number | string; hyp: number | string;
  theta: number | string;
  labelOpp?: string; labelAdj?: string; labelHyp?: string;
  showOpp?: boolean; showAdj?: boolean; showHyp?: boolean;
  showTheta?: boolean;
  anglePosition?: "bottom-left" | "top-right";
  width?: number; height?: number;
}): string {
  const W = opts.width || 420;
  const H = opts.height || 320;
  const pad = 40;

  const baseLen = W - 2 * pad;
  const heightLen = H - 2 * pad;

  const Ax = pad;
  const Ay = H - pad;
  const Bx = pad + baseLen * 0.75;
  const By = H - pad;
  const Cx = Bx;
  const Cy = pad + heightLen * 0.15;

  const showOpp = opts.showOpp !== false;
  const showAdj = opts.showAdj !== false;
  const showHyp = opts.showHyp !== false;
  const showTheta = opts.showTheta !== false;

  const oppLabel = opts.labelOpp || String(opts.opp);
  const adjLabel = opts.labelAdj || String(opts.adj);
  const hypLabel = opts.labelHyp || String(opts.hyp);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;

  svg += `<polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}" fill="#e8f0fe" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>`;

  const sqSize = 14;
  svg += `<polyline points="${Bx - sqSize},${By} ${Bx - sqSize},${By - sqSize} ${Bx},${By - sqSize}" fill="none" stroke="#333" stroke-width="1.5"/>`;

  if (showTheta) {
    const arcR = 30;
    const startAngleRad = Math.atan2(Ay - Cy, Cx - Ax);
    const arcStartX = Ax + arcR * Math.cos(-startAngleRad);
    const arcStartY = Ay + arcR * Math.sin(-startAngleRad);
    const arcEndX = Ax + arcR;
    const arcEndY = Ay;
    svg += `<path d="M ${arcEndX} ${arcEndY} A ${arcR} ${arcR} 0 0 0 ${arcStartX} ${arcStartY}" fill="none" stroke="#dc2626" stroke-width="1.5"/>`;

    const labelAngle = startAngleRad / 2;
    const labelR = arcR + 16;
    const thetaLabelX = Ax + labelR * Math.cos(-labelAngle);
    const thetaLabelY = Ay + labelR * Math.sin(-labelAngle);
    svg += `<text x="${thetaLabelX}" y="${thetaLabelY}" text-anchor="middle" dominant-baseline="middle" fill="#dc2626" font-size="14" font-weight="bold" font-style="italic">θ = ${opts.theta}°</text>`;
  }

  if (showOpp) {
    const mx = Bx + 18;
    const my = (By + Cy) / 2;
    svg += `<text x="${mx}" y="${my}" text-anchor="start" dominant-baseline="middle" fill="#16a34a" font-size="13" font-weight="bold">${oppLabel}</text>`;
  }

  if (showAdj) {
    const mx = (Ax + Bx) / 2;
    const my = By + 20;
    svg += `<text x="${mx}" y="${my}" text-anchor="middle" fill="#2563eb" font-size="13" font-weight="bold">${adjLabel}</text>`;
  }

  if (showHyp) {
    const mx = (Ax + Cx) / 2 - 18;
    const my = (Ay + Cy) / 2;
    svg += `<text x="${mx}" y="${my}" text-anchor="end" dominant-baseline="middle" fill="#9333ea" font-size="13" font-weight="bold">${hypLabel}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

function makeCoordinateTriangleSvg(pts: { A: [number, number]; B: [number, number]; C: [number, number] }, theta: string, width = 420, height = 320): string {
  const pad = 35;
  const allX = [pts.A[0], pts.B[0], pts.C[0]];
  const allY = [pts.A[1], pts.B[1], pts.C[1]];
  const xMin = Math.min(...allX) - 1;
  const xMax = Math.max(...allX) + 1;
  const yMin = Math.min(...allY) - 1;
  const yMax = Math.max(...allY) + 1;

  const w = width - 2 * pad;
  const h = height - 2 * pad;
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * w;
  const sy = (y: number) => pad + ((yMax - y) / (yMax - yMin)) * h;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#fafafa" rx="4"/>`;

  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    const px = sx(x);
    svg += `<line x1="${px}" y1="${pad}" x2="${px}" y2="${height - pad}" stroke="#e0e0e0" stroke-width="0.5"/>`;
    if (x !== 0) svg += `<text x="${px}" y="${height - pad + 14}" text-anchor="middle" fill="#888" font-size="10">${x}</text>`;
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    const py = sy(y);
    svg += `<line x1="${pad}" y1="${py}" x2="${width - pad}" y2="${py}" stroke="#e0e0e0" stroke-width="0.5"/>`;
    if (y !== 0) svg += `<text x="${pad - 6}" y="${py + 4}" text-anchor="end" fill="#888" font-size="10">${y}</text>`;
  }

  if (yMin <= 0 && yMax >= 0) {
    const y0 = sy(0);
    svg += `<line x1="${pad}" y1="${y0}" x2="${width - pad}" y2="${y0}" stroke="#333" stroke-width="1.5"/>`;
  }
  if (xMin <= 0 && xMax >= 0) {
    const x0 = sx(0);
    svg += `<line x1="${x0}" y1="${pad}" x2="${x0}" y2="${height - pad}" stroke="#333" stroke-width="1.5"/>`;
  }

  const [ax, ay] = [sx(pts.A[0]), sy(pts.A[1])];
  const [bx, by] = [sx(pts.B[0]), sy(pts.B[1])];
  const [cx, cy] = [sx(pts.C[0]), sy(pts.C[1])];
  svg += `<polygon points="${ax},${ay} ${bx},${by} ${cx},${cy}" fill="#e8f0fe" fill-opacity="0.5" stroke="#2563eb" stroke-width="2"/>`;

  svg += `<circle cx="${ax}" cy="${ay}" r="4" fill="#2563eb"/><text x="${ax - 10}" y="${ay + 16}" fill="#2563eb" font-size="11" font-weight="bold">A(${pts.A[0]},${pts.A[1]})</text>`;
  svg += `<circle cx="${bx}" cy="${by}" r="4" fill="#2563eb"/><text x="${bx + 6}" y="${by + 16}" fill="#2563eb" font-size="11" font-weight="bold">B(${pts.B[0]},${pts.B[1]})</text>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#2563eb"/><text x="${cx + 6}" y="${cy - 8}" fill="#2563eb" font-size="11" font-weight="bold">C(${pts.C[0]},${pts.C[1]})</text>`;

  svg += `<text x="${width / 2}" y="${pad - 10}" text-anchor="middle" fill="#dc2626" font-size="13" font-weight="bold">θ at ${theta}</text>`;
  svg += `</svg>`;
  return svg;
}

type ArchetypeFn = (rng: SeededRandom) => GeneratedQuestion;

function roundTo(val: number, dp: number): number {
  const factor = Math.pow(10, dp);
  return Math.round(val * factor) / factor;
}

function formatAngle(val: number, dp: number = 1): string {
  const rounded = roundTo(val, dp);
  if (Number.isInteger(rounded)) return `${rounded}`;
  return rounded.toFixed(dp).replace(/0+$/, "").replace(/\.$/, "");
}

function easyFindAngleSinPythagorean(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 8));
  const [a, b, c] = triple;
  const opp = a, adj = b, hyp = c;
  const angle = roundTo(Math.asin(opp / hyp) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { opp, hyp, variant: "sin_pyth" };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta: "?",
    labelOpp: `${opp}`, labelAdj: `${adj}`, labelHyp: `${hyp}`,
  });

  return {
    id: makeId("easy", "find_angle_sin_pyth", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "easy",
    archetype: "find_angle_sin_pyth",
    prompt: `In the right-angled triangle shown, the opposite side is ${opp} and the hypotenuse is ${hyp}. Find angle θ using sin⁻¹. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `sin θ = opposite / hypotenuse = ${opp} / ${hyp} = ${simplifyFrac(opp, hyp)}.`,
      `θ = sin⁻¹(${simplifyFrac(opp, hyp)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_sin", "identify_sides"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Right triangle with opp=${opp}, hyp=${hyp}, find angle θ`, width: 420, height: 320 },
    },
  };
}

function easyFindAngleCosPythagorean(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 8));
  const [a, b, c] = triple;
  const opp = a, adj = b, hyp = c;
  const angle = roundTo(Math.acos(adj / hyp) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { adj, hyp, variant: "cos_pyth" };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta: "?",
    labelOpp: `${opp}`, labelAdj: `${adj}`, labelHyp: `${hyp}`,
  });

  return {
    id: makeId("easy", "find_angle_cos_pyth", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "easy",
    archetype: "find_angle_cos_pyth",
    prompt: `In the right-angled triangle shown, the adjacent side is ${adj} and the hypotenuse is ${hyp}. Find angle θ using cos⁻¹. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `cos θ = adjacent / hypotenuse = ${adj} / ${hyp} = ${simplifyFrac(adj, hyp)}.`,
      `θ = cos⁻¹(${simplifyFrac(adj, hyp)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_cos", "identify_sides"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Right triangle with adj=${adj}, hyp=${hyp}, find angle θ`, width: 420, height: 320 },
    },
  };
}

function easyFindAngleTanPythagorean(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 8));
  const [a, b, c] = triple;
  const opp = a, adj = b, hyp = c;
  const angle = roundTo(Math.atan(opp / adj) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { opp, adj, variant: "tan_pyth" };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta: "?",
    labelOpp: `${opp}`, labelAdj: `${adj}`, labelHyp: `${hyp}`,
  });

  return {
    id: makeId("easy", "find_angle_tan_pyth", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "easy",
    archetype: "find_angle_tan_pyth",
    prompt: `In the right-angled triangle shown, the opposite side is ${opp} and the adjacent side is ${adj}. Find angle θ using tan⁻¹. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `tan θ = opposite / adjacent = ${opp} / ${adj} = ${simplifyFrac(opp, adj)}.`,
      `θ = tan⁻¹(${simplifyFrac(opp, adj)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "identify_sides"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Right triangle with opp=${opp}, adj=${adj}, find angle θ`, width: 420, height: 320 },
    },
  };
}

function easyRecogniseSpecialAngleSin(rng: SeededRandom): GeneratedQuestion {
  const specialMap: { ratio: string; angle: number; numericRatio: string }[] = [
    { ratio: "1/2", angle: 30, numericRatio: "0.5" },
    { ratio: "sqrt(2)/2", angle: 45, numericRatio: "0.7071" },
    { ratio: "sqrt(3)/2", angle: 60, numericRatio: "0.8660" },
  ];
  const chosen = rng.pick(specialMap);

  const params: Record<string, number | string> = { ratio: chosen.ratio, angle: chosen.angle };
  const svg = makeRightTriangleSvg({
    opp: chosen.ratio, adj: "?", hyp: 1, theta: "?",
    labelOpp: chosen.ratio, labelHyp: "1",
    showAdj: false,
  });

  return {
    id: makeId("easy", "special_angle_sin", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "easy",
    archetype: "special_angle_sin",
    prompt: `Find the angle θ if sin θ = ${chosen.ratio}. Give your answer in degrees.`,
    answer: `${chosen.angle}`,
    worked_solution: [
      `sin θ = ${chosen.ratio}.`,
      `θ = sin⁻¹(${chosen.ratio}).`,
      `This is a standard special angle: θ = ${chosen.angle}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_sin", "special_angles"],
      estimated_time_sec: 20,
      visual: { type: "svg", svg, alt: `Right triangle with sin θ = ${chosen.ratio}`, width: 420, height: 320 },
    },
  };
}

function easyRecogniseSpecialAngleCos(rng: SeededRandom): GeneratedQuestion {
  const specialMap: { ratio: string; angle: number }[] = [
    { ratio: "sqrt(3)/2", angle: 30 },
    { ratio: "sqrt(2)/2", angle: 45 },
    { ratio: "1/2", angle: 60 },
  ];
  const chosen = rng.pick(specialMap);

  const params: Record<string, number | string> = { ratio: chosen.ratio, angle: chosen.angle };
  const svg = makeRightTriangleSvg({
    opp: "?", adj: chosen.ratio, hyp: 1, theta: "?",
    labelAdj: chosen.ratio, labelHyp: "1",
    showOpp: false,
  });

  return {
    id: makeId("easy", "special_angle_cos", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "easy",
    archetype: "special_angle_cos",
    prompt: `Find the angle θ if cos θ = ${chosen.ratio}. Give your answer in degrees.`,
    answer: `${chosen.angle}`,
    worked_solution: [
      `cos θ = ${chosen.ratio}.`,
      `θ = cos⁻¹(${chosen.ratio}).`,
      `This is a standard special angle: θ = ${chosen.angle}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_cos", "special_angles"],
      estimated_time_sec: 20,
      visual: { type: "svg", svg, alt: `Right triangle with cos θ = ${chosen.ratio}`, width: 420, height: 320 },
    },
  };
}

function easyRecogniseSpecialAngleTan(rng: SeededRandom): GeneratedQuestion {
  const specialMap: { ratio: string; angle: number }[] = [
    { ratio: "1/sqrt(3)", angle: 30 },
    { ratio: "1", angle: 45 },
    { ratio: "sqrt(3)", angle: 60 },
  ];
  const chosen = rng.pick(specialMap);

  const params: Record<string, number | string> = { ratio: chosen.ratio, angle: chosen.angle };
  const svg = makeRightTriangleSvg({
    opp: chosen.ratio, adj: "1", hyp: "?", theta: "?",
    labelOpp: chosen.ratio, labelAdj: "1",
    showHyp: false,
  });

  return {
    id: makeId("easy", "special_angle_tan", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "easy",
    archetype: "special_angle_tan",
    prompt: `Find the angle θ if tan θ = ${chosen.ratio}. Give your answer in degrees.`,
    answer: `${chosen.angle}`,
    worked_solution: [
      `tan θ = ${chosen.ratio}.`,
      `θ = tan⁻¹(${chosen.ratio}).`,
      `This is a standard special angle: θ = ${chosen.angle}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "special_angles"],
      estimated_time_sec: 20,
      visual: { type: "svg", svg, alt: `Right triangle with tan θ = ${chosen.ratio}`, width: 420, height: 320 },
    },
  };
}

function easyBasicInverseIntegerAnswer(rng: SeededRandom): GeneratedQuestion {
  const sides: { opp: number; adj: number; hyp: number; angle: number }[] = [
    { opp: 5, adj: 5, hyp: Math.round(Math.sqrt(50) * 100) / 100, angle: 45 },
    { opp: 1, adj: Math.round(Math.sqrt(3) * 100) / 100, hyp: 2, angle: 30 },
    { opp: Math.round(Math.sqrt(3) * 100) / 100, adj: 1, hyp: 2, angle: 60 },
  ];
  const chosen = rng.pick(sides);

  const params: Record<string, number | string> = { opp: chosen.opp, adj: chosen.adj, angle: chosen.angle };
  const svg = makeRightTriangleSvg({
    opp: chosen.opp, adj: chosen.adj, hyp: chosen.hyp, theta: "?",
    labelOpp: `${chosen.opp}`, labelAdj: `${chosen.adj}`, labelHyp: `${chosen.hyp}`,
  });

  return {
    id: makeId("easy", "basic_inverse_integer", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "easy",
    archetype: "basic_inverse_integer",
    prompt: `In the right-angled triangle, the opposite side is ${chosen.opp} and the adjacent side is ${chosen.adj}. Find angle θ.`,
    answer: `${chosen.angle}`,
    worked_solution: [
      `tan θ = opposite / adjacent = ${chosen.opp} / ${chosen.adj}.`,
      `θ = tan⁻¹(${chosen.opp} / ${chosen.adj}) = ${chosen.angle}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "special_angles"],
      estimated_time_sec: 25,
      visual: { type: "svg", svg, alt: `Right triangle with opp=${chosen.opp}, adj=${chosen.adj}, find θ`, width: 420, height: 320 },
    },
  };
}

function easyBasicInverseNiceTriple(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 4));
  const [a, b, c] = triple;
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);
  let ratio: number, ratioStr: string;

  if (fnName === "sin") { ratio = a / c; ratioStr = `${a}/${c}`; }
  else if (fnName === "cos") { ratio = b / c; ratioStr = `${b}/${c}`; }
  else { ratio = a / b; ratioStr = `${a}/${b}`; }

  const angle = roundTo(
    fnName === "sin" ? Math.asin(ratio) * 180 / Math.PI :
    fnName === "cos" ? Math.acos(ratio) * 180 / Math.PI :
    Math.atan(ratio) * 180 / Math.PI, 1
  );

  const params: Record<string, number | string> = { a, b, c, fn: fnName };
  const svg = makeRightTriangleSvg({
    opp: a, adj: b, hyp: c, theta: "?",
    labelOpp: `${a}`, labelAdj: `${b}`, labelHyp: `${c}`,
  });

  return {
    id: makeId("easy", "basic_inverse_nice", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "easy",
    archetype: "basic_inverse_nice",
    prompt: `In a right-angled triangle with sides ${a}, ${b}, and ${c}, find angle θ using ${fnName}⁻¹. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `${fnName} θ = ${ratioStr} = ${simplifyFrac(fnName === "sin" ? a : fnName === "cos" ? b : a, fnName === "sin" ? c : fnName === "cos" ? c : b)}.`,
      `θ = ${fnName}⁻¹(${ratioStr}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: [`inverse_${fnName}`, "identify_sides"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Right triangle with sides ${a}, ${b}, ${c}, find θ`, width: 420, height: 320 },
    },
  };
}

function mediumDecimalAnswer1dp(rng: SeededRandom): GeneratedQuestion {
  const opp = rng.randInt(3, 20);
  const adj = rng.randInt(3, 20);
  while (opp === adj) { return mediumDecimalAnswer1dp(rng); }
  const hyp = roundTo(Math.sqrt(opp * opp + adj * adj), 2);
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);

  let ratio: number, ratioStr: string;
  if (fnName === "sin") { ratio = opp / hyp; ratioStr = `${opp}/${roundTo(hyp, 2)}`; }
  else if (fnName === "cos") { ratio = adj / hyp; ratioStr = `${adj}/${roundTo(hyp, 2)}`; }
  else { ratio = opp / adj; ratioStr = `${opp}/${adj}`; }

  const angle = roundTo(
    fnName === "sin" ? Math.asin(ratio) * 180 / Math.PI :
    fnName === "cos" ? Math.acos(ratio) * 180 / Math.PI :
    Math.atan(ratio) * 180 / Math.PI, 1
  );

  const params: Record<string, number | string> = { opp, adj, fn: fnName };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta: "?",
    labelOpp: `${opp}`, labelAdj: `${adj}`, labelHyp: `${roundTo(hyp, 2)}`,
    showHyp: fnName !== "tan",
  });

  return {
    id: makeId("medium", "decimal_1dp", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "medium",
    archetype: "decimal_1dp",
    prompt: `In a right-angled triangle, the opposite side is ${opp} and the ${fnName === "tan" ? "adjacent side is " + adj : "hypotenuse is " + roundTo(hyp, 2)}. Find angle θ using ${fnName}⁻¹. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `${fnName} θ = ${ratioStr}.`,
      `θ = ${fnName}⁻¹(${roundTo(ratio, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: [`inverse_${fnName}`, "calculator_use", "decimal_rounding"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Right triangle, find angle θ to 1dp`, width: 420, height: 320 },
    },
  };
}

function mediumNearestDegree(rng: SeededRandom): GeneratedQuestion {
  const opp = rng.randInt(4, 25);
  const adj = rng.randInt(4, 25);
  while (opp === adj) { return mediumNearestDegree(rng); }
  const hyp = roundTo(Math.sqrt(opp * opp + adj * adj), 2);
  const angle = Math.round(Math.atan(opp / adj) * 180 / Math.PI);

  const params: Record<string, number | string> = { opp, adj };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta: "?",
    labelOpp: `${opp}`, labelAdj: `${adj}`, labelHyp: `${roundTo(hyp, 1)}`,
  });

  return {
    id: makeId("medium", "nearest_degree", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "medium",
    archetype: "nearest_degree",
    prompt: `In a right-angled triangle, the opposite side is ${opp} and the adjacent side is ${adj}. Find angle θ to the nearest degree.`,
    answer: `${angle}`,
    worked_solution: [
      `tan θ = opposite / adjacent = ${opp} / ${adj} = ${roundTo(opp / adj, 4)}.`,
      `θ = tan⁻¹(${roundTo(opp / adj, 4)}) = ${roundTo(Math.atan(opp / adj) * 180 / Math.PI, 2)}°.`,
      `Rounded to the nearest degree: θ = ${angle}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "rounding"],
      estimated_time_sec: 35,
      visual: { type: "svg", svg, alt: `Right triangle with opp=${opp}, adj=${adj}, find θ to nearest degree`, width: 420, height: 320 },
    },
  };
}

function mediumAngleOfElevation(rng: SeededRandom): GeneratedQuestion {
  const height = rng.randInt(5, 50);
  const distance = rng.randInt(10, 80);
  const angle = roundTo(Math.atan(height / distance) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { height, distance };
  const svg = makeRightTriangleSvg({
    opp: height, adj: distance, hyp: roundTo(Math.sqrt(height * height + distance * distance), 1), theta: "?",
    labelOpp: `${height} m`, labelAdj: `${distance} m`,
    showHyp: false,
  });

  return {
    id: makeId("medium", "angle_of_elevation", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "medium",
    archetype: "angle_of_elevation",
    prompt: `A person stands ${distance} m from the base of a building that is ${height} m tall. Find the angle of elevation from the person to the top of the building. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `The opposite side (building height) = ${height} m and the adjacent side (distance) = ${distance} m.`,
      `tan θ = opposite / adjacent = ${height} / ${distance} = ${roundTo(height / distance, 4)}.`,
      `θ = tan⁻¹(${roundTo(height / distance, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "word_problem", "angle_of_elevation"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Building height ${height}m, distance ${distance}m, find angle of elevation`, width: 420, height: 320 },
    },
  };
}

function mediumAngleOfDepression(rng: SeededRandom): GeneratedQuestion {
  const height = rng.randInt(10, 60);
  const distance = rng.randInt(15, 100);
  const angle = roundTo(Math.atan(height / distance) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { height, distance };
  const svg = makeRightTriangleSvg({
    opp: height, adj: distance, hyp: roundTo(Math.sqrt(height * height + distance * distance), 1), theta: "?",
    labelOpp: `${height} m`, labelAdj: `${distance} m`,
    showHyp: false,
  });

  return {
    id: makeId("medium", "angle_of_depression", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "medium",
    archetype: "angle_of_depression",
    prompt: `From the top of a ${height} m cliff, a boat is spotted ${distance} m from the base of the cliff. Find the angle of depression. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `The vertical drop (opposite) = ${height} m and the horizontal distance (adjacent) = ${distance} m.`,
      `tan θ = opposite / adjacent = ${height} / ${distance} = ${roundTo(height / distance, 4)}.`,
      `θ = tan⁻¹(${roundTo(height / distance, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "word_problem", "angle_of_depression"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Cliff height ${height}m, distance ${distance}m, find angle of depression`, width: 420, height: 320 },
    },
  };
}

function mediumRampAngle(rng: SeededRandom): GeneratedQuestion {
  const rise = rng.randInt(1, 8);
  const run = rng.randInt(10, 40);
  const angle = roundTo(Math.atan(rise / run) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { rise, run };
  const svg = makeRightTriangleSvg({
    opp: rise, adj: run, hyp: roundTo(Math.sqrt(rise * rise + run * run), 1), theta: "?",
    labelOpp: `${rise} m`, labelAdj: `${run} m`,
    showHyp: false,
  });

  return {
    id: makeId("medium", "ramp_angle", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "medium",
    archetype: "ramp_angle",
    prompt: `A ramp rises ${rise} m over a horizontal distance of ${run} m. Find the angle the ramp makes with the ground. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `The rise (opposite) = ${rise} m and the run (adjacent) = ${run} m.`,
      `tan θ = ${rise} / ${run} = ${roundTo(rise / run, 4)}.`,
      `θ = tan⁻¹(${roundTo(rise / run, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "word_problem"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Ramp with rise ${rise}m, run ${run}m, find angle`, width: 420, height: 320 },
    },
  };
}

function mediumFindOtherAcuteAngle(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 8));
  const [a, b, c] = triple;
  const givenAngle = roundTo(Math.atan(a / b) * 180 / Math.PI, 1);
  const otherAngle = roundTo(90 - givenAngle, 1);

  const params: Record<string, number | string> = { a, b, c, givenAngle };
  const svg = makeRightTriangleSvg({
    opp: a, adj: b, hyp: c, theta: formatAngle(givenAngle),
    labelOpp: `${a}`, labelAdj: `${b}`, labelHyp: `${c}`,
  });

  return {
    id: makeId("medium", "find_other_acute", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "medium",
    archetype: "find_other_acute",
    prompt: `In a right-angled triangle, one acute angle is ${formatAngle(givenAngle)}°. Find the other acute angle. Round to 1 decimal place.`,
    answer: formatAngle(otherAngle),
    worked_solution: [
      `The sum of angles in a triangle = 180°.`,
      `One angle is 90° (right angle) and another is ${formatAngle(givenAngle)}°.`,
      `Other acute angle = 180° − 90° − ${formatAngle(givenAngle)}° = ${formatAngle(otherAngle)}°.`,
    ],
    metadata: {
      params,
      skills: ["angle_sum", "complementary_angles"],
      estimated_time_sec: 20,
      visual: { type: "svg", svg, alt: `Right triangle with one angle ${formatAngle(givenAngle)}°, find other`, width: 420, height: 320 },
    },
  };
}

function mediumScaledTriple(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 6));
  const scale = rng.pick([2, 3, 4, 5]);
  const [a, b, c] = [triple[0] * scale, triple[1] * scale, triple[2] * scale];
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);

  let ratio: number;
  if (fnName === "sin") ratio = a / c;
  else if (fnName === "cos") ratio = b / c;
  else ratio = a / b;

  const angle = roundTo(
    fnName === "sin" ? Math.asin(ratio) * 180 / Math.PI :
    fnName === "cos" ? Math.acos(ratio) * 180 / Math.PI :
    Math.atan(ratio) * 180 / Math.PI, 1
  );

  const params: Record<string, number | string> = { a, b, c, fn: fnName, scale };
  const svg = makeRightTriangleSvg({
    opp: a, adj: b, hyp: c, theta: "?",
    labelOpp: `${a}`, labelAdj: `${b}`, labelHyp: `${c}`,
  });

  return {
    id: makeId("medium", "scaled_triple", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "medium",
    archetype: "scaled_triple",
    prompt: `In a right-angled triangle with sides ${a}, ${b}, and ${c}, find angle θ using ${fnName}⁻¹. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `${fnName} θ = ${fnName === "sin" ? `${a}/${c}` : fnName === "cos" ? `${b}/${c}` : `${a}/${b}`} = ${roundTo(ratio, 4)}.`,
      `θ = ${fnName}⁻¹(${roundTo(ratio, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: [`inverse_${fnName}`, "scaled_triples"],
      estimated_time_sec: 35,
      visual: { type: "svg", svg, alt: `Right triangle with scaled sides, find θ`, width: 420, height: 320 },
    },
  };
}

function hardPythagorasThenAngle(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 8));
  const [a, b, c] = triple;
  const missingScenario = rng.pick(["missing_opp", "missing_adj"]);

  let knownA: number, knownB: number, missing: number, missingName: string;
  if (missingScenario === "missing_opp") {
    knownA = b; knownB = c; missing = a; missingName = "opposite";
  } else {
    knownA = a; knownB = c; missing = b; missingName = "adjacent";
  }

  const angle = roundTo(Math.atan(a / b) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { a, b, c, missing: missingName };
  const svg = makeRightTriangleSvg({
    opp: missingScenario === "missing_opp" ? "?" : a,
    adj: missingScenario === "missing_adj" ? "?" : b,
    hyp: c, theta: "?",
    labelOpp: missingScenario === "missing_opp" ? "?" : `${a}`,
    labelAdj: missingScenario === "missing_adj" ? "?" : `${b}`,
    labelHyp: `${c}`,
  });

  return {
    id: makeId("hard", "pythagoras_then_angle", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "hard",
    archetype: "pythagoras_then_angle",
    prompt: `In a right-angled triangle, the ${missingScenario === "missing_opp" ? `adjacent side is ${b} and hypotenuse is ${c}` : `opposite side is ${a} and hypotenuse is ${c}`}. First find the missing side using Pythagoras' theorem, then find angle θ. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `Use Pythagoras: ${missingScenario === "missing_opp" ? `opposite = √(${c}² − ${b}²) = √(${c * c} − ${b * b}) = √${a * a} = ${a}` : `adjacent = √(${c}² − ${a}²) = √(${c * c} − ${a * a}) = √${b * b} = ${b}`}.`,
      `Now tan θ = opposite / adjacent = ${a} / ${b} = ${roundTo(a / b, 4)}.`,
      `θ = tan⁻¹(${roundTo(a / b, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["pythagoras", "inverse_tan", "multi_step"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Right triangle with missing side, find θ after Pythagoras`, width: 420, height: 320 },
    },
  };
}

function hardAlgebraicSidesAngle(rng: SeededRandom): GeneratedQuestion {
  const k1 = rng.randInt(2, 6);
  const k2 = rng.randInt(2, 6);
  while (k1 === k2) { return hardAlgebraicSidesAngle(rng); }
  const variable = rng.pick(["x", "a", "n"]);
  const angle = roundTo(Math.atan(k1 / k2) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { k1, k2, var: variable };
  const svg = makeRightTriangleSvg({
    opp: `${k1}${variable}`, adj: `${k2}${variable}`, hyp: "?", theta: "?",
    labelOpp: `${k1}${variable}`, labelAdj: `${k2}${variable}`,
    showHyp: false,
  });

  return {
    id: makeId("hard", "algebraic_sides_angle", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "hard",
    archetype: "algebraic_sides_angle",
    prompt: `In a right-angled triangle, the opposite side is ${k1}${variable} and the adjacent side is ${k2}${variable}. Find angle θ. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `tan θ = opposite / adjacent = ${k1}${variable} / ${k2}${variable}.`,
      `The ${variable} cancels: tan θ = ${k1}/${k2} = ${roundTo(k1 / k2, 4)}.`,
      `θ = tan⁻¹(${k1}/${k2}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "algebraic_simplification"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Right triangle with algebraic sides ${k1}${variable}, ${k2}${variable}, find θ`, width: 420, height: 320 },
    },
  };
}

function hardBothAcuteAngles(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 8));
  const [a, b, c] = triple;
  const angle1 = roundTo(Math.atan(a / b) * 180 / Math.PI, 1);
  const angle2 = roundTo(90 - angle1, 1);

  const params: Record<string, number | string> = { a, b, c };
  const svg = makeRightTriangleSvg({
    opp: a, adj: b, hyp: c, theta: "?",
    labelOpp: `${a}`, labelAdj: `${b}`, labelHyp: `${c}`,
  });

  return {
    id: makeId("hard", "both_acute_angles", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "hard",
    archetype: "both_acute_angles",
    prompt: `In a right-angled triangle with sides ${a}, ${b}, and ${c} (hypotenuse), find both acute angles. Give both answers rounded to 1 decimal place, separated by a comma (smaller first).`,
    answer: `${formatAngle(Math.min(angle1, angle2))}, ${formatAngle(Math.max(angle1, angle2))}`,
    worked_solution: [
      `tan θ₁ = ${a}/${b} = ${roundTo(a / b, 4)}.`,
      `θ₁ = tan⁻¹(${roundTo(a / b, 4)}) = ${formatAngle(angle1)}°.`,
      `θ₂ = 90° − ${formatAngle(angle1)}° = ${formatAngle(angle2)}°.`,
      `Both acute angles: ${formatAngle(Math.min(angle1, angle2))}° and ${formatAngle(Math.max(angle1, angle2))}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "complementary_angles"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Right triangle with sides ${a}, ${b}, ${c}, find both acute angles`, width: 420, height: 320 },
    },
  };
}

function hardTwoTrianglesSharedSide(rng: SeededRandom): GeneratedQuestion {
  const h = rng.randInt(5, 15);
  const base1 = rng.randInt(3, 12);
  const base2 = rng.randInt(3, 12);
  while (base1 === base2) { return hardTwoTrianglesSharedSide(rng); }

  const angle1 = roundTo(Math.atan(h / base1) * 180 / Math.PI, 1);
  const angle2 = roundTo(Math.atan(h / base2) * 180 / Math.PI, 1);
  const totalAngle = roundTo(angle1 + angle2, 1);

  const params: Record<string, number | string> = { h, base1, base2 };
  const svg = makeRightTriangleSvg({
    opp: h, adj: base1 + base2, hyp: "—", theta: "?",
    labelOpp: `${h}`, labelAdj: `${base1} + ${base2}`,
    showHyp: false,
  });

  return {
    id: makeId("hard", "two_triangles_shared", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "hard",
    archetype: "two_triangles_shared",
    prompt: `A vertical pole of height ${h} m stands on level ground. Two guy wires are attached to its top, anchored at ${base1} m and ${base2} m from the base on opposite sides. Find the total angle between the two wires (sum of both angles of elevation). Round to 1 decimal place.`,
    answer: formatAngle(totalAngle),
    worked_solution: [
      `Angle 1: tan⁻¹(${h}/${base1}) = tan⁻¹(${roundTo(h / base1, 4)}) = ${formatAngle(angle1)}°.`,
      `Angle 2: tan⁻¹(${h}/${base2}) = tan⁻¹(${roundTo(h / base2, 4)}) = ${formatAngle(angle2)}°.`,
      `Total angle = ${formatAngle(angle1)}° + ${formatAngle(angle2)}° = ${formatAngle(totalAngle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "multi_step", "word_problem"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Two triangles sharing vertical side ${h}, bases ${base1} and ${base2}`, width: 420, height: 320 },
    },
  };
}

function hardCoordinateTriangleAngle(rng: SeededRandom): GeneratedQuestion {
  const coords: [number, number, number, number][] = [
    [0, 0, 3, 4], [0, 0, 5, 12], [0, 0, 8, 6], [0, 0, 4, 3],
    [1, 1, 4, 5], [2, 1, 5, 5], [0, 0, 6, 8],
  ];
  const picked = rng.pick(coords);
  const [x1, y1, x2, y2] = picked;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = roundTo(Math.atan(dy / dx) * 180 / Math.PI, 1);

  const pts = {
    A: [x1, y1] as [number, number],
    B: [x2, y1] as [number, number],
    C: [x2, y2] as [number, number],
  };

  const params: Record<string, number | string> = { x1, y1, x2, y2 };
  const svg = makeCoordinateTriangleSvg(pts, "A", 420, 320);

  return {
    id: makeId("hard", "coordinate_triangle_angle", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "hard",
    archetype: "coordinate_triangle_angle",
    prompt: `A right-angled triangle has vertices at A(${x1},${y1}), B(${x2},${y1}), and C(${x2},${y2}). Find angle θ at vertex A. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `The horizontal side (adjacent) = ${x2} − ${x1} = ${dx}.`,
      `The vertical side (opposite) = ${y2} − ${y1} = ${dy}.`,
      `tan θ = ${dy}/${dx} = ${roundTo(dy / dx, 4)}.`,
      `θ = tan⁻¹(${roundTo(dy / dx, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "coordinate_geometry"],
      estimated_time_sec: 55,
      visual: { type: "svg", svg, alt: `Coordinate triangle A(${x1},${y1}), B(${x2},${y1}), C(${x2},${y2}), find angle at A`, width: 420, height: 320 },
    },
  };
}

function hardDecimalSidesAngle(rng: SeededRandom): GeneratedQuestion {
  const opp = roundTo(rng.randInt(30, 150) / 10, 1);
  const adj = roundTo(rng.randInt(30, 150) / 10, 1);
  const hyp = roundTo(Math.sqrt(opp * opp + adj * adj), 2);
  const fnName: TrigFn = rng.pick(["sin", "cos"]);

  let ratio: number;
  if (fnName === "sin") ratio = opp / hyp;
  else ratio = adj / hyp;

  const angle = roundTo(
    fnName === "sin" ? Math.asin(ratio) * 180 / Math.PI :
    Math.acos(ratio) * 180 / Math.PI, 1
  );

  const params: Record<string, number | string> = { opp, adj, fn: fnName };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta: "?",
    labelOpp: `${opp}`, labelAdj: `${adj}`, labelHyp: `${hyp}`,
  });

  return {
    id: makeId("hard", "decimal_sides_angle", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "hard",
    archetype: "decimal_sides_angle",
    prompt: `In a right-angled triangle, the ${fnName === "sin" ? `opposite side is ${opp} and hypotenuse is ${hyp}` : `adjacent side is ${adj} and hypotenuse is ${hyp}`}. Find angle θ using ${fnName}⁻¹. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `${fnName} θ = ${fnName === "sin" ? `${opp}/${hyp}` : `${adj}/${hyp}`} = ${roundTo(ratio, 4)}.`,
      `θ = ${fnName}⁻¹(${roundTo(ratio, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: [`inverse_${fnName}`, "decimal_computation"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Right triangle with decimal sides, find angle θ`, width: 420, height: 320 },
    },
  };
}

function challengeMultiStepPythagorasInverse(rng: SeededRandom): GeneratedQuestion {
  const a = rng.randInt(5, 15);
  const b = rng.randInt(5, 15);
  while (a === b) { return challengeMultiStepPythagorasInverse(rng); }
  const c = roundTo(Math.sqrt(a * a + b * b), 2);
  const angle = roundTo(Math.asin(a / c) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { a, b };
  const svg = makeRightTriangleSvg({
    opp: a, adj: b, hyp: "?", theta: "?",
    labelOpp: `${a}`, labelAdj: `${b}`, labelHyp: "?",
  });

  return {
    id: makeId("challenge", "multi_step_pythag_inverse", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "challenge",
    archetype: "multi_step_pythag_inverse",
    prompt: `In a right-angled triangle, the opposite side is ${a} and the adjacent side is ${b}. First find the hypotenuse using Pythagoras' theorem, then find angle θ using sin⁻¹. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `Hypotenuse = √(${a}² + ${b}²) = √(${a * a} + ${b * b}) = √${a * a + b * b} ≈ ${c}.`,
      `sin θ = ${a}/${c} = ${roundTo(a / c, 4)}.`,
      `θ = sin⁻¹(${roundTo(a / c, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["pythagoras", "inverse_sin", "multi_step"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Right triangle opp=${a}, adj=${b}, find hyp then angle`, width: 420, height: 320 },
    },
  };
}

function challengeIdentifyWhichAngle(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 6));
  const [a, b, c] = triple;
  const targetAngle = rng.pick(["at_opp_side", "at_adj_side"]);

  let angle: number, description: string;
  if (targetAngle === "at_opp_side") {
    angle = roundTo(Math.atan(b / a) * 180 / Math.PI, 1);
    description = `the angle at the vertex between the opposite side (${a}) and the hypotenuse (${c})`;
  } else {
    angle = roundTo(Math.atan(a / b) * 180 / Math.PI, 1);
    description = `the angle at the vertex between the adjacent side (${b}) and the hypotenuse (${c})`;
  }

  const params: Record<string, number | string> = { a, b, c, target: targetAngle };
  const svg = makeRightTriangleSvg({
    opp: a, adj: b, hyp: c, theta: "?",
    labelOpp: `${a}`, labelAdj: `${b}`, labelHyp: `${c}`,
  });

  return {
    id: makeId("challenge", "identify_which_angle", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "challenge",
    archetype: "identify_which_angle",
    prompt: `In a right-angled triangle with sides ${a}, ${b}, and ${c} (hypotenuse), find ${description}. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `Identify the sides relative to the required angle.`,
      targetAngle === "at_opp_side"
        ? `At this vertex, opposite = ${b}, adjacent = ${a}. tan θ = ${b}/${a} = ${roundTo(b / a, 4)}.`
        : `At this vertex, opposite = ${a}, adjacent = ${b}. tan θ = ${a}/${b} = ${roundTo(a / b, 4)}.`,
      `θ = tan⁻¹(${targetAngle === "at_opp_side" ? roundTo(b / a, 4) : roundTo(a / b, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "identify_sides", "angle_identification"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Right triangle, identify and find specific angle`, width: 420, height: 320 },
    },
  };
}

function challengeExactAngleFromSurd(rng: SeededRandom): GeneratedQuestion {
  const surdAngles: { ratio: string; fnName: TrigFn; angle: number }[] = [
    { ratio: "sqrt(3)", fnName: "tan", angle: 60 },
    { ratio: "1/sqrt(3)", fnName: "tan", angle: 30 },
    { ratio: "1", fnName: "tan", angle: 45 },
    { ratio: "sqrt(3)/2", fnName: "sin", angle: 60 },
    { ratio: "sqrt(2)/2", fnName: "sin", angle: 45 },
    { ratio: "1/2", fnName: "cos", angle: 60 },
    { ratio: "sqrt(3)/2", fnName: "cos", angle: 30 },
  ];
  const chosen = rng.pick(surdAngles);

  const params: Record<string, number | string> = { ratio: chosen.ratio, fn: chosen.fnName, angle: chosen.angle };
  const svg = makeRightTriangleSvg({
    opp: chosen.fnName === "sin" ? chosen.ratio : (chosen.fnName === "tan" ? chosen.ratio : "?"),
    adj: chosen.fnName === "cos" ? chosen.ratio : (chosen.fnName === "tan" ? "1" : "?"),
    hyp: chosen.fnName === "tan" ? "?" : "1",
    theta: "?",
    showHyp: chosen.fnName !== "tan",
    showOpp: chosen.fnName === "sin" || chosen.fnName === "tan",
    showAdj: chosen.fnName === "cos" || chosen.fnName === "tan",
  });

  return {
    id: makeId("challenge", "exact_angle_surd", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "challenge",
    archetype: "exact_angle_surd",
    prompt: `Find the exact angle θ if ${chosen.fnName} θ = ${chosen.ratio}. Give your answer in degrees.`,
    answer: `${chosen.angle}`,
    worked_solution: [
      `${chosen.fnName} θ = ${chosen.ratio}.`,
      `Recognise this as a standard exact value.`,
      `θ = ${chosen.fnName}⁻¹(${chosen.ratio}) = ${chosen.angle}°.`,
    ],
    metadata: {
      params,
      skills: [`inverse_${chosen.fnName}`, "exact_values", "special_angles"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Triangle with ${chosen.fnName} θ = ${chosen.ratio}`, width: 420, height: 320 },
    },
  };
}

function challengeAngleWithAreaPerimeter(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 6));
  const [a, b, c] = triple;
  const area = (a * b) / 2;
  const perimeter = a + b + c;
  const angle = roundTo(Math.atan(a / b) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { a, b, c };
  const svg = makeRightTriangleSvg({
    opp: a, adj: b, hyp: c, theta: "?",
    labelOpp: `${a}`, labelAdj: `${b}`, labelHyp: `${c}`,
  });

  return {
    id: makeId("challenge", "angle_area_perimeter", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "challenge",
    archetype: "angle_area_perimeter",
    prompt: `A right-angled triangle has sides ${a}, ${b}, and ${c}. Find: (a) the area, (b) the perimeter, and (c) angle θ to 1 decimal place. Give your answer for θ only.`,
    answer: formatAngle(angle),
    worked_solution: [
      `Area = ½ × ${a} × ${b} = ${area} square units.`,
      `Perimeter = ${a} + ${b} + ${c} = ${perimeter} units.`,
      `tan θ = ${a}/${b} = ${roundTo(a / b, 4)}.`,
      `θ = tan⁻¹(${roundTo(a / b, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "area", "perimeter", "multi_step"],
      estimated_time_sec: 75,
      visual: { type: "svg", svg, alt: `Right triangle, find area, perimeter and angle`, width: 420, height: 320 },
    },
  };
}

function challengeComplexRealWorld(rng: SeededRandom): GeneratedQuestion {
  const scenarios = [
    {
      prompt: (h: number, d1: number, d2: number) => `A lighthouse is ${h} m tall. From the top, two boats are spotted at distances ${d1} m and ${d2} m from the base. Find the difference between the two angles of depression. Round to 1 decimal place.`,
      make: (rng: SeededRandom) => {
        const h = rng.randInt(20, 50);
        const d1 = rng.randInt(30, 80);
        const d2 = rng.randInt(90, 200);
        const a1 = Math.atan(h / d1) * 180 / Math.PI;
        const a2 = Math.atan(h / d2) * 180 / Math.PI;
        const diff = roundTo(Math.abs(a1 - a2), 1);
        return { h, d1, d2, a1: roundTo(a1, 1), a2: roundTo(a2, 1), answer: diff };
      },
    },
    {
      prompt: (h: number, d1: number, _d2: number) => `A helicopter is flying at ${h} m altitude. It needs to descend to a landing pad ${d1} m away horizontally. What descent angle (angle of depression) is needed? Round to 1 decimal place.`,
      make: (rng: SeededRandom) => {
        const h = rng.randInt(100, 500);
        const d1 = rng.randInt(500, 2000);
        const a1 = Math.atan(h / d1) * 180 / Math.PI;
        return { h, d1, d2: 0, a1: roundTo(a1, 1), a2: 0, answer: roundTo(a1, 1) };
      },
    },
  ];

  const scenario = rng.pick(scenarios);
  const data = scenario.make(rng);

  const params: Record<string, number | string> = { h: data.h, d1: data.d1, d2: data.d2 };
  const svg = makeRightTriangleSvg({
    opp: data.h, adj: data.d1, hyp: "—", theta: "?",
    labelOpp: `${data.h} m`, labelAdj: `${data.d1} m`,
    showHyp: false,
  });

  return {
    id: makeId("challenge", "complex_real_world", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "challenge",
    archetype: "complex_real_world",
    prompt: scenario.prompt(data.h, data.d1, data.d2),
    answer: formatAngle(data.answer),
    worked_solution: [
      `Angle 1: tan⁻¹(${data.h}/${data.d1}) = ${formatAngle(data.a1)}°.`,
      data.d2 > 0 ? `Angle 2: tan⁻¹(${data.h}/${data.d2}) = ${formatAngle(data.a2)}°.` : "",
      data.d2 > 0 ? `Difference = ${formatAngle(data.a1)}° − ${formatAngle(data.a2)}° = ${formatAngle(data.answer)}°.` : `Answer: ${formatAngle(data.answer)}°.`,
    ].filter(s => s !== ""),
    metadata: {
      params,
      skills: ["inverse_tan", "word_problem", "multi_step"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Real-world scenario with height ${data.h}m`, width: 420, height: 320 },
    },
  };
}

function challengeCoordinateAngle(rng: SeededRandom): GeneratedQuestion {
  const x1 = rng.randInt(0, 3);
  const y1 = rng.randInt(0, 3);
  const x2 = x1 + rng.randInt(3, 8);
  const y2 = y1 + rng.randInt(3, 8);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const hyp = roundTo(Math.sqrt(dx * dx + dy * dy), 2);
  const angleAtA = roundTo(Math.atan(dy / dx) * 180 / Math.PI, 1);
  const angleAtC = roundTo(90 - angleAtA, 1);

  const pts = {
    A: [x1, y1] as [number, number],
    B: [x2, y1] as [number, number],
    C: [x2, y2] as [number, number],
  };

  const params: Record<string, number | string> = { x1, y1, x2, y2 };
  const svg = makeCoordinateTriangleSvg(pts, "A and C", 420, 320);

  return {
    id: makeId("challenge", "coordinate_both_angles", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "challenge",
    archetype: "coordinate_both_angles",
    prompt: `Triangle ABC has vertices A(${x1},${y1}), B(${x2},${y1}), C(${x2},${y2}) with the right angle at B. Find angle θ at vertex A. Round to 1 decimal place.`,
    answer: formatAngle(angleAtA),
    worked_solution: [
      `AB (adjacent) = ${x2} − ${x1} = ${dx}.`,
      `BC (opposite) = ${y2} − ${y1} = ${dy}.`,
      `tan θ_A = BC/AB = ${dy}/${dx} = ${roundTo(dy / dx, 4)}.`,
      `θ_A = tan⁻¹(${roundTo(dy / dx, 4)}) = ${formatAngle(angleAtA)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "coordinate_geometry", "multi_step"],
      estimated_time_sec: 70,
      visual: { type: "svg", svg, alt: `Coordinate triangle, find angles at A and C`, width: 420, height: 320 },
    },
  };
}

function challengeCombinedAreaAngle(rng: SeededRandom): GeneratedQuestion {
  const area = rng.randInt(20, 100);
  const base = rng.randInt(4, 15);
  const height = roundTo((2 * area) / base, 2);
  const hyp = roundTo(Math.sqrt(base * base + height * height), 2);
  const angle = roundTo(Math.atan(height / base) * 180 / Math.PI, 1);

  const params: Record<string, number | string> = { area, base };
  const svg = makeRightTriangleSvg({
    opp: "?", adj: base, hyp: "?", theta: "?",
    labelOpp: "?", labelAdj: `${base}`,
    showHyp: false,
  });

  return {
    id: makeId("challenge", "combined_area_angle", params),
    topic: "finding_unknown_angles_trig",
    difficulty: "challenge",
    archetype: "combined_area_angle",
    prompt: `A right-angled triangle has area ${area} square units and base (adjacent side) ${base} units. Find the height (opposite side), then find angle θ. Round to 1 decimal place.`,
    answer: formatAngle(angle),
    worked_solution: [
      `Area = ½ × base × height → ${area} = ½ × ${base} × height.`,
      `height = 2 × ${area} / ${base} = ${height}.`,
      `tan θ = height / base = ${height} / ${base} = ${roundTo(height / base, 4)}.`,
      `θ = tan⁻¹(${roundTo(height / base, 4)}) = ${formatAngle(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "area_formula", "multi_step"],
      estimated_time_sec: 75,
      visual: { type: "svg", svg, alt: `Right triangle with area ${area}, base ${base}, find angle`, width: 420, height: 320 },
    },
  };
}

const EASY_ARCHETYPES: ArchetypeFn[] = [
  easyFindAngleSinPythagorean,
  easyFindAngleCosPythagorean,
  easyFindAngleTanPythagorean,
  easyRecogniseSpecialAngleSin,
  easyRecogniseSpecialAngleCos,
  easyRecogniseSpecialAngleTan,
  easyBasicInverseIntegerAnswer,
  easyBasicInverseNiceTriple,
];

const MEDIUM_ARCHETYPES: ArchetypeFn[] = [
  mediumDecimalAnswer1dp,
  mediumNearestDegree,
  mediumAngleOfElevation,
  mediumAngleOfDepression,
  mediumRampAngle,
  mediumFindOtherAcuteAngle,
  mediumScaledTriple,
  mediumDecimalAnswer1dp,
];

const HARD_ARCHETYPES: ArchetypeFn[] = [
  hardPythagorasThenAngle,
  hardAlgebraicSidesAngle,
  hardBothAcuteAngles,
  hardTwoTrianglesSharedSide,
  hardCoordinateTriangleAngle,
  hardDecimalSidesAngle,
  hardPythagorasThenAngle,
];

const CHALLENGE_ARCHETYPES: ArchetypeFn[] = [
  challengeMultiStepPythagorasInverse,
  challengeIdentifyWhichAngle,
  challengeExactAngleFromSurd,
  challengeAngleWithAreaPerimeter,
  challengeComplexRealWorld,
  challengeCoordinateAngle,
  challengeCombinedAreaAngle,
];

function getArchetypes(difficulty: string): ArchetypeFn[] {
  switch (difficulty) {
    case "easy": return EASY_ARCHETYPES;
    case "medium": return MEDIUM_ARCHETYPES;
    case "hard": return HARD_ARCHETYPES;
    case "challenge": return CHALLENGE_ARCHETYPES;
    default: return EASY_ARCHETYPES;
  }
}

export function generateQuestion(difficulty: string, seed: number): GeneratedQuestion {
  const rng = new SeededRandom(seed);
  const archetypes = getArchetypes(difficulty);
  const idx = Math.floor(rng.next() * archetypes.length);
  return archetypes[idx](rng);
}

export function generatePool(
  difficulty: string,
  n: number,
  seed?: number,
  ensure_unique: boolean = true,
): GeneratedQuestion[] {
  const baseSeed = seed ?? Math.floor(Math.random() * 1e9);
  const results: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  const maxAttempts = n * 30;

  while (results.length < n && attempts < maxAttempts) {
    const q = generateQuestion(difficulty, baseSeed * 7 + attempts * 31);
    attempts++;
    if (ensure_unique && seen.has(q.id)) continue;
    seen.add(q.id);
    results.push(q);
  }
  return results;
}

export function generateMixedPool(
  config: { difficulty: string; count: number }[],
  seed?: number,
): GeneratedQuestion[] {
  const baseSeed = seed ?? Math.floor(Math.random() * 1e9);
  const results: GeneratedQuestion[] = [];
  let offset = 0;
  for (const { difficulty, count } of config) {
    const pool = generatePool(difficulty, count, baseSeed + offset, true);
    results.push(...pool);
    offset += count * 20;
  }
  return results;
}
