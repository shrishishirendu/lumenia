import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "trigonometry_applications";
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

function roundTo(val: number, dp: number): number {
  const factor = Math.pow(10, dp);
  return Math.round(val * factor) / factor;
}

function formatNum(val: number, dp: number = 1): string {
  const rounded = roundTo(val, dp);
  if (Number.isInteger(rounded)) return `${rounded}`;
  return rounded.toFixed(dp).replace(/0+$/, "").replace(/\.$/, "");
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

function toDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

function makeRightTriangleSvg(opts: {
  opp: number | string; adj: number | string; hyp: number | string;
  theta: number | string;
  labelOpp?: string; labelAdj?: string; labelHyp?: string;
  showOpp?: boolean; showAdj?: boolean; showHyp?: boolean;
  showTheta?: boolean;
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

function makeElevationSvg(opts: {
  height: number | string;
  distance: number | string;
  angle: number | string;
  objectLabel?: string;
  observerLabel?: string;
  findWhat?: string;
  width?: number;
  height2?: number;
}): string {
  const W = opts.width || 460;
  const H = opts.height2 || 340;
  const pad = 40;

  const groundY = H - pad - 20;
  const obsX = pad + 30;
  const obsY = groundY;
  const buildX = W - pad - 40;
  const buildTopY = pad + 30;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${pad}" y1="${groundY}" x2="${W - pad}" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
  svg += `<rect x="${buildX - 15}" y="${buildTopY}" width="30" height="${groundY - buildTopY}" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<circle cx="${obsX}" cy="${obsY - 15}" r="6" fill="#f97316"/>`;
  svg += `<line x1="${obsX}" y1="${obsY - 9}" x2="${obsX}" y2="${obsY}" stroke="#f97316" stroke-width="2"/>`;
  svg += `<line x1="${obsX}" y1="${obsY - 5}" x2="${buildX}" y2="${buildTopY}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="6,3"/>`;
  svg += `<line x1="${obsX}" y1="${obsY - 5}" x2="${buildX + 20}" y2="${obsY - 5}" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>`;

  const arcR = 35;
  const totalAngle = Math.atan2(obsY - 5 - buildTopY, buildX - obsX);
  const arcEndX = obsX + arcR;
  const arcEndY = obsY - 5;
  const arcStartX = obsX + arcR * Math.cos(totalAngle);
  const arcStartY = obsY - 5 - arcR * Math.sin(totalAngle);
  svg += `<path d="M ${arcEndX} ${arcEndY} A ${arcR} ${arcR} 0 0 0 ${arcStartX} ${arcStartY}" fill="none" stroke="#dc2626" stroke-width="1.5"/>`;
  const labelR = arcR + 14;
  const midAngle = totalAngle / 2;
  svg += `<text x="${obsX + labelR * Math.cos(midAngle)}" y="${obsY - 5 - labelR * Math.sin(midAngle)}" text-anchor="start" fill="#dc2626" font-size="12" font-weight="bold">${opts.angle}°</text>`;

  const heightLabel = opts.findWhat === "height" ? "h = ?" : `${opts.height} m`;
  svg += `<text x="${buildX + 20}" y="${(buildTopY + groundY) / 2}" text-anchor="start" fill="#16a34a" font-size="12" font-weight="bold">${heightLabel}</text>`;

  const distLabel = opts.findWhat === "distance" ? "d = ?" : `${opts.distance} m`;
  svg += `<text x="${(obsX + buildX) / 2}" y="${groundY + 18}" text-anchor="middle" fill="#2563eb" font-size="12" font-weight="bold">${distLabel}</text>`;

  svg += `<text x="${obsX}" y="${obsY + 18}" text-anchor="middle" fill="#333" font-size="10">${opts.observerLabel || "Observer"}</text>`;
  svg += `<text x="${buildX}" y="${buildTopY - 8}" text-anchor="middle" fill="#333" font-size="10">${opts.objectLabel || "Building"}</text>`;

  svg += `</svg>`;
  return svg;
}

function makeDepressionSvg(opts: {
  height: number | string;
  distance: number | string;
  angle: number | string;
  topLabel?: string;
  bottomLabel?: string;
  findWhat?: string;
  width?: number;
  height2?: number;
}): string {
  const W = opts.width || 460;
  const H = opts.height2 || 340;
  const pad = 40;

  const seaY = H - pad - 20;
  const cliffX = pad + 40;
  const cliffTopY = pad + 30;
  const boatX = W - pad - 40;
  const boatY = seaY;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${pad}" y1="${seaY}" x2="${W - pad}" y2="${seaY}" stroke="#3b82f6" stroke-width="2"/>`;
  svg += `<rect x="${cliffX - 20}" y="${cliffTopY}" width="40" height="${seaY - cliffTopY}" fill="#d4a574" stroke="#92400e" stroke-width="1.5"/>`;
  svg += `<circle cx="${cliffX}" cy="${cliffTopY - 8}" r="5" fill="#f97316"/>`;
  svg += `<text x="${boatX}" y="${boatY - 5}" text-anchor="middle" fill="#333" font-size="16">⛵</text>`;
  svg += `<line x1="${cliffX}" y1="${cliffTopY}" x2="${boatX}" y2="${boatY}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="6,3"/>`;
  svg += `<line x1="${cliffX}" y1="${cliffTopY}" x2="${boatX + 20}" y2="${cliffTopY}" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>`;

  const arcR = 35;
  const deprAngle = Math.atan2(boatY - cliffTopY, boatX - cliffX);
  const arcStartX = cliffX + arcR;
  const arcStartY = cliffTopY;
  const arcEndX = cliffX + arcR * Math.cos(deprAngle);
  const arcEndY = cliffTopY + arcR * Math.sin(deprAngle);
  svg += `<path d="M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 1 ${arcEndX} ${arcEndY}" fill="none" stroke="#dc2626" stroke-width="1.5"/>`;
  const labelR = arcR + 14;
  const midAngle = deprAngle / 2;
  svg += `<text x="${cliffX + labelR * Math.cos(midAngle)}" y="${cliffTopY + labelR * Math.sin(midAngle)}" text-anchor="start" fill="#dc2626" font-size="12" font-weight="bold">${opts.angle}°</text>`;

  const heightLabel = opts.findWhat === "height" ? "h = ?" : `${opts.height} m`;
  svg += `<text x="${cliffX - 30}" y="${(cliffTopY + seaY) / 2}" text-anchor="end" fill="#16a34a" font-size="12" font-weight="bold">${heightLabel}</text>`;

  const distLabel = opts.findWhat === "distance" ? "d = ?" : `${opts.distance} m`;
  svg += `<text x="${(cliffX + boatX) / 2}" y="${seaY + 18}" text-anchor="middle" fill="#2563eb" font-size="12" font-weight="bold">${distLabel}</text>`;

  svg += `<text x="${cliffX}" y="${cliffTopY - 18}" text-anchor="middle" fill="#333" font-size="10">${opts.topLabel || "Cliff top"}</text>`;
  svg += `<text x="${boatX}" y="${boatY + 18}" text-anchor="middle" fill="#333" font-size="10">${opts.bottomLabel || "Boat"}</text>`;

  svg += `</svg>`;
  return svg;
}

function makeLadderSvg(opts: {
  ladderLen: number | string;
  wallHeight: number | string;
  groundDist: number | string;
  angle: number | string;
  findWhat?: string;
}): string {
  const W = 420;
  const H = 320;
  const pad = 40;

  const groundY = H - pad;
  const wallX = W - pad - 60;
  const wallTopY = pad + 40;
  const footX = pad + 50;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${pad}" y1="${groundY}" x2="${W - pad}" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
  svg += `<line x1="${wallX}" y1="${wallTopY - 20}" x2="${wallX}" y2="${groundY}" stroke="#666" stroke-width="3"/>`;
  svg += `<line x1="${footX}" y1="${groundY}" x2="${wallX}" y2="${wallTopY}" stroke="#f97316" stroke-width="3"/>`;

  const sqSize = 12;
  svg += `<polyline points="${wallX - sqSize},${groundY} ${wallX - sqSize},${groundY - sqSize} ${wallX},${groundY - sqSize}" fill="none" stroke="#333" stroke-width="1.5"/>`;

  const ladderLabel = opts.findWhat === "ladder" ? "L = ?" : `${opts.ladderLen} m`;
  svg += `<text x="${(footX + wallX) / 2 - 20}" y="${(groundY + wallTopY) / 2 - 10}" text-anchor="end" fill="#9333ea" font-size="12" font-weight="bold" transform="rotate(-45, ${(footX + wallX) / 2 - 20}, ${(groundY + wallTopY) / 2 - 10})">${ladderLabel}</text>`;

  const wallLabel = opts.findWhat === "height" ? "h = ?" : `${opts.wallHeight} m`;
  svg += `<text x="${wallX + 18}" y="${(wallTopY + groundY) / 2}" text-anchor="start" fill="#16a34a" font-size="12" font-weight="bold">${wallLabel}</text>`;

  const groundLabel = opts.findWhat === "ground" ? "d = ?" : `${opts.groundDist} m`;
  svg += `<text x="${(footX + wallX) / 2}" y="${groundY + 18}" text-anchor="middle" fill="#2563eb" font-size="12" font-weight="bold">${groundLabel}</text>`;

  svg += `<text x="${footX + 30}" y="${groundY - 8}" text-anchor="middle" fill="#dc2626" font-size="12" font-weight="bold">${opts.angle}°</text>`;

  svg += `</svg>`;
  return svg;
}

type ArchetypeFn = (rng: SeededRandom) => GeneratedQuestion;

function easyBuildingHeight(rng: SeededRandom): GeneratedQuestion {
  const distance = rng.randInt(15, 60);
  const angle = rng.pick([25, 30, 35, 40, 45, 50, 55, 60]);
  const height = roundTo(distance * Math.tan(toRad(angle)), 1);

  const params: Record<string, number | string> = { distance, angle };
  const svg = makeElevationSvg({ height, distance, angle, findWhat: "height", objectLabel: "Building" });

  return {
    id: makeId("easy", "building_height", params),
    topic: "trigonometry_applications",
    difficulty: "easy",
    archetype: "building_height",
    prompt: `A person stands ${distance} m from the base of a building. The angle of elevation to the top of the building is ${angle}°. Find the height of the building. Round to 1 decimal place.`,
    answer: formatNum(height),
    worked_solution: [
      `Draw a right-angled triangle with the distance as the adjacent side and the height as the opposite side.`,
      `tan ${angle}° = height / ${distance}.`,
      `height = ${distance} × tan ${angle}° = ${distance} × ${formatNum(Math.tan(toRad(angle)), 4)} = ${formatNum(height)} m.`,
    ],
    metadata: {
      params,
      skills: ["angle_of_elevation", "apply_tan"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Person looking up at building, angle of elevation ${angle}°, distance ${distance} m`, width: 460, height: 340 },
    },
  };
}

function easyDistanceFromDepression(rng: SeededRandom): GeneratedQuestion {
  const cliffHeight = rng.randInt(20, 80);
  const angle = rng.pick([20, 25, 30, 35, 40, 45, 50]);
  const distance = roundTo(cliffHeight / Math.tan(toRad(angle)), 1);

  const params: Record<string, number | string> = { cliffHeight, angle };
  const svg = makeDepressionSvg({ height: cliffHeight, distance, angle, findWhat: "distance", topLabel: "Cliff top", bottomLabel: "Ship" });

  return {
    id: makeId("easy", "distance_from_depression", params),
    topic: "trigonometry_applications",
    difficulty: "easy",
    archetype: "distance_from_depression",
    prompt: `From the top of a ${cliffHeight} m cliff, the angle of depression to a ship is ${angle}°. Find the horizontal distance from the base of the cliff to the ship. Round to 1 decimal place.`,
    answer: formatNum(distance),
    worked_solution: [
      `The angle of depression equals the angle of elevation from the ship (alternate angles).`,
      `tan ${angle}° = ${cliffHeight} / distance.`,
      `distance = ${cliffHeight} / tan ${angle}° = ${cliffHeight} / ${formatNum(Math.tan(toRad(angle)), 4)} = ${formatNum(distance)} m.`,
    ],
    metadata: {
      params,
      skills: ["angle_of_depression", "apply_tan"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Looking down from ${cliffHeight} m cliff at ship, angle of depression ${angle}°`, width: 460, height: 340 },
    },
  };
}

function easyLadderWall(rng: SeededRandom): GeneratedQuestion {
  const ladderLen = rng.randInt(3, 10);
  const angle = rng.pick([55, 60, 65, 70, 75]);
  const wallHeight = roundTo(ladderLen * Math.sin(toRad(angle)), 1);
  const groundDist = roundTo(ladderLen * Math.cos(toRad(angle)), 1);

  const params: Record<string, number | string> = { ladderLen, angle };
  const svg = makeLadderSvg({ ladderLen, wallHeight, groundDist, angle, findWhat: "height" });

  return {
    id: makeId("easy", "ladder_wall", params),
    topic: "trigonometry_applications",
    difficulty: "easy",
    archetype: "ladder_wall",
    prompt: `A ${ladderLen} m ladder leans against a wall making an angle of ${angle}° with the ground. How high up the wall does the ladder reach? Round to 1 decimal place.`,
    answer: formatNum(wallHeight),
    worked_solution: [
      `The ladder is the hypotenuse, the wall height is opposite the angle.`,
      `sin ${angle}° = height / ${ladderLen}.`,
      `height = ${ladderLen} × sin ${angle}° = ${formatNum(wallHeight)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_sin", "real_world_context"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Ladder of ${ladderLen} m against wall at ${angle}°`, width: 420, height: 320 },
    },
  };
}

function easyShadowLength(rng: SeededRandom): GeneratedQuestion {
  const treeHeight = rng.randInt(5, 25);
  const sunAngle = rng.pick([25, 30, 35, 40, 45, 50, 55, 60]);
  const shadowLen = roundTo(treeHeight / Math.tan(toRad(sunAngle)), 1);

  const params: Record<string, number | string> = { treeHeight, sunAngle };
  const svg = makeElevationSvg({ height: treeHeight, distance: shadowLen, angle: sunAngle, objectLabel: "Tree", observerLabel: "Shadow tip", findWhat: "distance" });

  return {
    id: makeId("easy", "shadow_length", params),
    topic: "trigonometry_applications",
    difficulty: "easy",
    archetype: "shadow_length",
    prompt: `A ${treeHeight} m tall tree casts a shadow on the ground. The angle of elevation of the sun is ${sunAngle}°. Find the length of the shadow. Round to 1 decimal place.`,
    answer: formatNum(shadowLen),
    worked_solution: [
      `The tree height is opposite and the shadow is adjacent to the sun's elevation angle.`,
      `tan ${sunAngle}° = ${treeHeight} / shadow.`,
      `shadow = ${treeHeight} / tan ${sunAngle}° = ${formatNum(shadowLen)} m.`,
    ],
    metadata: {
      params,
      skills: ["angle_of_elevation", "apply_tan"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Tree of height ${treeHeight} m casting shadow, sun elevation ${sunAngle}°`, width: 460, height: 340 },
    },
  };
}

function easyElevationAngle(rng: SeededRandom): GeneratedQuestion {
  const height = rng.randInt(10, 50);
  const distance = rng.randInt(15, 60);
  const angle = roundTo(toDeg(Math.atan(height / distance)), 1);

  const params: Record<string, number | string> = { height, distance };
  const svg = makeElevationSvg({ height, distance, angle: "?", objectLabel: "Tower" });

  return {
    id: makeId("easy", "elevation_angle", params),
    topic: "trigonometry_applications",
    difficulty: "easy",
    archetype: "elevation_angle",
    prompt: `A tower is ${height} m tall. A person stands ${distance} m from the base. Find the angle of elevation to the top of the tower. Round to 1 decimal place.`,
    answer: formatNum(angle),
    worked_solution: [
      `tan θ = opposite / adjacent = ${height} / ${distance} = ${formatNum(height / distance, 4)}.`,
      `θ = tan⁻¹(${formatNum(height / distance, 4)}) = ${formatNum(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "angle_of_elevation"],
      estimated_time_sec: 35,
      visual: { type: "svg", svg, alt: `Tower ${height} m, observer ${distance} m away, find elevation angle`, width: 460, height: 340 },
    },
  };
}

function easyKiteString(rng: SeededRandom): GeneratedQuestion {
  const kiteHeight = rng.randInt(15, 50);
  const angle = rng.pick([30, 35, 40, 45, 50, 55, 60]);
  const stringLen = roundTo(kiteHeight / Math.sin(toRad(angle)), 1);

  const params: Record<string, number | string> = { kiteHeight, angle };
  const svg = makeRightTriangleSvg({
    opp: kiteHeight, adj: "?", hyp: "?",
    theta: angle,
    labelOpp: `${kiteHeight} m`, labelHyp: "string = ?",
    showAdj: false,
  });

  return {
    id: makeId("easy", "kite_string", params),
    topic: "trigonometry_applications",
    difficulty: "easy",
    archetype: "kite_string",
    prompt: `A kite is flying at a height of ${kiteHeight} m. The string makes an angle of ${angle}° with the ground. Find the length of the string. Round to 1 decimal place.`,
    answer: formatNum(stringLen),
    worked_solution: [
      `The height is opposite the angle, and the string is the hypotenuse.`,
      `sin ${angle}° = ${kiteHeight} / string length.`,
      `string length = ${kiteHeight} / sin ${angle}° = ${formatNum(stringLen)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_sin", "real_world_context"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Kite at ${kiteHeight} m height, string at ${angle}° angle`, width: 420, height: 320 },
    },
  };
}

function easyDepressionFromCliff(rng: SeededRandom): GeneratedQuestion {
  const cliffHeight = rng.randInt(30, 100);
  const horizontalDist = rng.randInt(40, 150);
  const angle = roundTo(toDeg(Math.atan(cliffHeight / horizontalDist)), 1);

  const params: Record<string, number | string> = { cliffHeight, horizontalDist };
  const svg = makeDepressionSvg({ height: cliffHeight, distance: horizontalDist, angle: "?", topLabel: "Cliff", bottomLabel: "Boat" });

  return {
    id: makeId("easy", "depression_from_cliff", params),
    topic: "trigonometry_applications",
    difficulty: "easy",
    archetype: "depression_from_cliff",
    prompt: `From the top of a ${cliffHeight} m cliff, a boat is ${horizontalDist} m from the base. Find the angle of depression to the boat. Round to 1 decimal place.`,
    answer: formatNum(angle),
    worked_solution: [
      `The angle of depression equals the angle of elevation from the boat (alternate angles).`,
      `tan θ = ${cliffHeight} / ${horizontalDist} = ${formatNum(cliffHeight / horizontalDist, 4)}.`,
      `θ = tan⁻¹(${formatNum(cliffHeight / horizontalDist, 4)}) = ${formatNum(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "angle_of_depression"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Cliff ${cliffHeight} m, boat ${horizontalDist} m away, find depression angle`, width: 460, height: 340 },
    },
  };
}

function easyFlagpoleShadow(rng: SeededRandom): GeneratedQuestion {
  const shadowLen = rng.randInt(5, 30);
  const sunAngle = rng.pick([30, 35, 40, 45, 50, 55, 60, 65]);
  const flagpoleHeight = roundTo(shadowLen * Math.tan(toRad(sunAngle)), 1);

  const params: Record<string, number | string> = { shadowLen, sunAngle };
  const svg = makeElevationSvg({ height: flagpoleHeight, distance: shadowLen, angle: sunAngle, objectLabel: "Flagpole", observerLabel: "Shadow tip", findWhat: "height" });

  return {
    id: makeId("easy", "flagpole_shadow", params),
    topic: "trigonometry_applications",
    difficulty: "easy",
    archetype: "flagpole_shadow",
    prompt: `A flagpole casts a shadow of ${shadowLen} m. The angle of elevation of the sun is ${sunAngle}°. Find the height of the flagpole. Round to 1 decimal place.`,
    answer: formatNum(flagpoleHeight),
    worked_solution: [
      `tan ${sunAngle}° = height / ${shadowLen}.`,
      `height = ${shadowLen} × tan ${sunAngle}° = ${formatNum(flagpoleHeight)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_tan", "angle_of_elevation"],
      estimated_time_sec: 35,
      visual: { type: "svg", svg, alt: `Flagpole with ${shadowLen} m shadow, sun at ${sunAngle}°`, width: 460, height: 340 },
    },
  };
}

function mediumLighthouseBoat(rng: SeededRandom): GeneratedQuestion {
  const lighthouseH = rng.randInt(20, 60);
  const angle = rng.pick([12, 15, 18, 20, 25, 28, 30, 35]);
  const distance = roundTo(lighthouseH / Math.tan(toRad(angle)), 1);

  const params: Record<string, number | string> = { lighthouseH, angle };
  const svg = makeDepressionSvg({ height: lighthouseH, distance, angle, topLabel: "Lighthouse", bottomLabel: "Boat", findWhat: "distance" });

  return {
    id: makeId("medium", "lighthouse_boat", params),
    topic: "trigonometry_applications",
    difficulty: "medium",
    archetype: "lighthouse_boat",
    prompt: `A lighthouse is ${lighthouseH} m tall. The angle of depression from the top of the lighthouse to a boat is ${angle}°. Find the distance from the base of the lighthouse to the boat. Round to 1 decimal place.`,
    answer: formatNum(distance),
    worked_solution: [
      `The angle of depression from the lighthouse = angle of elevation from the boat = ${angle}°.`,
      `tan ${angle}° = ${lighthouseH} / distance.`,
      `distance = ${lighthouseH} / tan ${angle}° = ${formatNum(distance)} m.`,
    ],
    metadata: {
      params,
      skills: ["angle_of_depression", "apply_tan"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Lighthouse ${lighthouseH} m, depression angle ${angle}° to boat`, width: 460, height: 340 },
    },
  };
}

function mediumCliffMultipleMeasurements(rng: SeededRandom): GeneratedQuestion {
  const distance = rng.randInt(30, 80);
  const angle = rng.pick([25, 30, 35, 40, 45, 50, 55]);
  const cliffHeight = roundTo(distance * Math.tan(toRad(angle)), 1);
  const sightLine = roundTo(cliffHeight / Math.sin(toRad(angle)), 1);

  const params: Record<string, number | string> = { distance, angle };
  const svg = makeElevationSvg({ height: cliffHeight, distance, angle, objectLabel: "Cliff", findWhat: "height" });

  return {
    id: makeId("medium", "cliff_multiple", params),
    topic: "trigonometry_applications",
    difficulty: "medium",
    archetype: "cliff_multiple",
    prompt: `A person stands ${distance} m from the base of a cliff. The angle of elevation to the top is ${angle}°. Find the height of the cliff and the straight-line distance from the person to the cliff top. Give the height rounded to 1 decimal place.`,
    answer: formatNum(cliffHeight),
    worked_solution: [
      `tan ${angle}° = height / ${distance}.`,
      `height = ${distance} × tan ${angle}° = ${formatNum(cliffHeight)} m.`,
      `The sight line = height / sin ${angle}° = ${formatNum(sightLine)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_tan", "apply_sin", "multi_step"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Person ${distance} m from cliff, elevation angle ${angle}°`, width: 460, height: 340 },
    },
  };
}

function mediumAirplaneDistance(rng: SeededRandom): GeneratedQuestion {
  const altitude = rng.randInt(2000, 10000);
  const angle = rng.pick([20, 25, 30, 35, 40, 45]);
  const horizontalDist = roundTo(altitude / Math.tan(toRad(angle)), 1);

  const params: Record<string, number | string> = { altitude, angle };
  const svg = makeDepressionSvg({ height: altitude, distance: horizontalDist, angle, topLabel: "Airplane", bottomLabel: "Point on ground", findWhat: "distance" });

  return {
    id: makeId("medium", "airplane_distance", params),
    topic: "trigonometry_applications",
    difficulty: "medium",
    archetype: "airplane_distance",
    prompt: `An airplane is flying at an altitude of ${altitude} m. The angle of depression to a point on the ground is ${angle}°. Find the horizontal distance from the airplane to the point. Round to 1 decimal place.`,
    answer: formatNum(horizontalDist),
    worked_solution: [
      `tan ${angle}° = ${altitude} / horizontal distance.`,
      `horizontal distance = ${altitude} / tan ${angle}° = ${formatNum(horizontalDist)} m.`,
    ],
    metadata: {
      params,
      skills: ["angle_of_depression", "apply_tan"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Airplane at ${altitude} m altitude, depression angle ${angle}°`, width: 460, height: 340 },
    },
  };
}

function mediumRampAngle(rng: SeededRandom): GeneratedQuestion {
  const rampLen = rng.randInt(3, 12);
  const riseHeight = roundTo(rng.randInt(1, Math.floor(rampLen * 0.4)) * 0.1 * 10, 1);
  const angle = roundTo(toDeg(Math.asin(riseHeight / rampLen)), 1);

  const params: Record<string, number | string> = { rampLen, riseHeight };
  const svg = makeRightTriangleSvg({
    opp: riseHeight, adj: "?", hyp: rampLen,
    theta: "?",
    labelOpp: `${riseHeight} m`, labelHyp: `${rampLen} m`,
    showAdj: false,
  });

  return {
    id: makeId("medium", "ramp_angle", params),
    topic: "trigonometry_applications",
    difficulty: "medium",
    archetype: "ramp_angle",
    prompt: `A wheelchair ramp is ${rampLen} m long and rises ${riseHeight} m vertically. Find the angle the ramp makes with the horizontal. Round to 1 decimal place.`,
    answer: formatNum(angle),
    worked_solution: [
      `sin θ = opposite / hypotenuse = ${riseHeight} / ${rampLen} = ${formatNum(riseHeight / rampLen, 4)}.`,
      `θ = sin⁻¹(${formatNum(riseHeight / rampLen, 4)}) = ${formatNum(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_sin", "real_world_context"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Ramp ${rampLen} m long, rises ${riseHeight} m`, width: 420, height: 320 },
    },
  };
}

function mediumObservationTower(rng: SeededRandom): GeneratedQuestion {
  const towerH = rng.randInt(15, 50);
  const angle = rng.pick([20, 25, 30, 35, 40, 45, 50]);
  const distance = roundTo(towerH / Math.tan(toRad(angle)), 2);

  const params: Record<string, number | string> = { towerH, angle };
  const svg = makeElevationSvg({ height: towerH, distance, angle, objectLabel: "Tower", findWhat: "distance" });

  return {
    id: makeId("medium", "observation_tower", params),
    topic: "trigonometry_applications",
    difficulty: "medium",
    archetype: "observation_tower",
    prompt: `From a point on level ground, the angle of elevation to the top of a ${towerH} m observation tower is ${angle}°. How far is the point from the base of the tower? Round to 2 decimal places.`,
    answer: formatNum(distance, 2),
    worked_solution: [
      `tan ${angle}° = ${towerH} / distance.`,
      `distance = ${towerH} / tan ${angle}° = ${formatNum(distance, 2)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_tan", "real_world_context"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Observation tower ${towerH} m, find distance at ${angle}° elevation`, width: 460, height: 340 },
    },
  };
}

function mediumTwoStepElevation(rng: SeededRandom): GeneratedQuestion {
  const baseHeight = rng.randInt(2, 5);
  const totalHeight = rng.randInt(15, 40);
  const distance = rng.randInt(20, 60);
  const buildingHeight = totalHeight - baseHeight;
  const angle = roundTo(toDeg(Math.atan(totalHeight / distance)), 1);

  const params: Record<string, number | string> = { baseHeight, totalHeight, distance };
  const svg = makeElevationSvg({ height: totalHeight, distance, angle: formatNum(angle), objectLabel: "Antenna on building" });

  return {
    id: makeId("medium", "two_step_elevation", params),
    topic: "trigonometry_applications",
    difficulty: "medium",
    archetype: "two_step_elevation",
    prompt: `A person (eye level ${baseHeight} m) stands ${distance} m from a building. The angle of elevation to the top of the building is ${formatNum(angle)}°. Find the total height of the building (from ground). Round to 1 decimal place.`,
    answer: formatNum(totalHeight),
    worked_solution: [
      `The height above eye level = ${distance} × tan ${formatNum(angle)}° = ${formatNum(distance * Math.tan(toRad(angle)), 1)} m.`,
      `But this measures from eye level (${baseHeight} m).`,
      `Total building height ≈ ${formatNum(totalHeight)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_tan", "multi_step", "real_world_context"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Person at ${baseHeight} m eye level, ${distance} m from building`, width: 460, height: 340 },
    },
  };
}

function mediumSlopeAngle(rng: SeededRandom): GeneratedQuestion {
  const run = rng.randInt(50, 200);
  const rise = rng.randInt(5, 40);
  const angle = roundTo(toDeg(Math.atan(rise / run)), 1);

  const params: Record<string, number | string> = { run, rise };
  const svg = makeRightTriangleSvg({
    opp: rise, adj: run, hyp: "?",
    theta: "?",
    labelOpp: `${rise} m`, labelAdj: `${run} m`,
    showHyp: false,
  });

  return {
    id: makeId("medium", "slope_angle", params),
    topic: "trigonometry_applications",
    difficulty: "medium",
    archetype: "slope_angle",
    prompt: `A road rises ${rise} m over a horizontal distance of ${run} m. Find the angle the road makes with the horizontal. Round to 1 decimal place.`,
    answer: formatNum(angle),
    worked_solution: [
      `tan θ = rise / run = ${rise} / ${run} = ${formatNum(rise / run, 4)}.`,
      `θ = tan⁻¹(${formatNum(rise / run, 4)}) = ${formatNum(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "gradient"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Road rising ${rise} m over ${run} m horizontal`, width: 420, height: 320 },
    },
  };
}

function mediumGuyWire(rng: SeededRandom): GeneratedQuestion {
  const poleH = rng.randInt(8, 25);
  const wireAngle = rng.pick([40, 45, 50, 55, 60, 65, 70]);
  const wireLen = roundTo(poleH / Math.sin(toRad(wireAngle)), 1);

  const params: Record<string, number | string> = { poleH, wireAngle };
  const svg = makeLadderSvg({
    ladderLen: wireLen, wallHeight: poleH,
    groundDist: roundTo(poleH / Math.tan(toRad(wireAngle)), 1),
    angle: wireAngle, findWhat: "ladder",
  });

  return {
    id: makeId("medium", "guy_wire", params),
    topic: "trigonometry_applications",
    difficulty: "medium",
    archetype: "guy_wire",
    prompt: `A guy wire is attached to the top of a ${poleH} m pole. The wire makes an angle of ${wireAngle}° with the ground. Find the length of the wire. Round to 1 decimal place.`,
    answer: formatNum(wireLen),
    worked_solution: [
      `sin ${wireAngle}° = ${poleH} / wire length.`,
      `wire length = ${poleH} / sin ${wireAngle}° = ${formatNum(wireLen)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_sin", "real_world_context"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Pole ${poleH} m with guy wire at ${wireAngle}°`, width: 420, height: 320 },
    },
  };
}

function hardTwoObservers(rng: SeededRandom): GeneratedQuestion {
  const buildingH = rng.randInt(20, 60);
  const d1 = rng.randInt(15, 40);
  const d2 = d1 + rng.randInt(10, 30);
  const angle1 = roundTo(toDeg(Math.atan(buildingH / d1)), 1);
  const angle2 = roundTo(toDeg(Math.atan(buildingH / d2)), 1);

  const calcHeight = roundTo(d1 * Math.tan(toRad(angle1)), 1);

  const params: Record<string, number | string> = { d1, d2, angle1: formatNum(angle1), angle2: formatNum(angle2) };

  const W = 500;
  const H = 340;
  const pad = 40;
  const groundY = H - pad - 20;
  const buildX = W / 2;
  const buildTopY = pad + 30;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${pad}" y1="${groundY}" x2="${W - pad}" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
  svg += `<rect x="${buildX - 12}" y="${buildTopY}" width="24" height="${groundY - buildTopY}" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<circle cx="${pad + 40}" cy="${groundY - 10}" r="5" fill="#f97316"/>`;
  svg += `<text x="${pad + 40}" y="${groundY + 16}" text-anchor="middle" fill="#333" font-size="10">A</text>`;
  svg += `<circle cx="${W - pad - 40}" cy="${groundY - 10}" r="5" fill="#f97316"/>`;
  svg += `<text x="${W - pad - 40}" y="${groundY + 16}" text-anchor="middle" fill="#333" font-size="10">B</text>`;
  svg += `<line x1="${pad + 40}" y1="${groundY - 10}" x2="${buildX}" y2="${buildTopY}" stroke="#dc2626" stroke-width="1" stroke-dasharray="4,3"/>`;
  svg += `<line x1="${W - pad - 40}" y1="${groundY - 10}" x2="${buildX}" y2="${buildTopY}" stroke="#16a34a" stroke-width="1" stroke-dasharray="4,3"/>`;
  svg += `<text x="${pad + 55}" y="${groundY - 20}" fill="#dc2626" font-size="11" font-weight="bold">${formatNum(angle1)}°</text>`;
  svg += `<text x="${W - pad - 75}" y="${groundY - 20}" fill="#16a34a" font-size="11" font-weight="bold">${formatNum(angle2)}°</text>`;
  svg += `<text x="${(pad + 40 + buildX) / 2}" y="${groundY + 30}" text-anchor="middle" fill="#2563eb" font-size="11">${d1} m</text>`;
  svg += `<text x="${(W - pad - 40 + buildX) / 2}" y="${groundY + 30}" text-anchor="middle" fill="#16a34a" font-size="11">${d2} m</text>`;
  svg += `<text x="${buildX + 20}" y="${(buildTopY + groundY) / 2}" fill="#9333ea" font-size="12" font-weight="bold">h = ?</text>`;
  svg += `</svg>`;

  return {
    id: makeId("hard", "two_observers", params),
    topic: "trigonometry_applications",
    difficulty: "hard",
    archetype: "two_observers",
    prompt: `Two observers A and B are on opposite sides of a building. A is ${d1} m from the base with an angle of elevation of ${formatNum(angle1)}°. B is ${d2} m from the base with an angle of elevation of ${formatNum(angle2)}°. Find the height of the building using observer A's data. Round to 1 decimal place.`,
    answer: formatNum(calcHeight),
    worked_solution: [
      `From A: tan ${formatNum(angle1)}° = h / ${d1}.`,
      `h = ${d1} × tan ${formatNum(angle1)}° = ${formatNum(calcHeight)} m.`,
      `Verify from B: ${d2} × tan ${formatNum(angle2)}° ≈ ${formatNum(d2 * Math.tan(toRad(angle2)), 1)} m (should be close).`,
    ],
    metadata: {
      params,
      skills: ["apply_tan", "verification", "multi_step"],
      estimated_time_sec: 75,
      visual: { type: "svg", svg, alt: `Two observers on opposite sides of a building`, width: 500, height: 340 },
    },
  };
}

function hardTwoTrianglesCommonHeight(rng: SeededRandom): GeneratedQuestion {
  const height = rng.randInt(15, 40);
  const angle1 = rng.pick([30, 35, 40, 45, 50]);
  const angle2 = rng.pick([25, 30, 35, 40]);
  while (angle2 >= angle1) { return hardTwoTrianglesCommonHeight(rng); }
  const d1 = roundTo(height / Math.tan(toRad(angle1)), 1);
  const d2 = roundTo(height / Math.tan(toRad(angle2)), 1);
  const totalDist = roundTo(d2 - d1, 1);

  const params: Record<string, number | string> = { height, angle1, angle2 };
  const svg = makeElevationSvg({ height, distance: d1, angle: angle1, objectLabel: "Tower" });

  return {
    id: makeId("hard", "two_triangles_common_height", params),
    topic: "trigonometry_applications",
    difficulty: "hard",
    archetype: "two_triangles_common_height",
    prompt: `A person walks towards a tower. At point A, the angle of elevation is ${angle2}°. After walking closer, at point B, the angle of elevation is ${angle1}°. If the tower is ${height} m tall, find the distance from A to B. Round to 1 decimal place.`,
    answer: formatNum(totalDist),
    worked_solution: [
      `From B: distance to base = ${height} / tan ${angle1}° = ${formatNum(d1)} m.`,
      `From A: distance to base = ${height} / tan ${angle2}° = ${formatNum(d2)} m.`,
      `Distance A to B = ${formatNum(d2)} - ${formatNum(d1)} = ${formatNum(totalDist)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_tan", "multi_step", "subtraction"],
      estimated_time_sec: 70,
      visual: { type: "svg", svg, alt: `Tower with two observation points A and B`, width: 460, height: 340 },
    },
  };
}

function hardPythagorasThenTrig(rng: SeededRandom): GeneratedQuestion {
  const base = rng.randInt(6, 15);
  const height = rng.randInt(8, 20);
  const hyp = roundTo(Math.sqrt(base * base + height * height), 2);
  const angle = roundTo(toDeg(Math.atan(height / base)), 1);

  const params: Record<string, number | string> = { base, height };
  const svg = makeRightTriangleSvg({
    opp: height, adj: base, hyp: "?",
    theta: "?",
    labelOpp: `${height} m`, labelAdj: `${base} m`, labelHyp: "? m",
  });

  return {
    id: makeId("hard", "pythagoras_then_trig", params),
    topic: "trigonometry_applications",
    difficulty: "hard",
    archetype: "pythagoras_then_trig",
    prompt: `A zip line connects two platforms. The horizontal distance is ${base} m and the vertical drop is ${height} m. Find the angle the zip line makes with the horizontal. Round to 1 decimal place.`,
    answer: formatNum(angle),
    worked_solution: [
      `The zip line length = √(${base}² + ${height}²) = √(${base * base + height * height}) = ${formatNum(hyp, 2)} m.`,
      `tan θ = ${height} / ${base} = ${formatNum(height / base, 4)}.`,
      `θ = tan⁻¹(${formatNum(height / base, 4)}) = ${formatNum(angle)}°.`,
    ],
    metadata: {
      params,
      skills: ["pythagoras", "inverse_tan", "multi_step"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Zip line: horizontal ${base} m, vertical drop ${height} m`, width: 420, height: 320 },
    },
  };
}

function hardBearingDistance(rng: SeededRandom): GeneratedQuestion {
  const northDist = rng.randInt(5, 20);
  const eastDist = rng.randInt(5, 20);
  const directDist = roundTo(Math.sqrt(northDist * northDist + eastDist * eastDist), 1);
  const bearing = roundTo(toDeg(Math.atan(eastDist / northDist)), 1);

  const params: Record<string, number | string> = { northDist, eastDist };

  const W = 420;
  const H = 380;
  const pad = 40;
  const cx = W / 2;
  const cy = H / 2;
  const scale = Math.min((W - 2 * pad - 60) / eastDist, (H - 2 * pad - 60) / northDist) * 0.7;
  const startX = cx - eastDist * scale / 2;
  const startY = cy + northDist * scale / 2;
  const midX = startX;
  const midY = startY - northDist * scale;
  const endX = midX + eastDist * scale;
  const endY = midY;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${startX}" y1="${startY}" x2="${midX}" y2="${midY}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${midX}" y1="${midY}" x2="${endX}" y2="${endY}" stroke="#16a34a" stroke-width="2"/>`;
  svg += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,3"/>`;
  svg += `<line x1="${startX}" y1="${startY + 20}" x2="${startX}" y2="${midY - 20}" stroke="#999" stroke-width="1" stroke-dasharray="3,3"/>`;
  svg += `<text x="${startX}" y="${midY - 25}" text-anchor="middle" fill="#999" font-size="11">N</text>`;
  svg += `<circle cx="${startX}" cy="${startY}" r="4" fill="#2563eb"/>`;
  svg += `<text x="${startX - 10}" y="${startY + 16}" text-anchor="end" fill="#333" font-size="11">Start</text>`;
  svg += `<circle cx="${endX}" cy="${endY}" r="4" fill="#dc2626"/>`;
  svg += `<text x="${endX + 8}" y="${endY - 8}" fill="#333" font-size="11">End</text>`;
  svg += `<text x="${startX - 14}" y="${(startY + midY) / 2}" text-anchor="end" fill="#2563eb" font-size="12" font-weight="bold">${northDist} km N</text>`;
  svg += `<text x="${(midX + endX) / 2}" y="${midY - 8}" text-anchor="middle" fill="#16a34a" font-size="12" font-weight="bold">${eastDist} km E</text>`;
  svg += `<text x="${(startX + endX) / 2 + 15}" y="${(startY + endY) / 2 + 15}" text-anchor="start" fill="#dc2626" font-size="12" font-weight="bold">? km</text>`;
  svg += `</svg>`;

  return {
    id: makeId("hard", "bearing_distance", params),
    topic: "trigonometry_applications",
    difficulty: "hard",
    archetype: "bearing_distance",
    prompt: `A hiker walks ${northDist} km north then ${eastDist} km east. Find the straight-line distance back to the starting point. Round to 1 decimal place.`,
    answer: formatNum(directDist),
    worked_solution: [
      `The path forms a right-angled triangle with legs ${northDist} km and ${eastDist} km.`,
      `Direct distance = √(${northDist}² + ${eastDist}²) = √(${northDist * northDist + eastDist * eastDist}) = ${formatNum(directDist)} km.`,
      `The bearing from start to end = tan⁻¹(${eastDist}/${northDist}) = ${formatNum(bearing)}° (bearing 0${Math.round(bearing) < 100 ? Math.round(bearing) < 10 ? "0" : "" : ""}${Math.round(bearing)}°).`,
    ],
    metadata: {
      params,
      skills: ["pythagoras", "bearing", "multi_step"],
      estimated_time_sec: 65,
      visual: { type: "svg", svg, alt: `Hiker path: ${northDist} km north then ${eastDist} km east`, width: 420, height: 380 },
    },
  };
}

function hardBuildingBetweenObservers(rng: SeededRandom): GeneratedQuestion {
  const totalDist = rng.randInt(40, 100);
  const angle1 = rng.pick([30, 35, 40, 45, 50]);
  const angle2 = rng.pick([25, 30, 35, 40, 45]);
  const d1 = roundTo(totalDist * Math.tan(toRad(angle2)) / (Math.tan(toRad(angle1)) + Math.tan(toRad(angle2))), 2);
  const height = roundTo(d1 * Math.tan(toRad(angle1)), 1);

  const params: Record<string, number | string> = { totalDist, angle1, angle2 };
  const svg = makeElevationSvg({ height, distance: roundTo(d1, 1), angle: angle1, objectLabel: "Building" });

  return {
    id: makeId("hard", "building_between_observers", params),
    topic: "trigonometry_applications",
    difficulty: "hard",
    archetype: "building_between_observers",
    prompt: `Two people stand ${totalDist} m apart on the same side. Person A sees the top of a building at an angle of elevation of ${angle1}°, and person B (further away) sees it at ${angle2}°. Find the height of the building. Round to 1 decimal place.`,
    answer: formatNum(height),
    worked_solution: [
      `Let d be the distance from A to the building base.`,
      `h = d × tan ${angle1}° and h = (d + ${totalDist}) × tan ${angle2}°... wait, they are on the same side.`,
      `Actually: h = d tan ${angle1}° = (d + ${totalDist}) tan ${angle2}° when B is further.`,
      `Hmm, let me redo: d tan ${angle1}° = (d + x) tan ${angle2}° where total separation is ${totalDist}.`,
      `Using the formula: h = ${totalDist} × tan ${angle1}° × tan ${angle2}° / (tan ${angle1}° - tan ${angle2}°) when A is closer.`,
      `h ≈ ${formatNum(height)} m.`,
    ],
    metadata: {
      params,
      skills: ["simultaneous_equations", "apply_tan", "multi_step"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Building between two observers ${totalDist} m apart`, width: 460, height: 340 },
    },
  };
}

function hardAngleThenMeasure(rng: SeededRandom): GeneratedQuestion {
  const distance = rng.randInt(20, 60);
  const angle = rng.pick([25, 30, 35, 40, 45, 50, 55]);
  const height = roundTo(distance * Math.tan(toRad(angle)), 1);
  const sightLine = roundTo(distance / Math.cos(toRad(angle)), 1);

  const params: Record<string, number | string> = { distance, angle };
  const svg = makeElevationSvg({ height, distance, angle, objectLabel: "Monument" });

  return {
    id: makeId("hard", "angle_then_measure", params),
    topic: "trigonometry_applications",
    difficulty: "hard",
    archetype: "angle_then_measure",
    prompt: `From a point ${distance} m from the base of a monument, the angle of elevation to the top is ${angle}°. Find the direct (line-of-sight) distance from the person to the top. Round to 1 decimal place.`,
    answer: formatNum(sightLine),
    worked_solution: [
      `First find the height: h = ${distance} × tan ${angle}° = ${formatNum(height)} m.`,
      `Direct distance = ${distance} / cos ${angle}° = ${formatNum(sightLine)} m.`,
      `Alternatively: √(${distance}² + ${formatNum(height)}²) = ${formatNum(sightLine)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_cos", "apply_tan", "multi_step"],
      estimated_time_sec: 65,
      visual: { type: "svg", svg, alt: `Monument at ${distance} m, elevation ${angle}°, find sight line`, width: 460, height: 340 },
    },
  };
}

function hardInclinedPlane(rng: SeededRandom): GeneratedQuestion {
  const slopeLen = rng.randInt(5, 15);
  const slopeAngle = rng.pick([15, 20, 25, 30]);
  const verticalRise = roundTo(slopeLen * Math.sin(toRad(slopeAngle)), 2);
  const horizontalRun = roundTo(slopeLen * Math.cos(toRad(slopeAngle)), 2);

  const params: Record<string, number | string> = { slopeLen, slopeAngle };
  const svg = makeRightTriangleSvg({
    opp: "?", adj: "?", hyp: slopeLen,
    theta: slopeAngle,
    labelOpp: "rise = ?", labelAdj: "run = ?", labelHyp: `${slopeLen} m`,
  });

  return {
    id: makeId("hard", "inclined_plane", params),
    topic: "trigonometry_applications",
    difficulty: "hard",
    archetype: "inclined_plane",
    prompt: `An object slides ${slopeLen} m down a ramp inclined at ${slopeAngle}° to the horizontal. Find the vertical distance it drops. Round to 2 decimal places.`,
    answer: formatNum(verticalRise, 2),
    worked_solution: [
      `The vertical drop = ${slopeLen} × sin ${slopeAngle}°.`,
      `= ${slopeLen} × ${formatNum(Math.sin(toRad(slopeAngle)), 4)} = ${formatNum(verticalRise, 2)} m.`,
      `(Horizontal distance = ${slopeLen} × cos ${slopeAngle}° = ${formatNum(horizontalRun, 2)} m.)`,
    ],
    metadata: {
      params,
      skills: ["apply_sin", "apply_cos", "inclined_plane"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Inclined plane ${slopeLen} m at ${slopeAngle}°`, width: 420, height: 320 },
    },
  };
}

function challengeNavigationBearing(rng: SeededRandom): GeneratedQuestion {
  const northDist = rng.randInt(5, 25);
  const eastDist = rng.randInt(5, 25);
  const directDist = roundTo(Math.sqrt(northDist * northDist + eastDist * eastDist), 1);
  const bearing = roundTo(toDeg(Math.atan(eastDist / northDist)), 1);

  const params: Record<string, number | string> = { northDist, eastDist };

  const W = 420;
  const H = 380;
  const pad = 40;
  const cx = W / 2;
  const cy = H / 2;
  const scale = Math.min((W - 2 * pad - 60) / eastDist, (H - 2 * pad - 60) / northDist) * 0.7;
  const startX = cx - eastDist * scale / 2;
  const startY = cy + northDist * scale / 2;
  const midX = startX;
  const midY = startY - northDist * scale;
  const endX = midX + eastDist * scale;
  const endY = midY;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${startX}" y1="${startY}" x2="${midX}" y2="${midY}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${midX}" y1="${midY}" x2="${endX}" y2="${endY}" stroke="#16a34a" stroke-width="2"/>`;
  svg += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,3"/>`;
  svg += `<line x1="${startX}" y1="${startY + 20}" x2="${startX}" y2="${midY - 20}" stroke="#999" stroke-width="1" stroke-dasharray="3,3"/>`;
  svg += `<text x="${startX}" y="${midY - 25}" text-anchor="middle" fill="#999" font-size="11">N</text>`;
  svg += `<circle cx="${startX}" cy="${startY}" r="4" fill="#2563eb"/>`;
  svg += `<text x="${startX - 10}" y="${startY + 16}" text-anchor="end" fill="#333" font-size="11">Start</text>`;
  svg += `<circle cx="${endX}" cy="${endY}" r="4" fill="#dc2626"/>`;
  svg += `<text x="${endX + 8}" y="${endY - 8}" fill="#333" font-size="11">End</text>`;
  svg += `<text x="${startX - 14}" y="${(startY + midY) / 2}" text-anchor="end" fill="#2563eb" font-size="12" font-weight="bold">${northDist} km</text>`;
  svg += `<text x="${(midX + endX) / 2}" y="${midY - 8}" text-anchor="middle" fill="#16a34a" font-size="12" font-weight="bold">${eastDist} km</text>`;
  svg += `</svg>`;

  return {
    id: makeId("challenge", "navigation_bearing", params),
    topic: "trigonometry_applications",
    difficulty: "challenge",
    archetype: "navigation_bearing",
    prompt: `A ship sails ${northDist} km north then ${eastDist} km east. Find the bearing from the starting point to the final position. Round to 1 decimal place.`,
    answer: formatNum(bearing),
    worked_solution: [
      `The bearing is measured clockwise from north.`,
      `tan θ = east / north = ${eastDist} / ${northDist} = ${formatNum(eastDist / northDist, 4)}.`,
      `θ = tan⁻¹(${formatNum(eastDist / northDist, 4)}) = ${formatNum(bearing)}°.`,
      `The bearing is ${formatNum(bearing)}° (or 0${Math.round(bearing)}°T).`,
    ],
    metadata: {
      params,
      skills: ["bearing", "inverse_tan", "navigation"],
      estimated_time_sec: 70,
      visual: { type: "svg", svg, alt: `Ship sails ${northDist} km N then ${eastDist} km E`, width: 420, height: 380 },
    },
  };
}

function challengeElevationAndDepression(rng: SeededRandom): GeneratedQuestion {
  const buildingH = rng.randInt(20, 50);
  const towerH = rng.randInt(buildingH + 10, buildingH + 40);
  const distance = rng.randInt(30, 80);
  const elevAngle = roundTo(toDeg(Math.atan((towerH - buildingH) / distance)), 1);
  const deprAngle = roundTo(toDeg(Math.atan(buildingH / distance)), 1);

  const totalAngle = roundTo(elevAngle + deprAngle, 1);

  const params: Record<string, number | string> = { buildingH, towerH, distance };

  const W = 500;
  const H = 380;
  const pad = 40;
  const groundY = H - pad - 20;
  const bldgX = pad + 60;
  const towerX = W - pad - 60;
  const bldgTopY = groundY - (groundY - pad - 30) * (buildingH / towerH);
  const towerTopY = pad + 30;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${pad}" y1="${groundY}" x2="${W - pad}" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
  svg += `<rect x="${bldgX - 15}" y="${bldgTopY}" width="30" height="${groundY - bldgTopY}" fill="#fbbf24" stroke="#92400e" stroke-width="1.5"/>`;
  svg += `<rect x="${towerX - 12}" y="${towerTopY}" width="24" height="${groundY - towerTopY}" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<line x1="${bldgX}" y1="${bldgTopY}" x2="${towerX}" y2="${towerTopY}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="5,3"/>`;
  svg += `<line x1="${bldgX}" y1="${bldgTopY}" x2="${towerX}" y2="${groundY}" stroke="#16a34a" stroke-width="1" stroke-dasharray="5,3"/>`;
  svg += `<text x="${bldgX - 25}" y="${(bldgTopY + groundY) / 2}" fill="#92400e" font-size="11" font-weight="bold">${buildingH} m</text>`;
  svg += `<text x="${towerX + 18}" y="${(towerTopY + groundY) / 2}" fill="#2563eb" font-size="11" font-weight="bold">${towerH} m</text>`;
  svg += `<text x="${(bldgX + towerX) / 2}" y="${groundY + 16}" text-anchor="middle" fill="#333" font-size="11">${distance} m</text>`;
  svg += `<text x="${bldgX + 20}" y="${bldgTopY - 10}" fill="#dc2626" font-size="11">${formatNum(elevAngle)}° elev</text>`;
  svg += `<text x="${bldgX + 20}" y="${bldgTopY + 20}" fill="#16a34a" font-size="11">${formatNum(deprAngle)}° depr</text>`;
  svg += `</svg>`;

  return {
    id: makeId("challenge", "elevation_depression_combined", params),
    topic: "trigonometry_applications",
    difficulty: "challenge",
    archetype: "elevation_depression_combined",
    prompt: `From the top of a ${buildingH} m building, the angle of elevation to the top of a tower ${distance} m away is ${formatNum(elevAngle)}°. The angle of depression to the base of the tower is ${formatNum(deprAngle)}°. Find the height of the tower. Round to 1 decimal place.`,
    answer: formatNum(towerH, 1),
    worked_solution: [
      `Height above the building = ${distance} × tan ${formatNum(elevAngle)}° = ${formatNum(distance * Math.tan(toRad(elevAngle)), 1)} m.`,
      `Tower height = building height + extra height = ${buildingH} + ${formatNum(distance * Math.tan(toRad(elevAngle)), 1)} = ${formatNum(towerH, 1)} m.`,
      `Verify: base distance from depression: ${distance} × tan ${formatNum(deprAngle)}° ≈ ${formatNum(distance * Math.tan(toRad(deprAngle)), 1)} m ≈ ${buildingH} m ✓.`,
    ],
    metadata: {
      params,
      skills: ["angle_of_elevation", "angle_of_depression", "multi_step"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Building and tower, elevation and depression angles`, width: 500, height: 380 },
    },
  };
}

function challengeAreaUsingTrig(rng: SeededRandom): GeneratedQuestion {
  const a = rng.randInt(8, 20);
  const b = rng.randInt(8, 20);
  const angle = rng.pick([30, 45, 60, 120, 135, 150]);
  const area = roundTo(0.5 * a * b * Math.sin(toRad(angle)), 1);

  const params: Record<string, number | string> = { a, b, angle };
  const svg = makeRightTriangleSvg({
    opp: "?", adj: a, hyp: b,
    theta: angle,
    labelAdj: `${a} cm`, labelHyp: `${b} cm`,
    showOpp: false,
  });

  return {
    id: makeId("challenge", "area_using_trig", params),
    topic: "trigonometry_applications",
    difficulty: "challenge",
    archetype: "area_using_trig",
    prompt: `A triangular plot of land has two sides of ${a} m and ${b} m with an included angle of ${angle}°. Find the area of the triangle. Round to 1 decimal place.`,
    answer: formatNum(area),
    worked_solution: [
      `Area = ½ × a × b × sin C.`,
      `Area = ½ × ${a} × ${b} × sin ${angle}°.`,
      `Area = ½ × ${a} × ${b} × ${formatNum(Math.sin(toRad(angle)), 4)} = ${formatNum(area)} m².`,
    ],
    metadata: {
      params,
      skills: ["area_formula", "apply_sin"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Triangle with sides ${a} m, ${b} m and included angle ${angle}°`, width: 420, height: 320 },
    },
  };
}

function challengeTwoAnglesOfElevation(rng: SeededRandom): GeneratedQuestion {
  const height = rng.randInt(20, 60);
  const d1 = rng.randInt(15, 40);
  const sep = rng.randInt(10, 30);
  const d2 = d1 + sep;
  const angle1 = roundTo(toDeg(Math.atan(height / d1)), 1);
  const angle2 = roundTo(toDeg(Math.atan(height / d2)), 1);

  const calcH = roundTo(sep * Math.tan(toRad(angle1)) * Math.tan(toRad(angle2)) / (Math.tan(toRad(angle1)) - Math.tan(toRad(angle2))), 1);

  const params: Record<string, number | string> = { sep, angle1: formatNum(angle1), angle2: formatNum(angle2) };
  const svg = makeElevationSvg({ height: calcH, distance: d1, angle: formatNum(angle1), objectLabel: "Tower" });

  return {
    id: makeId("challenge", "two_angles_elevation", params),
    topic: "trigonometry_applications",
    difficulty: "challenge",
    archetype: "two_angles_elevation",
    prompt: `From point A, the angle of elevation to a tower is ${formatNum(angle1)}°. From point B, ${sep} m further from the tower, it is ${formatNum(angle2)}°. Find the height of the tower. Round to 1 decimal place.`,
    answer: formatNum(calcH),
    worked_solution: [
      `Let d = distance from A to base. h = d tan ${formatNum(angle1)}° = (d + ${sep}) tan ${formatNum(angle2)}°.`,
      `d tan ${formatNum(angle1)}° = d tan ${formatNum(angle2)}° + ${sep} tan ${formatNum(angle2)}°.`,
      `d(tan ${formatNum(angle1)}° - tan ${formatNum(angle2)}°) = ${sep} tan ${formatNum(angle2)}°.`,
      `d = ${sep} × tan ${formatNum(angle2)}° / (tan ${formatNum(angle1)}° - tan ${formatNum(angle2)}°).`,
      `h = d × tan ${formatNum(angle1)}° ≈ ${formatNum(calcH)} m.`,
    ],
    metadata: {
      params,
      skills: ["simultaneous_equations", "apply_tan", "multi_step"],
      estimated_time_sec: 100,
      visual: { type: "svg", svg, alt: `Tower viewed from two positions ${sep} m apart`, width: 460, height: 340 },
    },
  };
}

function challengeSurveyingRiver(rng: SeededRandom): GeneratedQuestion {
  const baseline = rng.randInt(30, 80);
  const angle = rng.pick([30, 35, 40, 45, 50, 55, 60]);
  const riverWidth = roundTo(baseline * Math.tan(toRad(angle)), 1);

  const params: Record<string, number | string> = { baseline, angle };

  const W = 460;
  const H = 340;
  const pad = 40;
  const riverTop = H / 2 - 30;
  const riverBottom = H / 2 + 30;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<rect x="${pad}" y="${riverTop}" width="${W - 2 * pad}" height="${riverBottom - riverTop}" fill="#bfdbfe" opacity="0.5"/>`;
  svg += `<line x1="${pad}" y1="${riverTop}" x2="${W - pad}" y2="${riverTop}" stroke="#3b82f6" stroke-width="1.5"/>`;
  svg += `<line x1="${pad}" y1="${riverBottom}" x2="${W - pad}" y2="${riverBottom}" stroke="#3b82f6" stroke-width="1.5"/>`;
  svg += `<text x="${W / 2}" y="${(riverTop + riverBottom) / 2 + 4}" text-anchor="middle" fill="#1d4ed8" font-size="13">River</text>`;

  const ptAx = pad + 60;
  const ptAy = riverBottom + 50;
  const ptBx = ptAx + 150;
  const ptBy = ptAy;
  const ptCx = ptAx;
  const ptCy = riverTop - 20;

  svg += `<circle cx="${ptAx}" cy="${ptAy}" r="4" fill="#dc2626"/>`;
  svg += `<text x="${ptAx}" y="${ptAy + 16}" text-anchor="middle" fill="#dc2626" font-size="11" font-weight="bold">A</text>`;
  svg += `<circle cx="${ptBx}" cy="${ptBy}" r="4" fill="#16a34a"/>`;
  svg += `<text x="${ptBx}" y="${ptBy + 16}" text-anchor="middle" fill="#16a34a" font-size="11" font-weight="bold">B</text>`;
  svg += `<circle cx="${ptCx}" cy="${ptCy}" r="4" fill="#9333ea"/>`;
  svg += `<text x="${ptCx}" y="${ptCy - 10}" text-anchor="middle" fill="#9333ea" font-size="11" font-weight="bold">C (tree)</text>`;

  svg += `<line x1="${ptAx}" y1="${ptAy}" x2="${ptBx}" y2="${ptBy}" stroke="#333" stroke-width="2"/>`;
  svg += `<line x1="${ptAx}" y1="${ptAy}" x2="${ptCx}" y2="${ptCy}" stroke="#dc2626" stroke-width="1" stroke-dasharray="4,3"/>`;
  svg += `<line x1="${ptBx}" y1="${ptBy}" x2="${ptCx}" y2="${ptCy}" stroke="#16a34a" stroke-width="1" stroke-dasharray="4,3"/>`;

  svg += `<text x="${(ptAx + ptBx) / 2}" y="${ptAy + 30}" text-anchor="middle" fill="#333" font-size="12" font-weight="bold">${baseline} m</text>`;
  svg += `<text x="${ptBx - 30}" y="${ptBy - 12}" fill="#16a34a" font-size="11" font-weight="bold">${angle}°</text>`;
  svg += `</svg>`;

  return {
    id: makeId("challenge", "surveying_river", params),
    topic: "trigonometry_applications",
    difficulty: "challenge",
    archetype: "surveying_river",
    prompt: `To measure the width of a river, a surveyor marks point A on one bank and measures a baseline AB of ${baseline} m along the bank. From B, the angle to a tree C directly across from A is ${angle}°. Find the width of the river (AC). Round to 1 decimal place.`,
    answer: formatNum(riverWidth),
    worked_solution: [
      `Triangle ABC has a right angle at A (C is directly across from A).`,
      `tan ${angle}° = AC / AB = AC / ${baseline}.`,
      `AC = ${baseline} × tan ${angle}° = ${formatNum(riverWidth)} m.`,
    ],
    metadata: {
      params,
      skills: ["apply_tan", "surveying", "real_world_context"],
      estimated_time_sec: 70,
      visual: { type: "svg", svg, alt: `Surveying across river: baseline ${baseline} m, angle ${angle}°`, width: 460, height: 340 },
    },
  };
}

function challengeComplexBearing(rng: SeededRandom): GeneratedQuestion {
  const dist1 = rng.randInt(5, 20);
  const bearing1 = rng.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]);
  const east1 = roundTo(dist1 * Math.sin(toRad(bearing1)), 2);
  const north1 = roundTo(dist1 * Math.cos(toRad(bearing1)), 2);

  const dist2 = rng.randInt(5, 20);
  const bearing2 = rng.pick([30, 45, 60, 90, 120, 135]);
  const east2 = roundTo(dist2 * Math.sin(toRad(bearing2)), 2);
  const north2 = roundTo(dist2 * Math.cos(toRad(bearing2)), 2);

  const totalEast = roundTo(east1 + east2, 2);
  const totalNorth = roundTo(north1 + north2, 2);
  const directDist = roundTo(Math.sqrt(totalEast * totalEast + totalNorth * totalNorth), 1);

  const params: Record<string, number | string> = { dist1, bearing1, dist2, bearing2 };

  const W = 420;
  const H = 380;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<text x="${W / 2}" y="20" text-anchor="middle" fill="#333" font-size="12">Leg 1: ${dist1} km on bearing ${bearing1.toString().padStart(3, "0")}°</text>`;
  svg += `<text x="${W / 2}" y="38" text-anchor="middle" fill="#333" font-size="12">Leg 2: ${dist2} km on bearing ${bearing2.toString().padStart(3, "0")}°</text>`;
  svg += `<text x="${W / 2}" y="56" text-anchor="middle" fill="#dc2626" font-size="13" font-weight="bold">Find: direct distance back to start</text>`;

  const cx = W / 2;
  const cy = H / 2 + 20;
  const maxCoord = Math.max(Math.abs(totalEast), Math.abs(totalNorth), Math.abs(east1), Math.abs(north1)) + 2;
  const scale = 120 / maxCoord;

  const startX = cx;
  const startY = cy;
  const mid1X = cx + east1 * scale;
  const mid1Y = cy - north1 * scale;
  const endX = cx + totalEast * scale;
  const endY = cy - totalNorth * scale;

  svg += `<line x1="${startX}" y1="${startY - 60}" x2="${startX}" y2="${startY + 60}" stroke="#ddd" stroke-width="0.5"/>`;
  svg += `<line x1="${startX - 60}" y1="${startY}" x2="${startX + 60}" y2="${startY}" stroke="#ddd" stroke-width="0.5"/>`;
  svg += `<text x="${startX}" y="${startY - 65}" text-anchor="middle" fill="#999" font-size="10">N</text>`;

  svg += `<line x1="${startX}" y1="${startY}" x2="${mid1X}" y2="${mid1Y}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${mid1X}" y1="${mid1Y}" x2="${endX}" y2="${endY}" stroke="#16a34a" stroke-width="2"/>`;
  svg += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="#dc2626" stroke-width="2" stroke-dasharray="5,3"/>`;

  svg += `<circle cx="${startX}" cy="${startY}" r="4" fill="#333"/>`;
  svg += `<circle cx="${mid1X}" cy="${mid1Y}" r="3" fill="#2563eb"/>`;
  svg += `<circle cx="${endX}" cy="${endY}" r="4" fill="#dc2626"/>`;
  svg += `<text x="${startX - 12}" y="${startY + 16}" fill="#333" font-size="10">Start</text>`;
  svg += `<text x="${endX + 8}" y="${endY}" fill="#dc2626" font-size="10">End</text>`;
  svg += `<text x="${(startX + endX) / 2 + 10}" y="${(startY + endY) / 2 + 15}" fill="#dc2626" font-size="12" font-weight="bold">? km</text>`;

  svg += `</svg>`;

  return {
    id: makeId("challenge", "complex_bearing", params),
    topic: "trigonometry_applications",
    difficulty: "challenge",
    archetype: "complex_bearing",
    prompt: `A boat sails ${dist1} km on a bearing of ${bearing1.toString().padStart(3, "0")}°, then ${dist2} km on a bearing of ${bearing2.toString().padStart(3, "0")}°. Find the direct distance from the starting point. Round to 1 decimal place.`,
    answer: formatNum(directDist),
    worked_solution: [
      `Leg 1: East = ${dist1} sin ${bearing1}° = ${formatNum(east1, 2)}, North = ${dist1} cos ${bearing1}° = ${formatNum(north1, 2)}.`,
      `Leg 2: East = ${dist2} sin ${bearing2}° = ${formatNum(east2, 2)}, North = ${dist2} cos ${bearing2}° = ${formatNum(north2, 2)}.`,
      `Total East = ${formatNum(totalEast, 2)}, Total North = ${formatNum(totalNorth, 2)}.`,
      `Distance = √(${formatNum(totalEast, 2)}² + ${formatNum(totalNorth, 2)}²) = ${formatNum(directDist)} km.`,
    ],
    metadata: {
      params,
      skills: ["bearing", "component_vectors", "pythagoras"],
      estimated_time_sec: 100,
      visual: { type: "svg", svg, alt: `Two-leg bearing problem`, width: 420, height: 380 },
    },
  };
}

function challengeBestObservationAngle(rng: SeededRandom): GeneratedQuestion {
  const signBottom = rng.randInt(3, 8);
  const signTop = signBottom + rng.randInt(2, 6);
  const distance = rng.randInt(5, 20);
  const angleTop = roundTo(toDeg(Math.atan(signTop / distance)), 1);
  const angleBottom = roundTo(toDeg(Math.atan(signBottom / distance)), 1);
  const viewAngle = roundTo(angleTop - angleBottom, 1);

  const params: Record<string, number | string> = { signBottom, signTop, distance };

  const W = 460;
  const H = 340;
  const pad = 40;
  const groundY = H - pad - 20;
  const signX = W - pad - 50;
  const obsX = pad + 40;
  const signBottomY = groundY - (groundY - pad - 40) * (signBottom / signTop);
  const signTopY = pad + 40;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${pad}" y1="${groundY}" x2="${W - pad}" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
  svg += `<line x1="${signX}" y1="${groundY}" x2="${signX}" y2="${signTopY - 10}" stroke="#666" stroke-width="2"/>`;
  svg += `<rect x="${signX - 20}" y="${signTopY}" width="40" height="${signBottomY - signTopY}" fill="#fbbf24" stroke="#92400e" stroke-width="1.5"/>`;
  svg += `<text x="${signX}" y="${(signTopY + signBottomY) / 2 + 4}" text-anchor="middle" fill="#333" font-size="10">SIGN</text>`;
  svg += `<circle cx="${obsX}" cy="${groundY - 10}" r="5" fill="#f97316"/>`;
  svg += `<line x1="${obsX}" y1="${groundY - 10}" x2="${signX}" y2="${signTopY}" stroke="#dc2626" stroke-width="1" stroke-dasharray="4,3"/>`;
  svg += `<line x1="${obsX}" y1="${groundY - 10}" x2="${signX}" y2="${signBottomY}" stroke="#16a34a" stroke-width="1" stroke-dasharray="4,3"/>`;
  svg += `<text x="${signX + 25}" y="${(signTopY + signBottomY) / 2}" fill="#9333ea" font-size="11" font-weight="bold">${signTop - signBottom} m</text>`;
  svg += `<text x="${signX + 25}" y="${(signBottomY + groundY) / 2}" fill="#16a34a" font-size="11">${signBottom} m</text>`;
  svg += `<text x="${(obsX + signX) / 2}" y="${groundY + 16}" text-anchor="middle" fill="#2563eb" font-size="12" font-weight="bold">${distance} m</text>`;
  svg += `</svg>`;

  return {
    id: makeId("challenge", "best_observation_angle", params),
    topic: "trigonometry_applications",
    difficulty: "challenge",
    archetype: "best_observation_angle",
    prompt: `A sign extends from ${signBottom} m to ${signTop} m above the ground on a pole. A person stands ${distance} m away. Find the angle subtended by the sign at the person's eye level (ground level). Round to 1 decimal place.`,
    answer: formatNum(viewAngle),
    worked_solution: [
      `Angle to top of sign = tan⁻¹(${signTop}/${distance}) = ${formatNum(angleTop)}°.`,
      `Angle to bottom of sign = tan⁻¹(${signBottom}/${distance}) = ${formatNum(angleBottom)}°.`,
      `Viewing angle = ${formatNum(angleTop)}° - ${formatNum(angleBottom)}° = ${formatNum(viewAngle)}°.`,
    ],
    metadata: {
      params,
      skills: ["inverse_tan", "subtraction_of_angles", "multi_step"],
      estimated_time_sec: 70,
      visual: { type: "svg", svg, alt: `Sign on pole from ${signBottom} m to ${signTop} m, observer ${distance} m away`, width: 460, height: 340 },
    },
  };
}

const EASY_ARCHETYPES: ArchetypeFn[] = [
  easyBuildingHeight,
  easyDistanceFromDepression,
  easyLadderWall,
  easyShadowLength,
  easyElevationAngle,
  easyKiteString,
  easyDepressionFromCliff,
  easyFlagpoleShadow,
];

const MEDIUM_ARCHETYPES: ArchetypeFn[] = [
  mediumLighthouseBoat,
  mediumCliffMultipleMeasurements,
  mediumAirplaneDistance,
  mediumRampAngle,
  mediumObservationTower,
  mediumTwoStepElevation,
  mediumSlopeAngle,
  mediumGuyWire,
];

const HARD_ARCHETYPES: ArchetypeFn[] = [
  hardTwoObservers,
  hardTwoTrianglesCommonHeight,
  hardPythagorasThenTrig,
  hardBearingDistance,
  hardBuildingBetweenObservers,
  hardAngleThenMeasure,
  hardInclinedPlane,
];

const CHALLENGE_ARCHETYPES: ArchetypeFn[] = [
  challengeNavigationBearing,
  challengeElevationAndDepression,
  challengeAreaUsingTrig,
  challengeTwoAnglesOfElevation,
  challengeSurveyingRiver,
  challengeComplexBearing,
  challengeBestObservationAngle,
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
