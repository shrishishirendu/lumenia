import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "trigonometric_ratios";
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

const SCALED_TRIPLES: [number, number, number][] = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25],
  [6, 8, 10], [9, 12, 15], [9, 40, 41], [20, 21, 29],
];

type TrigFn = "sin" | "cos" | "tan";

const SPECIAL_ANGLES: Record<number, { sin: string; cos: string; tan: string; sinVal: number; cosVal: number; tanVal: number }> = {
  30: { sin: "1/2", cos: "sqrt(3)/2", tan: "1/sqrt(3)", sinVal: 0.5, cosVal: Math.sqrt(3)/2, tanVal: 1/Math.sqrt(3) },
  45: { sin: "sqrt(2)/2", cos: "sqrt(2)/2", tan: "1", sinVal: Math.sqrt(2)/2, cosVal: Math.sqrt(2)/2, tanVal: 1 },
  60: { sin: "sqrt(3)/2", cos: "1/2", tan: "sqrt(3)", sinVal: Math.sqrt(3)/2, cosVal: 0.5, tanVal: Math.sqrt(3) },
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
    const angle1 = 0;
    const thetaNum = typeof opts.theta === "number" ? opts.theta : 45;
    const angleRad = thetaNum * Math.PI / 180;
    const endX = Ax + arcR * Math.cos(0);
    const endY = Ay - arcR * Math.sin(0);
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

function easyIdentifyRatio(fnName: TrigFn): ArchetypeFn {
  return (rng: SeededRandom): GeneratedQuestion => {
    const triple = rng.pick(PYTHAGOREAN_TRIPLES);
    const [a, b, c] = triple;
    const opp = a, adj = b, hyp = c;
    const thetaApprox = Math.round(Math.atan2(opp, adj) * 180 / Math.PI);

    let answer: string;
    let ratioStr: string;
    if (fnName === "sin") { answer = simplifyFrac(opp, hyp); ratioStr = `opposite / hypotenuse = ${opp} / ${hyp}`; }
    else if (fnName === "cos") { answer = simplifyFrac(adj, hyp); ratioStr = `adjacent / hypotenuse = ${adj} / ${hyp}`; }
    else { answer = simplifyFrac(opp, adj); ratioStr = `opposite / adjacent = ${opp} / ${adj}`; }

    const params: Record<string, number | string> = { opp, adj, hyp, fn: fnName };
    const svg = makeRightTriangleSvg({ opp, adj, hyp, theta: thetaApprox, labelOpp: `${opp}`, labelAdj: `${adj}`, labelHyp: `${hyp}` });

    return {
      id: makeId("easy", `identify_ratio_${fnName}`, params),
      topic: "trigonometric_ratios",
      difficulty: "easy",
      archetype: `identify_ratio_${fnName}`,
      prompt: `In the right-angled triangle shown, find ${fnName} θ. Give your answer as a simplified fraction.`,
      answer,
      worked_solution: [
        `Identify the sides relative to angle θ: opposite = ${opp}, adjacent = ${adj}, hypotenuse = ${hyp}.`,
        `${fnName} θ = ${ratioStr}.`,
        `Simplify: ${fnName} θ = ${answer}.`,
      ],
      metadata: {
        params,
        skills: ["identify_opposite_adjacent", "basic_ratio"],
        estimated_time_sec: 30,
        visual: { type: "svg", svg, alt: `Right triangle with sides ${opp}, ${adj}, ${hyp} and angle θ ≈ ${thetaApprox}°`, width: 420, height: 320 },
      },
    };
  };
}

function easyRatioFromLengths(fnName: TrigFn): ArchetypeFn {
  return (rng: SeededRandom): GeneratedQuestion => {
    const triple = rng.pick(SCALED_TRIPLES);
    const scale = rng.pick([1, 2, 3]);
    const [a, b, c] = [triple[0] * scale, triple[1] * scale, triple[2] * scale];
    const swap = rng.next() > 0.5;
    const opp = swap ? b : a;
    const adj = swap ? a : b;
    const hyp = c;
    const thetaApprox = Math.round(Math.atan2(opp, adj) * 180 / Math.PI);

    let num: number, den: number, ratioDesc: string;
    if (fnName === "sin") { num = opp; den = hyp; ratioDesc = "opposite / hypotenuse"; }
    else if (fnName === "cos") { num = adj; den = hyp; ratioDesc = "adjacent / hypotenuse"; }
    else { num = opp; den = adj; ratioDesc = "opposite / adjacent"; }
    const answer = simplifyFrac(num, den);

    const params: Record<string, number | string> = { opp, adj, hyp, fn: fnName, scale };
    const svg = makeRightTriangleSvg({ opp, adj, hyp, theta: thetaApprox });

    return {
      id: makeId("easy", `ratio_from_lengths_${fnName}`, params),
      topic: "trigonometric_ratios",
      difficulty: "easy",
      archetype: `ratio_from_lengths_${fnName}`,
      prompt: `A right-angled triangle has opposite side = ${opp}, adjacent side = ${adj}, and hypotenuse = ${hyp}. Find ${fnName} θ as a simplified fraction.`,
      answer,
      worked_solution: [
        `${fnName} θ = ${ratioDesc} = ${num}/${den}.`,
        `Simplify: ${answer}.`,
      ],
      metadata: {
        params,
        skills: ["identify_opposite_adjacent", "basic_ratio"],
        estimated_time_sec: 25,
        visual: { type: "svg", svg, alt: `Right triangle with opposite=${opp}, adjacent=${adj}, hypotenuse=${hyp}`, width: 420, height: 320 },
      },
    };
  };
}

function mediumFindMissingSide(rng: SeededRandom): GeneratedQuestion {
  const angles = [30, 45, 60];
  const theta = rng.pick(angles);
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);
  const givenSide = rng.randInt(4, 20);

  const thetaRad = theta * Math.PI / 180;
  let missingName: string, answer: number, prompt: string, step: string;
  let opp: number | string, adj: number | string, hyp: number | string;

  if (fnName === "sin") {
    if (rng.next() > 0.5) {
      hyp = givenSide;
      answer = Math.round(givenSide * Math.sin(thetaRad) * 100) / 100;
      opp = "?";
      adj = Math.round(givenSide * Math.cos(thetaRad) * 100) / 100;
      missingName = "opposite";
      prompt = `In a right-angled triangle, the hypotenuse is ${givenSide} and θ = ${theta}°. Find the opposite side. Round to 2 decimal places.`;
      step = `sin ${theta}° × ${givenSide} = ${answer}`;
    } else {
      opp = givenSide;
      answer = Math.round(givenSide / Math.sin(thetaRad) * 100) / 100;
      hyp = "?";
      adj = Math.round(Math.sqrt(answer * answer - givenSide * givenSide) * 100) / 100;
      missingName = "hypotenuse";
      prompt = `In a right-angled triangle, the opposite side is ${givenSide} and θ = ${theta}°. Find the hypotenuse. Round to 2 decimal places.`;
      step = `${givenSide} / sin ${theta}° = ${answer}`;
    }
  } else if (fnName === "cos") {
    if (rng.next() > 0.5) {
      hyp = givenSide;
      answer = Math.round(givenSide * Math.cos(thetaRad) * 100) / 100;
      adj = "?";
      opp = Math.round(givenSide * Math.sin(thetaRad) * 100) / 100;
      missingName = "adjacent";
      prompt = `In a right-angled triangle, the hypotenuse is ${givenSide} and θ = ${theta}°. Find the adjacent side. Round to 2 decimal places.`;
      step = `cos ${theta}° × ${givenSide} = ${answer}`;
    } else {
      adj = givenSide;
      answer = Math.round(givenSide / Math.cos(thetaRad) * 100) / 100;
      hyp = "?";
      opp = Math.round(Math.sqrt(answer * answer - givenSide * givenSide) * 100) / 100;
      missingName = "hypotenuse";
      prompt = `In a right-angled triangle, the adjacent side is ${givenSide} and θ = ${theta}°. Find the hypotenuse. Round to 2 decimal places.`;
      step = `${givenSide} / cos ${theta}° = ${answer}`;
    }
  } else {
    if (rng.next() > 0.5) {
      adj = givenSide;
      answer = Math.round(givenSide * Math.tan(thetaRad) * 100) / 100;
      opp = "?";
      hyp = Math.round(Math.sqrt(givenSide * givenSide + answer * answer) * 100) / 100;
      missingName = "opposite";
      prompt = `In a right-angled triangle, the adjacent side is ${givenSide} and θ = ${theta}°. Find the opposite side. Round to 2 decimal places.`;
      step = `tan ${theta}° × ${givenSide} = ${answer}`;
    } else {
      opp = givenSide;
      answer = Math.round(givenSide / Math.tan(thetaRad) * 100) / 100;
      adj = "?";
      hyp = Math.round(Math.sqrt(givenSide * givenSide + answer * answer) * 100) / 100;
      missingName = "adjacent";
      prompt = `In a right-angled triangle, the opposite side is ${givenSide} and θ = ${theta}°. Find the adjacent side. Round to 2 decimal places.`;
      step = `${givenSide} / tan ${theta}° = ${answer}`;
    }
  }

  const answerStr = answer.toFixed(2).replace(/\.?0+$/, "") || "0";
  const params: Record<string, number | string> = { theta, fn: fnName, given: givenSide, missing: missingName };
  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta,
    labelOpp: opp === "?" ? "?" : `${opp}`,
    labelAdj: adj === "?" ? "?" : `${adj}`,
    labelHyp: hyp === "?" ? "?" : `${hyp}`,
  });

  return {
    id: makeId("medium", "find_missing_side", params),
    topic: "trigonometric_ratios",
    difficulty: "medium",
    archetype: "find_missing_side",
    prompt,
    answer: answerStr,
    worked_solution: [
      `Use ${fnName} θ to set up the equation.`,
      `${fnName} ${theta}° = ${fnName === "sin" ? "opposite / hypotenuse" : fnName === "cos" ? "adjacent / hypotenuse" : "opposite / adjacent"}.`,
      `Solve: ${step}.`,
      `The ${missingName} side = ${answerStr}.`,
    ],
    metadata: {
      params,
      skills: ["apply_sin_cos_tan", "solve_for_side"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Right triangle with θ=${theta}°, one known side=${givenSide}, find ${missingName}`, width: 420, height: 320 },
    },
  };
}

function mediumFindRatioDecimal(rng: SeededRandom): GeneratedQuestion {
  const angles = [25, 35, 40, 50, 55, 65, 70, 75];
  const theta = rng.pick(angles);
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);
  const thetaRad = theta * Math.PI / 180;
  let val: number;
  if (fnName === "sin") val = Math.sin(thetaRad);
  else if (fnName === "cos") val = Math.cos(thetaRad);
  else val = Math.tan(thetaRad);
  const answer = val.toFixed(2);

  const hyp = 10;
  const oppVal = Math.round(Math.sin(thetaRad) * hyp * 100) / 100;
  const adjVal = Math.round(Math.cos(thetaRad) * hyp * 100) / 100;

  const params: Record<string, number | string> = { theta, fn: fnName };
  const svg = makeRightTriangleSvg({
    opp: oppVal, adj: adjVal, hyp,
    theta,
    showOpp: false, showAdj: false, showHyp: false,
  });

  return {
    id: makeId("medium", "find_ratio_decimal", params),
    topic: "trigonometric_ratios",
    difficulty: "medium",
    archetype: "find_ratio_decimal",
    prompt: `Using a calculator, find ${fnName} ${theta}°. Round to 2 decimal places.`,
    answer,
    worked_solution: [
      `Enter ${fnName}(${theta}) into your calculator.`,
      `${fnName} ${theta}° = ${val.toFixed(4)}...`,
      `Rounded to 2 decimal places: ${answer}.`,
    ],
    metadata: {
      params,
      skills: ["apply_sin_cos_tan", "calculator_use"],
      estimated_time_sec: 20,
      visual: { type: "svg", svg, alt: `Right triangle with angle θ = ${theta}°`, width: 420, height: 320 },
    },
  };
}

function mediumInverseRatioSimple(rng: SeededRandom): GeneratedQuestion {
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);
  const specialAngle = rng.pick([30, 45, 60]);
  const info = SPECIAL_ANGLES[specialAngle];

  let ratioValue: string, answer: number;
  if (fnName === "sin") { ratioValue = info.sinVal === 0.5 ? "0.5" : info.sinVal.toFixed(4); answer = specialAngle; }
  else if (fnName === "cos") { ratioValue = info.cosVal === 0.5 ? "0.5" : info.cosVal.toFixed(4); answer = specialAngle; }
  else { ratioValue = info.tanVal === 1 ? "1" : info.tanVal.toFixed(4); answer = specialAngle; }

  const simpleValues: Record<string, Record<number, string>> = {
    sin: { 30: "1/2", 45: "sqrt(2)/2", 60: "sqrt(3)/2" },
    cos: { 30: "sqrt(3)/2", 45: "sqrt(2)/2", 60: "1/2" },
    tan: { 30: "1/sqrt(3)", 45: "1", 60: "sqrt(3)" },
  };
  const displayRatio = simpleValues[fnName][specialAngle];

  const params: Record<string, number | string> = { fn: fnName, angle: specialAngle };
  const opp = specialAngle === 30 ? 5 : specialAngle === 45 ? 7 : 10;
  const adj = specialAngle === 30 ? Math.round(opp / Math.tan(specialAngle * Math.PI / 180)) : specialAngle === 45 ? opp : Math.round(opp / Math.tan(specialAngle * Math.PI / 180));
  const hyp = Math.round(Math.sqrt(opp * opp + adj * adj));

  const svg = makeRightTriangleSvg({
    opp, adj, hyp, theta: "?",
    showTheta: true,
  });

  return {
    id: makeId("medium", "inverse_ratio_simple", params),
    topic: "trigonometric_ratios",
    difficulty: "medium",
    archetype: "inverse_ratio_simple",
    prompt: `Find the angle θ if ${fnName} θ = ${displayRatio}. Give your answer in degrees.`,
    answer: `${answer}`,
    worked_solution: [
      `We need to find θ where ${fnName} θ = ${displayRatio}.`,
      `Using the inverse function: θ = ${fnName}⁻¹(${displayRatio}).`,
      `This is a standard special angle: θ = ${answer}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_trig", "special_angles"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Right triangle with unknown angle θ, ${fnName} θ = ${displayRatio}`, width: 420, height: 320 },
    },
  };
}

function hardAlgebraicSideExpression(rng: SeededRandom): GeneratedQuestion {
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);
  const k1 = rng.randInt(2, 5);
  const k2 = rng.randInt(2, 5);
  const variable = rng.pick(["x", "a", "n"]);

  let opp: string, adj: string, answer: string, ratioStr: string;
  if (fnName === "tan") {
    opp = `${k1}${variable}`;
    adj = `${k2}${variable}`;
    answer = simplifyFrac(k1, k2);
    ratioStr = `${k1}${variable} / ${k2}${variable} = ${k1}/${k2}`;
  } else if (fnName === "sin") {
    opp = `${k1}${variable}`;
    const hypK = rng.randInt(k1 + 1, k1 + 5);
    adj = `?`;
    answer = simplifyFrac(k1, hypK);
    ratioStr = `${k1}${variable} / ${hypK}${variable} = ${k1}/${hypK}`;
    opp = `${k1}${variable}`;
    adj = `${k2}${variable}`;
  } else {
    adj = `${k1}${variable}`;
    const hypK = rng.randInt(k1 + 1, k1 + 5);
    opp = `${k2}${variable}`;
    answer = simplifyFrac(k1, hypK);
    ratioStr = `${k1}${variable} / ${hypK}${variable} = ${k1}/${hypK}`;
    adj = `${k1}${variable}`;
  }

  if (fnName === "tan") {
    const thetaApprox = Math.round(Math.atan2(k1, k2) * 180 / Math.PI);
    const params: Record<string, number | string> = { fn: fnName, k1, k2, var: variable };
    const svg = makeRightTriangleSvg({
      opp: `${k1}${variable}`, adj: `${k2}${variable}`, hyp: "?",
      theta: thetaApprox,
      showHyp: false,
    });

    return {
      id: makeId("hard", "algebraic_side_expression", params),
      topic: "trigonometric_ratios",
      difficulty: "hard",
      archetype: "algebraic_side_expression",
      prompt: `In a right-angled triangle, the opposite side is ${k1}${variable} and the adjacent side is ${k2}${variable}. Find tan θ as a simplified fraction.`,
      answer,
      worked_solution: [
        `tan θ = opposite / adjacent.`,
        `tan θ = ${ratioStr}.`,
        `The ${variable} cancels out: tan θ = ${answer}.`,
      ],
      metadata: {
        params,
        skills: ["algebraic_ratio", "simplify_fraction"],
        estimated_time_sec: 45,
        visual: { type: "svg", svg, alt: `Right triangle with algebraic sides: opposite=${k1}${variable}, adjacent=${k2}${variable}`, width: 420, height: 320 },
      },
    };
  }

  const ratio = fnName === "sin" ? "opposite / hypotenuse" : "adjacent / hypotenuse";
  const hypK = k1 + k2;
  answer = simplifyFrac(k1, hypK);
  const thetaApprox = fnName === "sin"
    ? Math.round(Math.asin(k1 / hypK) * 180 / Math.PI)
    : Math.round(Math.acos(k1 / hypK) * 180 / Math.PI);

  const params: Record<string, number | string> = { fn: fnName, k1, k2, var: variable, hypK };
  const oppLabel = fnName === "sin" ? `${k1}${variable}` : `${k2}${variable}`;
  const adjLabel = fnName === "cos" ? `${k1}${variable}` : `${k2}${variable}`;
  const hypLabel = `${hypK}${variable}`;
  const svg = makeRightTriangleSvg({ opp: oppLabel, adj: adjLabel, hyp: hypLabel, theta: thetaApprox });

  return {
    id: makeId("hard", "algebraic_side_expression", params),
    topic: "trigonometric_ratios",
    difficulty: "hard",
    archetype: "algebraic_side_expression",
    prompt: `In a right-angled triangle, the ${fnName === "sin" ? "opposite" : "adjacent"} side is ${k1}${variable} and the hypotenuse is ${hypK}${variable}. Find ${fnName} θ as a simplified fraction.`,
    answer,
    worked_solution: [
      `${fnName} θ = ${ratio}.`,
      `${fnName} θ = ${k1}${variable} / ${hypK}${variable} = ${k1}/${hypK}.`,
      `Simplify: ${fnName} θ = ${answer}.`,
    ],
    metadata: {
      params,
      skills: ["algebraic_ratio", "simplify_fraction"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Right triangle with algebraic sides and hypotenuse=${hypK}${variable}`, width: 420, height: 320 },
    },
  };
}

function hardTwoStep(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 6));
  const [a, b, c] = triple;

  const givenTwo = rng.pick(["opp_adj", "opp_hyp", "adj_hyp"]);
  let given1Name: string, given1Val: number, given2Name: string, given2Val: number;
  let missingName: string, missingVal: number;
  let fnName: TrigFn;

  if (givenTwo === "opp_adj") {
    given1Name = "opposite"; given1Val = a;
    given2Name = "adjacent"; given2Val = b;
    missingName = "hypotenuse"; missingVal = c;
    fnName = rng.pick(["sin", "cos"]);
  } else if (givenTwo === "opp_hyp") {
    given1Name = "opposite"; given1Val = a;
    given2Name = "hypotenuse"; given2Val = c;
    missingName = "adjacent"; missingVal = b;
    fnName = "tan";
  } else {
    given1Name = "adjacent"; given1Val = b;
    given2Name = "hypotenuse"; given2Val = c;
    missingName = "opposite"; missingVal = a;
    fnName = "tan";
  }

  let answer: string;
  if (fnName === "sin") answer = simplifyFrac(a, c);
  else if (fnName === "cos") answer = simplifyFrac(b, c);
  else answer = simplifyFrac(a, b);

  const thetaApprox = Math.round(Math.atan2(a, b) * 180 / Math.PI);
  const params: Record<string, number | string> = { a, b, c, given: givenTwo, fn: fnName };

  const svg = makeRightTriangleSvg({
    opp: givenTwo.includes("opp") ? a : "?",
    adj: givenTwo.includes("adj") ? b : "?",
    hyp: givenTwo.includes("hyp") ? c : "?",
    theta: thetaApprox,
    labelOpp: givenTwo.includes("opp") ? `${a}` : (missingName === "opposite" ? "?" : ""),
    labelAdj: givenTwo.includes("adj") ? `${b}` : (missingName === "adjacent" ? "?" : ""),
    labelHyp: givenTwo.includes("hyp") ? `${c}` : (missingName === "hypotenuse" ? "?" : ""),
  });

  return {
    id: makeId("hard", "two_step", params),
    topic: "trigonometric_ratios",
    difficulty: "hard",
    archetype: "two_step",
    prompt: `A right-angled triangle has ${given1Name} = ${given1Val} and ${given2Name} = ${given2Val}. First find the ${missingName} using Pythagoras' theorem, then find ${fnName} θ as a simplified fraction.`,
    answer,
    worked_solution: [
      `Use Pythagoras: a² + b² = c² where a=${a}, b=${b}, c=${c}.`,
      `${missingName} = ${missingVal}.`,
      `Now find ${fnName} θ = ${fnName === "sin" ? `${a}/${c}` : fnName === "cos" ? `${b}/${c}` : `${a}/${b}`}.`,
      `Simplify: ${fnName} θ = ${answer}.`,
    ],
    metadata: {
      params,
      skills: ["pythagoras", "multi_step_trig"],
      estimated_time_sec: 75,
      visual: { type: "svg", svg, alt: `Right triangle with two given sides, find the third then compute ${fnName} θ`, width: 420, height: 320 },
    },
  };
}

function hardCoordinateTriangle(rng: SeededRandom): GeneratedQuestion {
  const coords: [number, number, number, number][] = [
    [0, 0, 3, 4], [0, 0, 5, 12], [0, 0, 8, 6], [0, 0, 4, 3],
    [1, 1, 4, 5], [2, 1, 5, 5], [-3, 0, 0, 4], [0, 0, 6, 8],
  ];
  const picked = rng.pick(coords);
  const [x1, y1, x2, y2] = picked;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const opp = Math.abs(dy);
  const adj = Math.abs(dx);
  const hyp = Math.sqrt(dx * dx + dy * dy);
  const hypRound = Math.round(hyp * 100) / 100;

  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);
  let answer: string;
  if (fnName === "sin") {
    if (Number.isInteger(hyp)) answer = simplifyFrac(opp, Math.round(hyp));
    else answer = (opp / hyp).toFixed(2);
  } else if (fnName === "cos") {
    if (Number.isInteger(hyp)) answer = simplifyFrac(adj, Math.round(hyp));
    else answer = (adj / hyp).toFixed(2);
  } else {
    answer = simplifyFrac(opp, adj);
  }

  const pts = {
    A: [x1, y1] as [number, number],
    B: [x2, y1] as [number, number],
    C: [x2, y2] as [number, number],
  };

  const params: Record<string, number | string> = { x1, y1, x2, y2, fn: fnName };
  const svg = makeCoordinateTriangleSvg(pts, "vertex A", 420, 320);

  return {
    id: makeId("hard", "coordinate_triangle", params),
    topic: "trigonometric_ratios",
    difficulty: "hard",
    archetype: "coordinate_triangle",
    prompt: `A right-angled triangle has vertices at A(${x1},${y1}), B(${x2},${y1}), and C(${x2},${y2}). The right angle is at B. Find ${fnName} of the angle at A.${fnName !== "tan" && !Number.isInteger(hyp) ? " Round to 2 decimal places." : " Give your answer as a simplified fraction."}`,
    answer,
    worked_solution: [
      `From the coordinates: opposite (BC) = |${y2} − ${y1}| = ${opp}, adjacent (AB) = |${x2} − ${x1}| = ${adj}.`,
      `Hypotenuse (AC) = √(${adj}² + ${opp}²) = √${adj * adj + opp * opp} = ${hypRound}.`,
      `${fnName}(angle A) = ${fnName === "sin" ? `${opp}/${hypRound}` : fnName === "cos" ? `${adj}/${hypRound}` : `${opp}/${adj}`} = ${answer}.`,
    ],
    metadata: {
      params,
      skills: ["coordinate_geometry", "multi_step_trig"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Right triangle on coordinate grid with vertices A(${x1},${y1}), B(${x2},${y1}), C(${x2},${y2})`, width: 420, height: 320 },
    },
  };
}

function challengeSpecialAngleExact(rng: SeededRandom): GeneratedQuestion {
  const angle = rng.pick([30, 45, 60]);
  const fnName: TrigFn = rng.pick(["sin", "cos", "tan"]);
  const info = SPECIAL_ANGLES[angle];

  let answer: string;
  if (fnName === "sin") answer = info.sin;
  else if (fnName === "cos") answer = info.cos;
  else answer = info.tan;

  const params: Record<string, number | string> = { angle, fn: fnName };

  let opp: number, adj: number, hyp: number;
  if (angle === 30) { opp = 1; adj = 2; hyp = 2; }
  else if (angle === 45) { opp = 1; adj = 1; hyp = 1; }
  else { opp = 2; adj = 1; hyp = 2; }

  const svg = makeRightTriangleSvg({
    opp: angle === 45 ? "1" : angle === 30 ? "1" : "√3",
    adj: angle === 45 ? "1" : angle === 30 ? "√3" : "1",
    hyp: angle === 45 ? "√2" : "2",
    theta: angle,
  });

  return {
    id: makeId("challenge", "special_angles_exact", params),
    topic: "trigonometric_ratios",
    difficulty: "challenge",
    archetype: "special_angles_exact",
    prompt: `State the exact value of ${fnName} ${angle}°. Use sqrt() for square roots (e.g. sqrt(3)/2).`,
    answer,
    worked_solution: [
      `Recall the ${angle}° special triangle.`,
      angle === 30 ? `In a 30-60-90 triangle, sides are 1, √3, 2.` :
      angle === 45 ? `In a 45-45-90 triangle, sides are 1, 1, √2.` :
      `In a 30-60-90 triangle, sides are 1, √3, 2 (with 60° opposite √3).`,
      `${fnName} ${angle}° = ${answer}.`,
    ],
    metadata: {
      params,
      skills: ["exact_values", "special_angles"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Special ${angle}° right triangle with exact side lengths`, width: 420, height: 320 },
    },
  };
}

function challengeProveIdentityNumeric(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 6));
  const [a, b, c] = triple;
  const sinVal = a / c;
  const cosVal = b / c;
  const sum = sinVal * sinVal + cosVal * cosVal;

  const params: Record<string, number | string> = { a, b, c };
  const thetaApprox = Math.round(Math.atan2(a, b) * 180 / Math.PI);
  const svg = makeRightTriangleSvg({ opp: a, adj: b, hyp: c, theta: thetaApprox });

  return {
    id: makeId("challenge", "prove_identity_numeric", params),
    topic: "trigonometric_ratios",
    difficulty: "challenge",
    archetype: "prove_identity_numeric",
    prompt: `A right-angled triangle has sides ${a}, ${b}, and ${c}. Verify that sin²θ + cos²θ = 1 by calculating each term. What is sin²θ + cos²θ?`,
    answer: "1",
    worked_solution: [
      `sin θ = opposite/hypotenuse = ${a}/${c}.`,
      `cos θ = adjacent/hypotenuse = ${b}/${c}.`,
      `sin²θ = (${a}/${c})² = ${a * a}/${c * c}.`,
      `cos²θ = (${b}/${c})² = ${b * b}/${c * c}.`,
      `sin²θ + cos²θ = ${a * a}/${c * c} + ${b * b}/${c * c} = ${a * a + b * b}/${c * c} = ${c * c}/${c * c} = 1.`,
    ],
    metadata: {
      params,
      skills: ["trig_identity", "exact_values"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Right triangle with sides ${a}, ${b}, ${c} for Pythagorean identity verification`, width: 420, height: 320 },
    },
  };
}

function challengeMixedVisualReasoning(rng: SeededRandom): GeneratedQuestion {
  const triple = rng.pick(PYTHAGOREAN_TRIPLES.slice(0, 8));
  const [a, b, c] = triple;
  const scenario = rng.pick(["missing_opp", "missing_adj", "missing_hyp"]);

  let hiddenSide: string, hiddenVal: number, givenInfo: string;
  let showOpp: boolean, showAdj: boolean, showHyp: boolean;
  let fnName: TrigFn;
  let ratioVal: string;

  if (scenario === "missing_opp") {
    hiddenSide = "opposite"; hiddenVal = a;
    showOpp = false; showAdj = true; showHyp = true;
    fnName = rng.pick(["sin", "tan"]);
    givenInfo = `adjacent = ${b}, hypotenuse = ${c}`;
    ratioVal = fnName === "sin" ? simplifyFrac(a, c) : simplifyFrac(a, b);
  } else if (scenario === "missing_adj") {
    hiddenSide = "adjacent"; hiddenVal = b;
    showOpp = true; showAdj = false; showHyp = true;
    fnName = rng.pick(["cos", "tan"]);
    givenInfo = `opposite = ${a}, hypotenuse = ${c}`;
    ratioVal = fnName === "cos" ? simplifyFrac(b, c) : simplifyFrac(a, b);
  } else {
    hiddenSide = "hypotenuse"; hiddenVal = c;
    showOpp = true; showAdj = true; showHyp = false;
    fnName = rng.pick(["sin", "cos"]);
    givenInfo = `opposite = ${a}, adjacent = ${b}`;
    ratioVal = fnName === "sin" ? simplifyFrac(a, c) : simplifyFrac(b, c);
  }

  const thetaApprox = Math.round(Math.atan2(a, b) * 180 / Math.PI);
  const params: Record<string, number | string> = { a, b, c, scenario, fn: fnName };
  const svg = makeRightTriangleSvg({
    opp: showOpp ? a : "?", adj: showAdj ? b : "?", hyp: showHyp ? c : "?",
    theta: thetaApprox,
    labelOpp: showOpp ? `${a}` : "?",
    labelAdj: showAdj ? `${b}` : "?",
    labelHyp: showHyp ? `${c}` : "?",
  });

  return {
    id: makeId("challenge", "mixed_visual_reasoning", params),
    topic: "trigonometric_ratios",
    difficulty: "challenge",
    archetype: "mixed_visual_reasoning",
    prompt: `In the right-angled triangle, ${givenInfo} but the ${hiddenSide} is hidden. First find the ${hiddenSide} using Pythagoras' theorem, then calculate ${fnName} θ. Give your answer as a simplified fraction.`,
    answer: ratioVal,
    worked_solution: [
      `Use Pythagoras: a² + b² = c² to find the ${hiddenSide}.`,
      `${hiddenSide} = ${hiddenVal}.`,
      `Now ${fnName} θ = ${ratioVal}.`,
    ],
    metadata: {
      params,
      skills: ["pythagoras", "multi_step_trig", "visual_reasoning"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Right triangle with ${hiddenSide} hidden, other sides given`, width: 420, height: 320 },
    },
  };
}

const EASY_ARCHETYPES: ArchetypeFn[] = [
  easyIdentifyRatio("sin"),
  easyIdentifyRatio("cos"),
  easyIdentifyRatio("tan"),
  easyRatioFromLengths("sin"),
  easyRatioFromLengths("cos"),
  easyRatioFromLengths("tan"),
  easyIdentifyRatio("sin"),
  easyRatioFromLengths("cos"),
];

const MEDIUM_ARCHETYPES: ((rng: SeededRandom) => GeneratedQuestion)[] = [
  mediumFindMissingSide,
  mediumFindMissingSide,
  mediumFindMissingSide,
  mediumFindRatioDecimal,
  mediumFindRatioDecimal,
  mediumInverseRatioSimple,
  mediumInverseRatioSimple,
  mediumFindMissingSide,
];

const HARD_ARCHETYPES: ((rng: SeededRandom) => GeneratedQuestion)[] = [
  hardAlgebraicSideExpression,
  hardAlgebraicSideExpression,
  hardTwoStep,
  hardTwoStep,
  hardCoordinateTriangle,
  hardCoordinateTriangle,
  hardTwoStep,
];

const CHALLENGE_ARCHETYPES: ((rng: SeededRandom) => GeneratedQuestion)[] = [
  challengeSpecialAngleExact,
  challengeSpecialAngleExact,
  challengeProveIdentityNumeric,
  challengeProveIdentityNumeric,
  challengeMixedVisualReasoning,
  challengeMixedVisualReasoning,
  challengeSpecialAngleExact,
];

function getArchetypes(difficulty: string): ((rng: SeededRandom) => GeneratedQuestion)[] {
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
