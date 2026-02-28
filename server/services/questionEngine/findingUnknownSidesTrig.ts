import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "finding_unknown_sides_trig";
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

const SPECIAL_ANGLES: Record<number, { sin: string; cos: string; tan: string; sinVal: number; cosVal: number; tanVal: number }> = {
  30: { sin: "1/2", cos: "sqrt(3)/2", tan: "1/sqrt(3)", sinVal: 0.5, cosVal: Math.sqrt(3) / 2, tanVal: 1 / Math.sqrt(3) },
  45: { sin: "sqrt(2)/2", cos: "sqrt(2)/2", tan: "1", sinVal: Math.sqrt(2) / 2, cosVal: Math.sqrt(2) / 2, tanVal: 1 },
  60: { sin: "sqrt(3)/2", cos: "1/2", tan: "sqrt(3)", sinVal: Math.sqrt(3) / 2, cosVal: 0.5, tanVal: Math.sqrt(3) },
};

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
    const thetaNum = typeof opts.theta === "number" ? opts.theta : 45;
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

function formatAnswer(val: number, dp: number = 2): string {
  const rounded = roundTo(val, dp);
  if (Number.isInteger(rounded)) return `${rounded}`;
  return rounded.toFixed(dp).replace(/0+$/, "").replace(/\.$/, "");
}

function easyFindOppUsingSin(rng: SeededRandom): GeneratedQuestion {
  const angles = [30, 45, 60];
  const theta = rng.pick(angles);
  const hyp = rng.randInt(6, 20);
  const thetaRad = theta * Math.PI / 180;
  const opp = roundTo(hyp * Math.sin(thetaRad), 2);
  const adj = roundTo(hyp * Math.cos(thetaRad), 2);

  const params: Record<string, number | string> = { theta, hyp, variant: "find_opp_sin" };
  const svg = makeRightTriangleSvg({
    opp: "?", adj, hyp, theta,
    labelOpp: "?", labelAdj: `${adj}`, labelHyp: `${hyp}`,
  });

  return {
    id: makeId("easy", "find_opp_sin", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "easy",
    archetype: "find_opp_sin",
    prompt: `In a right-angled triangle, the hypotenuse is ${hyp} and θ = ${theta}°. Find the opposite side.`,
    answer: formatAnswer(opp),
    worked_solution: [
      `sin θ = opposite / hypotenuse.`,
      `sin ${theta}° = opposite / ${hyp}.`,
      `opposite = ${hyp} × sin ${theta}° = ${hyp} × ${Math.sin(thetaRad).toFixed(4)}... = ${formatAnswer(opp)}.`,
    ],
    metadata: {
      params,
      skills: ["apply_sin", "solve_for_side"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Right triangle with hypotenuse=${hyp}, θ=${theta}°, find opposite`, width: 420, height: 320 },
    },
  };
}

function easyFindAdjUsingCos(rng: SeededRandom): GeneratedQuestion {
  const angles = [30, 45, 60];
  const theta = rng.pick(angles);
  const hyp = rng.randInt(6, 20);
  const thetaRad = theta * Math.PI / 180;
  const adj = roundTo(hyp * Math.cos(thetaRad), 2);
  const opp = roundTo(hyp * Math.sin(thetaRad), 2);

  const params: Record<string, number | string> = { theta, hyp, variant: "find_adj_cos" };
  const svg = makeRightTriangleSvg({
    opp, adj: "?", hyp, theta,
    labelOpp: `${opp}`, labelAdj: "?", labelHyp: `${hyp}`,
  });

  return {
    id: makeId("easy", "find_adj_cos", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "easy",
    archetype: "find_adj_cos",
    prompt: `In a right-angled triangle, the hypotenuse is ${hyp} and θ = ${theta}°. Find the adjacent side.`,
    answer: formatAnswer(adj),
    worked_solution: [
      `cos θ = adjacent / hypotenuse.`,
      `cos ${theta}° = adjacent / ${hyp}.`,
      `adjacent = ${hyp} × cos ${theta}° = ${formatAnswer(adj)}.`,
    ],
    metadata: {
      params,
      skills: ["apply_cos", "solve_for_side"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Right triangle with hypotenuse=${hyp}, θ=${theta}°, find adjacent`, width: 420, height: 320 },
    },
  };
}

function easyFindOppUsingTan(rng: SeededRandom): GeneratedQuestion {
  const angles = [30, 45, 60];
  const theta = rng.pick(angles);
  const adj = rng.randInt(4, 16);
  const thetaRad = theta * Math.PI / 180;
  const opp = roundTo(adj * Math.tan(thetaRad), 2);
  const hyp = roundTo(Math.sqrt(opp * opp + adj * adj), 2);

  const params: Record<string, number | string> = { theta, adj, variant: "find_opp_tan" };
  const svg = makeRightTriangleSvg({
    opp: "?", adj, hyp, theta,
    labelOpp: "?", labelAdj: `${adj}`, labelHyp: `${hyp}`,
    showHyp: false,
  });

  return {
    id: makeId("easy", "find_opp_tan", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "easy",
    archetype: "find_opp_tan",
    prompt: `In a right-angled triangle, the adjacent side is ${adj} and θ = ${theta}°. Use tan to find the opposite side.`,
    answer: formatAnswer(opp),
    worked_solution: [
      `tan θ = opposite / adjacent.`,
      `tan ${theta}° = opposite / ${adj}.`,
      `opposite = ${adj} × tan ${theta}° = ${formatAnswer(opp)}.`,
    ],
    metadata: {
      params,
      skills: ["apply_tan", "solve_for_side"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Right triangle with adjacent=${adj}, θ=${theta}°, find opposite`, width: 420, height: 320 },
    },
  };
}

function easyIntegerAnswer(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 6));
  const [a, b, c] = triple;
  const thetaApprox = Math.round(Math.atan2(a, b) * 180 / Math.PI);

  const scenario = rng.pick(["find_opp", "find_adj"]);
  let prompt: string, answer: string, steps: string[];

  const params: Record<string, number | string> = { a, b, c, scenario };

  if (scenario === "find_opp") {
    const svg = makeRightTriangleSvg({
      opp: "?", adj: b, hyp: c, theta: thetaApprox,
      labelOpp: "?", labelAdj: `${b}`, labelHyp: `${c}`,
    });
    prompt = `In a right-angled triangle, the hypotenuse is ${c} and θ ≈ ${thetaApprox}°. Find the opposite side. Round to 2 decimal places if needed.`;
    const oppCalc = roundTo(c * Math.sin(thetaApprox * Math.PI / 180), 2);
    answer = formatAnswer(oppCalc);
    steps = [
      `sin ${thetaApprox}° = opposite / ${c}.`,
      `opposite = ${c} × sin ${thetaApprox}° = ${answer}.`,
    ];

    return {
      id: makeId("easy", "integer_answer", params),
      topic: "finding_unknown_sides_trig",
      difficulty: "easy",
      archetype: "integer_answer",
      prompt,
      answer,
      worked_solution: steps,
      metadata: {
        params,
        skills: ["apply_sin", "solve_for_side"],
        estimated_time_sec: 30,
        visual: { type: "svg", svg, alt: `Right triangle with hypotenuse=${c}, θ≈${thetaApprox}°, find opposite`, width: 420, height: 320 },
      },
    };
  } else {
    const svg = makeRightTriangleSvg({
      opp: a, adj: "?", hyp: c, theta: thetaApprox,
      labelOpp: `${a}`, labelAdj: "?", labelHyp: `${c}`,
    });
    prompt = `In a right-angled triangle, the hypotenuse is ${c} and θ ≈ ${thetaApprox}°. Find the adjacent side. Round to 2 decimal places if needed.`;
    const adjCalc = roundTo(c * Math.cos(thetaApprox * Math.PI / 180), 2);
    answer = formatAnswer(adjCalc);
    steps = [
      `cos ${thetaApprox}° = adjacent / ${c}.`,
      `adjacent = ${c} × cos ${thetaApprox}° = ${answer}.`,
    ];

    return {
      id: makeId("easy", "integer_answer", params),
      topic: "finding_unknown_sides_trig",
      difficulty: "easy",
      archetype: "integer_answer",
      prompt,
      answer,
      worked_solution: steps,
      metadata: {
        params,
        skills: ["apply_cos", "solve_for_side"],
        estimated_time_sec: 30,
        visual: { type: "svg", svg, alt: `Right triangle with hypotenuse=${c}, θ≈${thetaApprox}°, find adjacent`, width: 420, height: 320 },
      },
    };
  }
}

function easyNiceDecimalSinCos(rng: SeededRandom): GeneratedQuestion {
  const fnName: TrigFn = rng.pick(["sin", "cos"]);
  const theta = rng.pick([30, 45, 60]);
  const hyp = rng.pick([10, 12, 14, 16, 20]);
  const thetaRad = theta * Math.PI / 180;

  let sideVal: number, sideName: string;
  if (fnName === "sin") {
    sideVal = roundTo(hyp * Math.sin(thetaRad), 2);
    sideName = "opposite";
  } else {
    sideVal = roundTo(hyp * Math.cos(thetaRad), 2);
    sideName = "adjacent";
  }

  const params: Record<string, number | string> = { theta, hyp, fn: fnName };
  const oppVal = fnName === "sin" ? "?" : `${roundTo(hyp * Math.sin(thetaRad), 2)}`;
  const adjVal = fnName === "cos" ? "?" : `${roundTo(hyp * Math.cos(thetaRad), 2)}`;
  const svg = makeRightTriangleSvg({
    opp: oppVal, adj: adjVal, hyp, theta,
    labelOpp: fnName === "sin" ? "?" : oppVal,
    labelAdj: fnName === "cos" ? "?" : adjVal,
    labelHyp: `${hyp}`,
  });

  return {
    id: makeId("easy", "nice_decimal", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "easy",
    archetype: "nice_decimal",
    prompt: `In a right-angled triangle, the hypotenuse is ${hyp} and θ = ${theta}°. Find the ${sideName} side.`,
    answer: formatAnswer(sideVal),
    worked_solution: [
      `${fnName} θ = ${sideName} / hypotenuse.`,
      `${sideName} = ${hyp} × ${fnName} ${theta}° = ${formatAnswer(sideVal)}.`,
    ],
    metadata: {
      params,
      skills: [`apply_${fnName}`, "solve_for_side"],
      estimated_time_sec: 25,
      visual: { type: "svg", svg, alt: `Right triangle with hypotenuse=${hyp}, θ=${theta}°, find ${sideName}`, width: 420, height: 320 },
    },
  };
}

function mediumFindHypGivenOpp(rng: SeededRandom): GeneratedQuestion {
  const theta = rng.pick([25, 30, 35, 40, 45, 50, 55, 60, 65]);
  const opp = rng.randInt(5, 20);
  const thetaRad = theta * Math.PI / 180;
  const hyp = roundTo(opp / Math.sin(thetaRad), 2);
  const adj = roundTo(Math.sqrt(hyp * hyp - opp * opp), 2);

  const params: Record<string, number | string> = { theta, opp, variant: "hyp_from_opp" };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp: "?", theta,
    labelOpp: `${opp}`, labelAdj: `${adj}`, labelHyp: "?",
    showAdj: false,
  });

  return {
    id: makeId("medium", "find_hyp_given_opp", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "medium",
    archetype: "find_hyp_given_opp",
    prompt: `In a right-angled triangle, the opposite side is ${opp} and θ = ${theta}°. Find the hypotenuse. Round to 2 decimal places.`,
    answer: formatAnswer(hyp),
    worked_solution: [
      `sin θ = opposite / hypotenuse.`,
      `sin ${theta}° = ${opp} / hypotenuse.`,
      `hypotenuse = ${opp} / sin ${theta}° = ${opp} / ${Math.sin(thetaRad).toFixed(4)}... = ${formatAnswer(hyp)}.`,
    ],
    metadata: {
      params,
      skills: ["apply_sin", "rearrange_equation", "solve_for_hypotenuse"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Right triangle with opposite=${opp}, θ=${theta}°, find hypotenuse`, width: 420, height: 320 },
    },
  };
}

function mediumFindHypGivenAdj(rng: SeededRandom): GeneratedQuestion {
  const theta = rng.pick([25, 30, 35, 40, 45, 50, 55, 60, 65]);
  const adj = rng.randInt(5, 20);
  const thetaRad = theta * Math.PI / 180;
  const hyp = roundTo(adj / Math.cos(thetaRad), 2);
  const opp = roundTo(Math.sqrt(hyp * hyp - adj * adj), 2);

  const params: Record<string, number | string> = { theta, adj, variant: "hyp_from_adj" };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp: "?", theta,
    labelOpp: `${opp}`, labelAdj: `${adj}`, labelHyp: "?",
    showOpp: false,
  });

  return {
    id: makeId("medium", "find_hyp_given_adj", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "medium",
    archetype: "find_hyp_given_adj",
    prompt: `In a right-angled triangle, the adjacent side is ${adj} and θ = ${theta}°. Find the hypotenuse. Round to 2 decimal places.`,
    answer: formatAnswer(hyp),
    worked_solution: [
      `cos θ = adjacent / hypotenuse.`,
      `cos ${theta}° = ${adj} / hypotenuse.`,
      `hypotenuse = ${adj} / cos ${theta}° = ${formatAnswer(hyp)}.`,
    ],
    metadata: {
      params,
      skills: ["apply_cos", "rearrange_equation", "solve_for_hypotenuse"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Right triangle with adjacent=${adj}, θ=${theta}°, find hypotenuse`, width: 420, height: 320 },
    },
  };
}

function mediumDecimalRounding(rng: SeededRandom): GeneratedQuestion {
  const theta = rng.pick([22, 28, 33, 37, 42, 48, 53, 57, 62, 68, 72]);
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);
  const givenSide = rng.randInt(5, 25);
  const thetaRad = theta * Math.PI / 180;
  const dp = rng.pick([1, 2]);

  let answer: number, unknownName: string, givenName: string;
  let opp: number | string, adj: number | string, hyp: number | string;

  if (fnName === "sin") {
    hyp = givenSide;
    answer = roundTo(givenSide * Math.sin(thetaRad), dp);
    opp = "?";
    adj = roundTo(givenSide * Math.cos(thetaRad), 2);
    unknownName = "opposite";
    givenName = "hypotenuse";
  } else if (fnName === "cos") {
    hyp = givenSide;
    answer = roundTo(givenSide * Math.cos(thetaRad), dp);
    adj = "?";
    opp = roundTo(givenSide * Math.sin(thetaRad), 2);
    unknownName = "adjacent";
    givenName = "hypotenuse";
  } else {
    adj = givenSide;
    answer = roundTo(givenSide * Math.tan(thetaRad), dp);
    opp = "?";
    hyp = roundTo(Math.sqrt(givenSide * givenSide + answer * answer), 2);
    unknownName = "opposite";
    givenName = "adjacent";
  }

  const params: Record<string, number | string> = { theta, fn: fnName, given: givenSide, dp };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta,
    labelOpp: opp === "?" ? "?" : `${opp}`,
    labelAdj: adj === "?" ? "?" : `${adj}`,
    labelHyp: `${hyp}`,
  });

  return {
    id: makeId("medium", "decimal_rounding", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "medium",
    archetype: "decimal_rounding",
    prompt: `In a right-angled triangle, the ${givenName} is ${givenSide} and θ = ${theta}°. Find the ${unknownName} side. Round to ${dp} decimal place${dp > 1 ? "s" : ""}.`,
    answer: formatAnswer(answer, dp),
    worked_solution: [
      `${fnName} θ = ${unknownName} / ${givenName}.`,
      `${unknownName} = ${givenSide} × ${fnName} ${theta}° = ${formatAnswer(answer, dp)}.`,
    ],
    metadata: {
      params,
      skills: [`apply_${fnName}`, "decimal_rounding"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Right triangle with ${givenName}=${givenSide}, θ=${theta}°, find ${unknownName}`, width: 420, height: 320 },
    },
  };
}

function mediumTanFindSide(rng: SeededRandom): GeneratedQuestion {
  const theta = rng.pick([22, 28, 33, 37, 42, 48, 53, 57, 62, 68]);
  const scenario = rng.pick(["find_opp", "find_adj"]);
  const thetaRad = theta * Math.PI / 180;

  let givenSide: number, answer: number, givenName: string, unknownName: string;
  let opp: number | string, adj: number | string, hyp: number | string;

  if (scenario === "find_opp") {
    givenSide = rng.randInt(5, 20);
    answer = roundTo(givenSide * Math.tan(thetaRad), 2);
    givenName = "adjacent"; unknownName = "opposite";
    adj = givenSide; opp = "?"; hyp = roundTo(Math.sqrt(givenSide * givenSide + answer * answer), 2);
  } else {
    givenSide = rng.randInt(5, 20);
    answer = roundTo(givenSide / Math.tan(thetaRad), 2);
    givenName = "opposite"; unknownName = "adjacent";
    opp = givenSide; adj = "?"; hyp = roundTo(Math.sqrt(givenSide * givenSide + answer * answer), 2);
  }

  const params: Record<string, number | string> = { theta, given: givenSide, scenario };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta,
    labelOpp: opp === "?" ? "?" : `${opp}`,
    labelAdj: adj === "?" ? "?" : `${adj}`,
    labelHyp: `${hyp}`,
    showHyp: false,
  });

  return {
    id: makeId("medium", "tan_find_side", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "medium",
    archetype: "tan_find_side",
    prompt: `In a right-angled triangle, the ${givenName} side is ${givenSide} and θ = ${theta}°. Use tan to find the ${unknownName} side. Round to 2 decimal places.`,
    answer: formatAnswer(answer),
    worked_solution: [
      `tan θ = opposite / adjacent.`,
      scenario === "find_opp"
        ? `opposite = ${givenSide} × tan ${theta}° = ${formatAnswer(answer)}.`
        : `adjacent = ${givenSide} / tan ${theta}° = ${formatAnswer(answer)}.`,
    ],
    metadata: {
      params,
      skills: ["apply_tan", "solve_for_side"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Right triangle with ${givenName}=${givenSide}, θ=${theta}°, find ${unknownName}`, width: 420, height: 320 },
    },
  };
}

function mediumWordProblem(rng: SeededRandom): GeneratedQuestion {
  const scenarios = [
    { context: "A ladder leans against a wall", givenName: "ladder (hypotenuse)", givenSide: rng.randInt(3, 8), theta: rng.pick([55, 60, 65, 70, 75]), findName: "height up the wall (opposite)", fn: "sin" as TrigFn },
    { context: "A ramp leads to a platform", givenName: "ramp (hypotenuse)", givenSide: rng.randInt(4, 10), theta: rng.pick([15, 20, 25, 30]), findName: "horizontal distance (adjacent)", fn: "cos" as TrigFn },
    { context: "A guy wire supports a pole", givenName: "wire (hypotenuse)", givenSide: rng.randInt(8, 20), theta: rng.pick([40, 45, 50, 55, 60]), findName: "height of the pole (opposite)", fn: "sin" as TrigFn },
    { context: "A hill has a slope", givenName: "horizontal distance (adjacent)", givenSide: rng.randInt(50, 200), theta: rng.pick([10, 15, 20, 25]), findName: "vertical rise (opposite)", fn: "tan" as TrigFn },
  ];

  const s = rng.pick(scenarios);
  const thetaRad = s.theta * Math.PI / 180;
  let answer: number;
  if (s.fn === "sin") answer = roundTo(s.givenSide * Math.sin(thetaRad), 2);
  else if (s.fn === "cos") answer = roundTo(s.givenSide * Math.cos(thetaRad), 2);
  else answer = roundTo(s.givenSide * Math.tan(thetaRad), 2);

  const params: Record<string, number | string> = { context: s.context, theta: s.theta, given: s.givenSide, fn: s.fn };

  let opp: number | string, adj: number | string, hyp: number | string;
  if (s.fn === "sin") {
    hyp = s.givenSide; opp = "?"; adj = roundTo(s.givenSide * Math.cos(thetaRad), 2);
  } else if (s.fn === "cos") {
    hyp = s.givenSide; adj = "?"; opp = roundTo(s.givenSide * Math.sin(thetaRad), 2);
  } else {
    adj = s.givenSide; opp = "?"; hyp = roundTo(Math.sqrt(s.givenSide * s.givenSide + answer * answer), 2);
  }

  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta: s.theta,
    labelOpp: opp === "?" ? "?" : `${opp}`,
    labelAdj: adj === "?" ? "?" : `${adj}`,
    labelHyp: typeof hyp === "number" ? `${hyp}` : "?",
  });

  return {
    id: makeId("medium", "word_problem", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "medium",
    archetype: "word_problem",
    prompt: `${s.context}. The ${s.givenName} is ${s.givenSide} m and the angle of elevation is ${s.theta}°. Find the ${s.findName}. Round to 2 decimal places.`,
    answer: formatAnswer(answer),
    worked_solution: [
      `Identify: the ${s.givenName} = ${s.givenSide} m, θ = ${s.theta}°.`,
      `Use ${s.fn}: ${s.fn} ${s.theta}° = ${s.findName} / ${s.givenSide}.`,
      `${s.findName} = ${s.givenSide} × ${s.fn} ${s.theta}° = ${formatAnswer(answer)} m.`,
    ],
    metadata: {
      params,
      skills: [`apply_${s.fn}`, "word_problem", "solve_for_side"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `${s.context} diagram with θ=${s.theta}°`, width: 420, height: 320 },
    },
  };
}

function hardAlgebraicSide(rng: SeededRandom): GeneratedQuestion {
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);
  const theta = rng.pick([30, 45, 60]);
  const k = rng.randInt(2, 6);
  const thetaRad = theta * Math.PI / 180;
  const variable = rng.pick(["x", "a", "m"]);

  let givenExpr: string, givenName: string, unknownName: string, answer: string;
  let opp: string, adj: string, hyp: string;

  if (fnName === "sin") {
    givenExpr = `${k}${variable}`;
    givenName = "hypotenuse";
    unknownName = "opposite";
    hyp = givenExpr;
    const sinExact = SPECIAL_ANGLES[theta].sin;
    if (theta === 30) {
      answer = `${k}/2 × ${variable}`;
      opp = "?";
    } else if (theta === 45) {
      answer = `${k}sqrt(2)/2 × ${variable}`;
      opp = "?";
    } else {
      answer = `${k}sqrt(3)/2 × ${variable}`;
      opp = "?";
    }
    adj = "?";
    const numAnswer = roundTo(k * Math.sin(thetaRad), 4);
    answer = `${roundTo(k * Math.sin(thetaRad), 2)}${variable}`;

    const svg = makeRightTriangleSvg({
      opp: "?", adj: "?", hyp: `${k}${variable}`, theta,
      labelOpp: "?", labelHyp: `${k}${variable}`,
      showAdj: false,
    });

    const params: Record<string, number | string> = { fn: fnName, theta, k, var: variable };
    return {
      id: makeId("hard", "algebraic_side", params),
      topic: "finding_unknown_sides_trig",
      difficulty: "hard",
      archetype: "algebraic_side",
      prompt: `In a right-angled triangle, the hypotenuse is ${k}${variable} and θ = ${theta}°. Express the opposite side in terms of ${variable}. Round coefficients to 2 dp if needed.`,
      answer,
      worked_solution: [
        `sin ${theta}° = opposite / ${k}${variable}.`,
        `opposite = ${k}${variable} × sin ${theta}° = ${k} × ${Math.sin(thetaRad).toFixed(4)}... × ${variable}.`,
        `opposite = ${answer}.`,
      ],
      metadata: {
        params,
        skills: ["algebraic_expression", "apply_sin"],
        estimated_time_sec: 50,
        visual: { type: "svg", svg, alt: `Right triangle with hypotenuse=${k}${variable}, θ=${theta}°, find opposite`, width: 420, height: 320 },
      },
    };
  } else if (fnName === "cos") {
    const numAnswer = roundTo(k * Math.cos(thetaRad), 2);
    answer = `${numAnswer}${variable}`;

    const svg = makeRightTriangleSvg({
      opp: "?", adj: "?", hyp: `${k}${variable}`, theta,
      labelAdj: "?", labelHyp: `${k}${variable}`,
      showOpp: false,
    });

    const params: Record<string, number | string> = { fn: fnName, theta, k, var: variable };
    return {
      id: makeId("hard", "algebraic_side", params),
      topic: "finding_unknown_sides_trig",
      difficulty: "hard",
      archetype: "algebraic_side",
      prompt: `In a right-angled triangle, the hypotenuse is ${k}${variable} and θ = ${theta}°. Express the adjacent side in terms of ${variable}. Round coefficients to 2 dp if needed.`,
      answer,
      worked_solution: [
        `cos ${theta}° = adjacent / ${k}${variable}.`,
        `adjacent = ${k}${variable} × cos ${theta}° = ${numAnswer}${variable}.`,
      ],
      metadata: {
        params,
        skills: ["algebraic_expression", "apply_cos"],
        estimated_time_sec: 50,
        visual: { type: "svg", svg, alt: `Right triangle with hypotenuse=${k}${variable}, θ=${theta}°, find adjacent`, width: 420, height: 320 },
      },
    };
  } else {
    const adjVal = rng.randInt(3, 10);
    const numAnswer = roundTo(adjVal * Math.tan(thetaRad), 2);
    answer = `${numAnswer}${variable}`;

    const svg = makeRightTriangleSvg({
      opp: "?", adj: `${adjVal}${variable}`, hyp: "?", theta,
      labelOpp: "?", labelAdj: `${adjVal}${variable}`,
      showHyp: false,
    });

    const params: Record<string, number | string> = { fn: fnName, theta, adjVal, var: variable };
    return {
      id: makeId("hard", "algebraic_side", params),
      topic: "finding_unknown_sides_trig",
      difficulty: "hard",
      archetype: "algebraic_side",
      prompt: `In a right-angled triangle, the adjacent side is ${adjVal}${variable} and θ = ${theta}°. Express the opposite side in terms of ${variable}. Round coefficients to 2 dp if needed.`,
      answer,
      worked_solution: [
        `tan ${theta}° = opposite / ${adjVal}${variable}.`,
        `opposite = ${adjVal}${variable} × tan ${theta}° = ${numAnswer}${variable}.`,
      ],
      metadata: {
        params,
        skills: ["algebraic_expression", "apply_tan"],
        estimated_time_sec: 50,
        visual: { type: "svg", svg, alt: `Right triangle with adjacent=${adjVal}${variable}, θ=${theta}°, find opposite`, width: 420, height: 320 },
      },
    };
  }
}

function hardMultiStepPythagoras(rng: SeededRandom): GeneratedQuestion {
  const theta = rng.pick([30, 35, 40, 45, 50, 55, 60]);
  const hyp = rng.randInt(8, 20);
  const thetaRad = theta * Math.PI / 180;
  const opp = roundTo(hyp * Math.sin(thetaRad), 4);
  const adj = roundTo(hyp * Math.cos(thetaRad), 4);

  const scenario = rng.pick(["find_adj_via_opp", "find_opp_via_adj"]);

  let prompt: string, answer: string, steps: string[];

  if (scenario === "find_adj_via_opp") {
    const oppRound = roundTo(opp, 2);
    const adjAnswer = roundTo(Math.sqrt(hyp * hyp - opp * opp), 2);
    answer = formatAnswer(adjAnswer);
    prompt = `In a right-angled triangle, the hypotenuse is ${hyp} and θ = ${theta}°. First use sin to find the opposite side, then use Pythagoras' theorem to find the adjacent side. Round to 2 dp.`;
    steps = [
      `sin ${theta}° = opposite / ${hyp}.`,
      `opposite = ${hyp} × sin ${theta}° = ${formatAnswer(oppRound)}.`,
      `By Pythagoras: adjacent² = ${hyp}² − ${formatAnswer(oppRound)}² = ${roundTo(hyp * hyp - oppRound * oppRound, 4)}.`,
      `adjacent = √${roundTo(hyp * hyp - oppRound * oppRound, 4)} = ${answer}.`,
    ];
  } else {
    const adjRound = roundTo(adj, 2);
    const oppAnswer = roundTo(Math.sqrt(hyp * hyp - adj * adj), 2);
    answer = formatAnswer(oppAnswer);
    prompt = `In a right-angled triangle, the hypotenuse is ${hyp} and θ = ${theta}°. First use cos to find the adjacent side, then use Pythagoras' theorem to find the opposite side. Round to 2 dp.`;
    steps = [
      `cos ${theta}° = adjacent / ${hyp}.`,
      `adjacent = ${hyp} × cos ${theta}° = ${formatAnswer(adjRound)}.`,
      `By Pythagoras: opposite² = ${hyp}² − ${formatAnswer(adjRound)}² = ${roundTo(hyp * hyp - adjRound * adjRound, 4)}.`,
      `opposite = ${answer}.`,
    ];
  }

  const params: Record<string, number | string> = { theta, hyp, scenario };
  const svg = makeRightTriangleSvg({
    opp: "?", adj: "?", hyp, theta,
    labelOpp: "?", labelAdj: "?", labelHyp: `${hyp}`,
  });

  return {
    id: makeId("hard", "multi_step_pythagoras", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "hard",
    archetype: "multi_step_pythagoras",
    prompt,
    answer,
    worked_solution: steps,
    metadata: {
      params,
      skills: ["apply_sin_cos", "pythagoras", "multi_step"],
      estimated_time_sec: 75,
      visual: { type: "svg", svg, alt: `Right triangle with hypotenuse=${hyp}, θ=${theta}°, find both sides`, width: 420, height: 320 },
    },
  };
}

function hardSpecialAngleExact(rng: SeededRandom): GeneratedQuestion {
  const angle = rng.pick([30, 45, 60]);
  const fnName: TrigFn = rng.pick(["sin", "cos"]);
  const multiplier = rng.randInt(2, 10);
  const thetaRad = angle * Math.PI / 180;

  let givenSide: number, givenName: string, unknownName: string, exactAnswer: string;

  if (fnName === "sin") {
    givenSide = multiplier;
    givenName = "hypotenuse";
    unknownName = "opposite";
    if (angle === 30) exactAnswer = `${multiplier}/2`;
    else if (angle === 45) exactAnswer = `${multiplier}sqrt(2)/2`;
    else exactAnswer = `${multiplier}sqrt(3)/2`;
  } else {
    givenSide = multiplier;
    givenName = "hypotenuse";
    unknownName = "adjacent";
    if (angle === 30) exactAnswer = `${multiplier}sqrt(3)/2`;
    else if (angle === 45) exactAnswer = `${multiplier}sqrt(2)/2`;
    else exactAnswer = `${multiplier}/2`;
  }

  const params: Record<string, number | string> = { angle, fn: fnName, multiplier };
  const svg = makeRightTriangleSvg({
    opp: fnName === "sin" ? "?" : "—",
    adj: fnName === "cos" ? "?" : "—",
    hyp: givenSide,
    theta: angle,
    labelOpp: fnName === "sin" ? "?" : "",
    labelAdj: fnName === "cos" ? "?" : "",
    labelHyp: `${givenSide}`,
    showOpp: fnName === "sin",
    showAdj: fnName === "cos",
  });

  return {
    id: makeId("hard", "special_angle_exact", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "hard",
    archetype: "special_angle_exact",
    prompt: `In a right-angled triangle, the ${givenName} is ${givenSide} and θ = ${angle}°. Find the exact value of the ${unknownName} side. Use sqrt() for square roots.`,
    answer: exactAnswer,
    worked_solution: [
      `${fnName} ${angle}° = ${SPECIAL_ANGLES[angle][fnName]}.`,
      `${unknownName} = ${givenSide} × ${SPECIAL_ANGLES[angle][fnName]}.`,
      `${unknownName} = ${exactAnswer}.`,
    ],
    metadata: {
      params,
      skills: ["exact_values", "special_angles", "solve_for_side"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Right triangle with ${givenName}=${givenSide}, θ=${angle}°, find exact ${unknownName}`, width: 420, height: 320 },
    },
  };
}

function hardTwoTrianglesSharedSide(rng: SeededRandom): GeneratedQuestion {
  const theta1 = rng.pick([30, 40, 45, 50, 60]);
  const theta2 = rng.pick([25, 35, 45, 55, 65]);
  const hyp1 = rng.randInt(8, 20);
  const thetaRad1 = theta1 * Math.PI / 180;
  const thetaRad2 = theta2 * Math.PI / 180;

  const sharedSide = roundTo(hyp1 * Math.sin(thetaRad1), 2);
  const answer = roundTo(sharedSide / Math.sin(thetaRad2), 2);

  const params: Record<string, number | string> = { theta1, theta2, hyp1 };
  const svg = makeRightTriangleSvg({
    opp: sharedSide, adj: "—", hyp: hyp1, theta: theta1,
    labelOpp: `${formatAnswer(sharedSide)} (shared)`, labelHyp: `${hyp1}`,
    showAdj: false,
  });

  return {
    id: makeId("hard", "two_triangles_shared", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "hard",
    archetype: "two_triangles_shared",
    prompt: `Two right-angled triangles share a common side (the height). In the first triangle, the hypotenuse is ${hyp1} and the angle is ${theta1}°. In the second triangle, the angle is ${theta2}°. Find the hypotenuse of the second triangle. Round to 2 dp.`,
    answer: formatAnswer(answer),
    worked_solution: [
      `First triangle: shared side = ${hyp1} × sin ${theta1}° = ${formatAnswer(sharedSide)}.`,
      `Second triangle: hypotenuse = shared side / sin ${theta2}°.`,
      `hypotenuse = ${formatAnswer(sharedSide)} / sin ${theta2}° = ${formatAnswer(answer)}.`,
    ],
    metadata: {
      params,
      skills: ["multi_step", "apply_sin", "two_triangles"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Two triangles sharing a side, θ₁=${theta1}°, θ₂=${theta2}°`, width: 420, height: 320 },
    },
  };
}

function challengeCombinedTrigPythagoras(rng: SeededRandom): GeneratedQuestion {
  const theta = rng.pick([30, 35, 40, 45, 50, 55, 60]);
  const givenSide = rng.randInt(6, 18);
  const thetaRad = theta * Math.PI / 180;

  const opp = roundTo(givenSide * Math.sin(thetaRad), 4);
  const adj = roundTo(givenSide * Math.cos(thetaRad), 4);
  const checkHyp = roundTo(Math.sqrt(opp * opp + adj * adj), 2);

  const secondTheta = rng.pick([25, 30, 35, 40, 45]);
  const secondThetaRad = secondTheta * Math.PI / 180;
  const finalSide = roundTo(opp / Math.tan(secondThetaRad), 2);

  const params: Record<string, number | string> = { theta, givenSide, secondTheta };
  const svg = makeRightTriangleSvg({
    opp: "?", adj: "?", hyp: givenSide, theta,
    labelOpp: "step 1", labelAdj: "?", labelHyp: `${givenSide}`,
  });

  return {
    id: makeId("challenge", "combined_trig_pythagoras", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "challenge",
    archetype: "combined_trig_pythagoras",
    prompt: `In a right-angled triangle, the hypotenuse is ${givenSide} and θ = ${theta}°. Find the opposite side using sin, then use this as the opposite in a second right-angled triangle where the angle is ${secondTheta}°. Find the adjacent side of the second triangle. Round to 2 dp.`,
    answer: formatAnswer(finalSide),
    worked_solution: [
      `Step 1: opposite = ${givenSide} × sin ${theta}° = ${formatAnswer(roundTo(opp, 2))}.`,
      `Step 2: In second triangle, tan ${secondTheta}° = ${formatAnswer(roundTo(opp, 2))} / adjacent.`,
      `adjacent = ${formatAnswer(roundTo(opp, 2))} / tan ${secondTheta}° = ${formatAnswer(finalSide)}.`,
    ],
    metadata: {
      params,
      skills: ["multi_step", "apply_sin", "apply_tan", "combined_trig"],
      estimated_time_sec: 120,
      visual: { type: "svg", svg, alt: `Multi-step trig problem with two triangles`, width: 420, height: 320 },
    },
  };
}

function challengeExactSurdExpression(rng: SeededRandom): GeneratedQuestion {
  const angle = rng.pick([30, 45, 60]);
  const multiplier = rng.pick([2, 3, 4, 5, 6, 8, 10]);
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);

  let givenSide: number, givenName: string, unknownName: string, exactAnswer: string;

  if (fnName === "sin") {
    givenSide = multiplier;
    givenName = "hypotenuse";
    unknownName = "opposite";
    if (angle === 30) exactAnswer = `${multiplier / 2}`;
    else if (angle === 45) {
      const g = gcd(multiplier, 2);
      if (multiplier % 2 === 0) exactAnswer = `${multiplier / 2}sqrt(2)`;
      else exactAnswer = `${multiplier}sqrt(2)/2`;
    }
    else {
      if (multiplier % 2 === 0) exactAnswer = `${multiplier / 2}sqrt(3)`;
      else exactAnswer = `${multiplier}sqrt(3)/2`;
    }
  } else if (fnName === "cos") {
    givenSide = multiplier;
    givenName = "hypotenuse";
    unknownName = "adjacent";
    if (angle === 30) {
      if (multiplier % 2 === 0) exactAnswer = `${multiplier / 2}sqrt(3)`;
      else exactAnswer = `${multiplier}sqrt(3)/2`;
    }
    else if (angle === 45) {
      if (multiplier % 2 === 0) exactAnswer = `${multiplier / 2}sqrt(2)`;
      else exactAnswer = `${multiplier}sqrt(2)/2`;
    }
    else exactAnswer = `${multiplier / 2}`;
  } else {
    givenSide = multiplier;
    givenName = "adjacent";
    unknownName = "opposite";
    if (angle === 30) {
      exactAnswer = `${multiplier}sqrt(3)/3`;
    }
    else if (angle === 45) exactAnswer = `${multiplier}`;
    else exactAnswer = `${multiplier}sqrt(3)`;
  }

  const params: Record<string, number | string> = { angle, fn: fnName, multiplier };
  const svg = makeRightTriangleSvg({
    opp: unknownName === "opposite" ? "?" : "—",
    adj: unknownName === "adjacent" ? "?" : (givenName === "adjacent" ? givenSide : "—"),
    hyp: givenName === "hypotenuse" ? givenSide : "—",
    theta: angle,
    labelOpp: unknownName === "opposite" ? "?" : "",
    labelAdj: unknownName === "adjacent" ? "?" : (givenName === "adjacent" ? `${givenSide}` : ""),
    labelHyp: givenName === "hypotenuse" ? `${givenSide}` : "",
    showOpp: unknownName === "opposite",
    showAdj: unknownName === "adjacent" || givenName === "adjacent",
    showHyp: givenName === "hypotenuse",
  });

  return {
    id: makeId("challenge", "exact_surd_expression", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "challenge",
    archetype: "exact_surd_expression",
    prompt: `Find the exact value of the ${unknownName} side in a right-angled triangle where the ${givenName} is ${givenSide} and θ = ${angle}°. Leave your answer in exact form using sqrt().`,
    answer: exactAnswer,
    worked_solution: [
      `${fnName} ${angle}° = ${SPECIAL_ANGLES[angle][fnName]}.`,
      `${unknownName} = ${givenSide} × ${SPECIAL_ANGLES[angle][fnName]} = ${exactAnswer}.`,
    ],
    metadata: {
      params,
      skills: ["exact_values", "surd_arithmetic", "special_angles"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Right triangle with ${givenName}=${givenSide}, θ=${angle}°, find exact ${unknownName}`, width: 420, height: 320 },
    },
  };
}

function challengeCoordinateGeometryTrig(rng: SeededRandom): GeneratedQuestion {
  const coords: [number, number, number, number][] = [
    [0, 0, 3, 4], [0, 0, 5, 12], [0, 0, 8, 6], [0, 0, 4, 3],
    [1, 1, 4, 5], [2, 1, 5, 5], [0, 0, 6, 8],
  ];
  const picked = rng.pick(coords);
  const [x1, y1, x2, y2] = picked;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const distRound = roundTo(dist, 2);

  const theta = rng.pick([30, 45, 60]);
  const thetaRad = theta * Math.PI / 180;
  const sideToFind = roundTo(distRound * Math.sin(thetaRad), 2);

  const pts = {
    A: [x1, y1] as [number, number],
    B: [x2, y1] as [number, number],
    C: [x2, y2] as [number, number],
  };

  const params: Record<string, number | string> = { x1, y1, x2, y2, theta };
  const svg = makeCoordinateTriangleSvg(pts, `A, θ=${theta}°`, 420, 320);

  return {
    id: makeId("challenge", "coordinate_geometry_trig", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "challenge",
    archetype: "coordinate_geometry_trig",
    prompt: `Points A(${x1},${y1}) and C(${x2},${y2}) form the hypotenuse of a right-angled triangle. The distance AC = ${distRound}. If θ = ${theta}° at vertex A, find the opposite side. Round to 2 dp.`,
    answer: formatAnswer(sideToFind),
    worked_solution: [
      `Distance AC = √((${x2}−${x1})² + (${y2}−${y1})²) = √(${dx * dx} + ${dy * dy}) = ${distRound}.`,
      `opposite = AC × sin ${theta}° = ${distRound} × ${Math.sin(thetaRad).toFixed(4)}... = ${formatAnswer(sideToFind)}.`,
    ],
    metadata: {
      params,
      skills: ["coordinate_geometry", "distance_formula", "apply_sin"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Coordinate triangle with A(${x1},${y1}), C(${x2},${y2}), θ=${theta}°`, width: 420, height: 320 },
    },
  };
}

function challengeRearrangeComplex(rng: SeededRandom): GeneratedQuestion {
  const theta = rng.pick([30, 45, 60]);
  const thetaRad = theta * Math.PI / 180;
  const k = rng.randInt(2, 8);
  const fnName: TrigFn = rng.pick(["sin", "cos"]);

  let answer: number, prompt: string, steps: string[];

  if (fnName === "sin") {
    const oppGiven = k;
    answer = roundTo(oppGiven / Math.sin(thetaRad), 2);
    prompt = `In a right-angled triangle, the opposite side is ${k} and θ = ${theta}°. Find the hypotenuse. Then find the adjacent side using Pythagoras' theorem. Give the adjacent side rounded to 2 dp.`;
    const hyp = answer;
    const adj = roundTo(Math.sqrt(hyp * hyp - k * k), 2);
    answer = adj;
    steps = [
      `sin ${theta}° = ${k} / hypotenuse.`,
      `hypotenuse = ${k} / sin ${theta}° = ${formatAnswer(roundTo(k / Math.sin(thetaRad), 2))}.`,
      `adjacent = √(hypotenuse² − ${k}²) = √(${roundTo((k / Math.sin(thetaRad)) * (k / Math.sin(thetaRad)), 2)} − ${k * k}) = ${formatAnswer(adj)}.`,
    ];
  } else {
    const adjGiven = k;
    const hyp = roundTo(adjGiven / Math.cos(thetaRad), 2);
    const opp = roundTo(Math.sqrt(hyp * hyp - k * k), 2);
    answer = opp;
    prompt = `In a right-angled triangle, the adjacent side is ${k} and θ = ${theta}°. Find the hypotenuse using cos, then find the opposite side using Pythagoras' theorem. Give the opposite side rounded to 2 dp.`;
    steps = [
      `cos ${theta}° = ${k} / hypotenuse.`,
      `hypotenuse = ${k} / cos ${theta}° = ${formatAnswer(hyp)}.`,
      `opposite = √(${formatAnswer(hyp)}² − ${k}²) = ${formatAnswer(opp)}.`,
    ];
  }

  const params: Record<string, number | string> = { theta, k, fn: fnName };
  const svg = makeRightTriangleSvg({
    opp: "?", adj: fnName === "cos" ? k : "?", hyp: "?", theta,
    labelOpp: "?",
    labelAdj: fnName === "cos" ? `${k}` : "?",
    labelHyp: "?",
    showOpp: true,
    showAdj: true,
    showHyp: true,
  });

  return {
    id: makeId("challenge", "rearrange_complex", params),
    topic: "finding_unknown_sides_trig",
    difficulty: "challenge",
    archetype: "rearrange_complex",
    prompt,
    answer: formatAnswer(answer),
    worked_solution: steps,
    metadata: {
      params,
      skills: ["rearrange_equation", "pythagoras", "multi_step"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Right triangle with θ=${theta}°, multi-step problem`, width: 420, height: 320 },
    },
  };
}

const EASY_ARCHETYPES: ArchetypeFn[] = [
  easyFindOppUsingSin,
  easyFindAdjUsingCos,
  easyFindOppUsingTan,
  easyIntegerAnswer,
  easyNiceDecimalSinCos,
  easyFindOppUsingSin,
  easyFindAdjUsingCos,
  easyNiceDecimalSinCos,
];

const MEDIUM_ARCHETYPES: ArchetypeFn[] = [
  mediumFindHypGivenOpp,
  mediumFindHypGivenAdj,
  mediumDecimalRounding,
  mediumDecimalRounding,
  mediumTanFindSide,
  mediumTanFindSide,
  mediumWordProblem,
  mediumWordProblem,
];

const HARD_ARCHETYPES: ArchetypeFn[] = [
  hardAlgebraicSide,
  hardAlgebraicSide,
  hardMultiStepPythagoras,
  hardMultiStepPythagoras,
  hardSpecialAngleExact,
  hardTwoTrianglesSharedSide,
  hardTwoTrianglesSharedSide,
];

const CHALLENGE_ARCHETYPES: ArchetypeFn[] = [
  challengeCombinedTrigPythagoras,
  challengeCombinedTrigPythagoras,
  challengeExactSurdExpression,
  challengeExactSurdExpression,
  challengeCoordinateGeometryTrig,
  challengeCoordinateGeometryTrig,
  challengeRearrangeComplex,
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
