import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "surface_area_of_prisms";
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

function formatAnswer(val: number, dp: number = 2): string {
  const rounded = roundTo(val, dp);
  if (Number.isInteger(rounded)) return `${rounded}`;
  return rounded.toFixed(dp).replace(/0+$/, "").replace(/\.$/, "");
}

function makeRectPrismSvg(l: number | string, w: number | string, h: number | string, unknown?: string): string {
  const W = 420, H = 320;
  const pad = 50;
  const dx = 60, dy = 40;
  const bw = 180, bh = 140;

  const x0 = pad + dx, y0 = H - pad;
  const x1 = x0 + bw, y1 = y0;
  const x2 = x1, y2 = y0 - bh;
  const x3 = x0, y3 = y0 - bh;

  const x4 = x0 + dx, y4 = y0 - dy;
  const x5 = x1 + dx, y5 = y1 - dy;
  const x6 = x1 + dx, y6 = y2 - dy;
  const x7 = x0 + dx, y7 = y3 - dy;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;

  svg += `<polygon points="${x0},${y0} ${x1},${y1} ${x5},${y5} ${x4},${y4}" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<polygon points="${x1},${y1} ${x5},${y5} ${x6},${y6} ${x2},${y2}" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<polygon points="${x3},${y3} ${x2},${y2} ${x6},${y6} ${x7},${y7}" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>`;

  svg += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${x0}" y1="${y0}" x2="${x3}" y2="${y3}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${x0}" y1="${y0}" x2="${x4}" y2="${y4}" stroke="#2563eb" stroke-width="2" stroke-dasharray="6,4"/>`;
  svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${x1}" y1="${y1}" x2="${x5}" y2="${y5}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${x3}" y1="${y3}" x2="${x2}" y2="${y2}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${x3}" y1="${y3}" x2="${x7}" y2="${y7}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${x4}" y1="${y4}" x2="${x5}" y2="${y5}" stroke="#2563eb" stroke-width="2" stroke-dasharray="6,4"/>`;
  svg += `<line x1="${x4}" y1="${y4}" x2="${x7}" y2="${y7}" stroke="#2563eb" stroke-width="2" stroke-dasharray="6,4"/>`;
  svg += `<line x1="${x5}" y1="${y5}" x2="${x6}" y2="${y6}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${x7}" y1="${y7}" x2="${x6}" y2="${y6}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${x2}" y1="${y2}" x2="${x6}" y2="${y6}" stroke="#2563eb" stroke-width="2"/>`;

  const lLabel = unknown === "l" ? "?" : `${l}`;
  const wLabel = unknown === "w" ? "?" : `${w}`;
  const hLabel = unknown === "h" ? "?" : `${h}`;

  svg += `<text x="${(x0 + x1) / 2}" y="${y0 + 20}" text-anchor="middle" fill="#16a34a" font-size="14" font-weight="bold">${lLabel}</text>`;
  svg += `<text x="${(x1 + x5) / 2 + 12}" y="${(y1 + y5) / 2 + 10}" text-anchor="start" fill="#9333ea" font-size="14" font-weight="bold">${wLabel}</text>`;
  svg += `<text x="${x1 + 14}" y="${(y1 + y2) / 2}" text-anchor="start" fill="#dc2626" font-size="14" font-weight="bold">${hLabel}</text>`;

  svg += `</svg>`;
  return svg;
}

function makeTriPrismSvg(base: number | string, triHeight: number | string, length: number | string, unknown?: string): string {
  const W = 420, H = 320;
  const pad = 50;
  const dx = 80, dy = 30;

  const bx0 = pad + 30, by0 = H - pad;
  const bx1 = bx0 + 160, by1 = by0;
  const bxMid = (bx0 + bx1) / 2, byMid = by0 - 120;

  const fx0 = bx0 + dx, fy0 = by0 - dy;
  const fx1 = bx1 + dx, fy1 = by1 - dy;
  const fxMid = bxMid + dx, fyMid = byMid - dy;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;

  svg += `<polygon points="${bx0},${by0} ${bx1},${by1} ${bxMid},${byMid}" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<polygon points="${fx0},${fy0} ${fx1},${fy1} ${fxMid},${fyMid}" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/>`;

  svg += `<polygon points="${bx0},${by0} ${bx1},${by1} ${fx1},${fy1} ${fx0},${fy0}" fill="#93c5fd" fill-opacity="0.4" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<polygon points="${bx1},${by1} ${bxMid},${byMid} ${fxMid},${fyMid} ${fx1},${fy1}" fill="#60a5fa" fill-opacity="0.3" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<polygon points="${bx0},${by0} ${bxMid},${byMid} ${fxMid},${fyMid} ${fx0},${fy0}" fill="#93c5fd" fill-opacity="0.3" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6,4"/>`;

  svg += `<line x1="${bx0}" y1="${by0}" x2="${fx0}" y2="${fy0}" stroke="#2563eb" stroke-width="2" stroke-dasharray="6,4"/>`;
  svg += `<line x1="${bx1}" y1="${by1}" x2="${fx1}" y2="${fy1}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${bxMid}" y1="${byMid}" x2="${fxMid}" y2="${fyMid}" stroke="#2563eb" stroke-width="2"/>`;

  const bLabel = unknown === "base" ? "?" : `${base}`;
  const hLabel = unknown === "triHeight" ? "?" : `${triHeight}`;
  const lLabel = unknown === "length" ? "?" : `${length}`;

  svg += `<text x="${(bx0 + bx1) / 2}" y="${by0 + 18}" text-anchor="middle" fill="#16a34a" font-size="14" font-weight="bold">${bLabel}</text>`;
  svg += `<line x1="${bxMid}" y1="${byMid}" x2="${bxMid}" y2="${by0}" stroke="#dc2626" stroke-width="1" stroke-dasharray="4,3"/>`;
  svg += `<text x="${bxMid - 16}" y="${(byMid + by0) / 2}" text-anchor="end" fill="#dc2626" font-size="14" font-weight="bold">${hLabel}</text>`;
  svg += `<text x="${(bx1 + fx1) / 2 + 12}" y="${(by1 + fy1) / 2}" text-anchor="start" fill="#9333ea" font-size="14" font-weight="bold">${lLabel}</text>`;

  svg += `</svg>`;
  return svg;
}

function makePrismNetSvg(faces: { label: string; w: number; h: number }[]): string {
  const W = 420, H = 320;
  const pad = 30;
  const scale = 0.6;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;

  let cx = pad;
  const cy = H / 2;
  const colors = ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb"];

  faces.forEach((f, i) => {
    const fw = f.w * scale;
    const fh = f.h * scale;
    const x = cx;
    const y = cy - fh / 2;
    svg += `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="${colors[i % colors.length]}" stroke="#2563eb" stroke-width="1.5" rx="2"/>`;
    svg += `<text x="${x + fw / 2}" y="${y + fh / 2}" text-anchor="middle" dominant-baseline="middle" fill="#1e3a5f" font-size="11" font-weight="bold">${f.label}</text>`;
    cx += fw + 8;
  });

  svg += `</svg>`;
  return svg;
}

function makeHexPrismSvg(side: number | string, length: number | string): string {
  const W = 420, H = 320;
  const pad = 40;
  const cx1 = W / 3, cy1 = H / 2;
  const r = 50;
  const dx = 100, dy = -30;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;

  const hexPoints = (cx: number, cy: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
    }
    return pts;
  };

  const front = hexPoints(cx1, cy1);
  const back = hexPoints(cx1 + dx, cy1 + dy);

  svg += `<polygon points="${front.map(p => p.join(",")).join(" ")}" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>`;

  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    if (back[i][1] <= cy1 || back[j][1] <= cy1) {
      svg += `<polygon points="${front[i].join(",")},${front[j].join(",")},${back[j].join(",")},${back[i].join(",")}" fill="#93c5fd" fill-opacity="0.5" stroke="#2563eb" stroke-width="1.5"/>`;
    }
  }

  svg += `<polygon points="${back.map(p => p.join(",")).join(" ")}" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4,3"/>`;

  for (let i = 0; i < 6; i++) {
    svg += `<line x1="${front[i][0]}" y1="${front[i][1]}" x2="${back[i][0]}" y2="${back[i][1]}" stroke="#2563eb" stroke-width="1.5" ${back[i][1] > cy1 ? 'stroke-dasharray="4,3"' : ""}/>`;
  }

  svg += `<text x="${cx1}" y="${cy1 + r + 20}" text-anchor="middle" fill="#16a34a" font-size="14" font-weight="bold">side = ${side}</text>`;
  svg += `<text x="${cx1 + dx / 2 + 40}" y="${cy1 + dy / 2 - 10}" text-anchor="start" fill="#9333ea" font-size="14" font-weight="bold">length = ${length}</text>`;

  svg += `</svg>`;
  return svg;
}

function makeTrapPrismSvg(a: number, b: number, trapH: number, length: number): string {
  const W = 420, H = 320;
  const dx = 70, dy = -30;
  const scale = 8;

  const bx0 = 80, by0 = H - 60;
  const bx1 = bx0 + b * scale, by1 = by0;
  const tx0 = bx0 + ((b - a) / 2) * scale, ty0 = by0 - trapH * scale;
  const tx1 = tx0 + a * scale, ty1 = ty0;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;

  svg += `<polygon points="${bx0},${by0} ${bx1},${by1} ${tx1},${ty1} ${tx0},${ty0}" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>`;

  svg += `<polygon points="${bx0 + dx},${by0 + dy} ${bx1 + dx},${by1 + dy} ${tx1 + dx},${ty1 + dy} ${tx0 + dx},${ty0 + dy}" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4,3"/>`;

  svg += `<line x1="${bx0}" y1="${by0}" x2="${bx0 + dx}" y2="${by0 + dy}" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4,3"/>`;
  svg += `<line x1="${bx1}" y1="${by1}" x2="${bx1 + dx}" y2="${by1 + dy}" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<line x1="${tx1}" y1="${ty1}" x2="${tx1 + dx}" y2="${ty1 + dy}" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<line x1="${tx0}" y1="${ty0}" x2="${tx0 + dx}" y2="${ty0 + dy}" stroke="#2563eb" stroke-width="1.5"/>`;

  svg += `<polygon points="${bx1},${by1} ${tx1},${ty1} ${tx1 + dx},${ty1 + dy} ${bx1 + dx},${by1 + dy}" fill="#93c5fd" fill-opacity="0.4" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<polygon points="${tx0},${ty0} ${tx1},${ty1} ${tx1 + dx},${ty1 + dy} ${tx0 + dx},${ty0 + dy}" fill="#60a5fa" fill-opacity="0.3" stroke="#2563eb" stroke-width="1.5"/>`;

  svg += `<text x="${(bx0 + bx1) / 2}" y="${by0 + 18}" text-anchor="middle" fill="#16a34a" font-size="13" font-weight="bold">${b}</text>`;
  svg += `<text x="${(tx0 + tx1) / 2}" y="${ty0 - 8}" text-anchor="middle" fill="#16a34a" font-size="13" font-weight="bold">${a}</text>`;
  svg += `<text x="${bx0 - 14}" y="${(by0 + ty0) / 2}" text-anchor="end" fill="#dc2626" font-size="13" font-weight="bold">${trapH}</text>`;
  svg += `<text x="${bx1 + dx / 2 + 14}" y="${(by1 + by1 + dy) / 2}" text-anchor="start" fill="#9333ea" font-size="13" font-weight="bold">${length}</text>`;

  svg += `</svg>`;
  return svg;
}

type ArchetypeFn = (rng: SeededRandom) => GeneratedQuestion;

function easyCubeSA(rng: SeededRandom): GeneratedQuestion {
  const s = rng.randInt(2, 12);
  const sa = 6 * s * s;
  const params: Record<string, number | string> = { side: s };
  const svg = makeRectPrismSvg(s, s, s);

  return {
    id: makeId("easy", "cube_sa", params),
    topic: "surface_area_of_prisms",
    difficulty: "easy",
    archetype: "cube_sa",
    prompt: `Find the surface area of a cube with side length ${s} cm. Give your answer in cm².`,
    answer: `${sa}`,
    worked_solution: [
      `A cube has 6 identical square faces.`,
      `Area of one face = ${s} × ${s} = ${s * s} cm².`,
      `SA = 6 × ${s * s} = ${sa} cm².`,
    ],
    metadata: {
      params,
      skills: ["cube_surface_area", "area_of_square"],
      estimated_time_sec: 20,
      visual: { type: "svg", svg, alt: `Cube with side length ${s} cm`, width: 420, height: 320 },
    },
  };
}

function easyRectPrismDistinct(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(3, 12);
  const w = rng.randInt(2, 10);
  const h = rng.randInt(2, 8);
  const sa = 2 * (l * w + l * h + w * h);
  const params: Record<string, number | string> = { l, w, h };
  const svg = makeRectPrismSvg(l, w, h);

  return {
    id: makeId("easy", "rect_prism_distinct", params),
    topic: "surface_area_of_prisms",
    difficulty: "easy",
    archetype: "rect_prism_distinct",
    prompt: `Find the surface area of a rectangular prism with length ${l} cm, width ${w} cm, and height ${h} cm.`,
    answer: `${sa}`,
    worked_solution: [
      `SA = 2(lw + lh + wh).`,
      `SA = 2(${l}×${w} + ${l}×${h} + ${w}×${h}).`,
      `SA = 2(${l * w} + ${l * h} + ${w * h}) = 2 × ${l * w + l * h + w * h} = ${sa} cm².`,
    ],
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "substitution"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Rectangular prism ${l}×${w}×${h} cm`, width: 420, height: 320 },
    },
  };
}

function easyCountFaces(rng: SeededRandom): GeneratedQuestion {
  const shapes: { name: string; sides: number; faces: number }[] = [
    { name: "triangular", sides: 3, faces: 5 },
    { name: "rectangular", sides: 4, faces: 6 },
    { name: "pentagonal", sides: 5, faces: 7 },
    { name: "hexagonal", sides: 6, faces: 8 },
  ];
  const shape = rng.pick(shapes);
  const params: Record<string, number | string> = { shape: shape.name };
  const svg = makeRectPrismSvg(6, 4, 5);

  return {
    id: makeId("easy", "count_faces", params),
    topic: "surface_area_of_prisms",
    difficulty: "easy",
    archetype: "count_faces",
    prompt: `How many faces does a ${shape.name} prism have?`,
    answer: `${shape.faces}`,
    worked_solution: [
      `A ${shape.name} prism has a ${shape.name} cross-section with ${shape.sides} sides.`,
      `It has 2 end faces (the cross-sections) + ${shape.sides} rectangular side faces.`,
      `Total faces = 2 + ${shape.sides} = ${shape.faces}.`,
    ],
    metadata: {
      params,
      skills: ["prism_properties", "counting_faces"],
      estimated_time_sec: 15,
      visual: { type: "svg", svg, alt: `A ${shape.name} prism`, width: 420, height: 320 },
    },
  };
}

function easySAFromNet(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(4, 10);
  const w = rng.randInt(3, 8);
  const h = rng.randInt(2, 6);
  const top = l * w, front = l * h, side = w * h;
  const sa = 2 * (top + front + side);

  const faces = [
    { label: `${l}×${w}`, w: l * 10, h: w * 10 },
    { label: `${l}×${h}`, w: l * 10, h: h * 10 },
    { label: `${w}×${h}`, w: w * 10, h: h * 10 },
    { label: `${l}×${w}`, w: l * 10, h: w * 10 },
    { label: `${l}×${h}`, w: l * 10, h: h * 10 },
    { label: `${w}×${h}`, w: w * 10, h: h * 10 },
  ];
  const params: Record<string, number | string> = { l, w, h };
  const svg = makePrismNetSvg(faces);

  return {
    id: makeId("easy", "sa_from_net", params),
    topic: "surface_area_of_prisms",
    difficulty: "easy",
    archetype: "sa_from_net",
    prompt: `A rectangular prism net shows 6 faces. The dimensions are: length ${l} cm, width ${w} cm, height ${h} cm. Find the total surface area.`,
    answer: `${sa}`,
    worked_solution: [
      `Top and bottom: 2 × (${l} × ${w}) = 2 × ${top} = ${2 * top} cm².`,
      `Front and back: 2 × (${l} × ${h}) = 2 × ${front} = ${2 * front} cm².`,
      `Left and right: 2 × (${w} × ${h}) = 2 × ${side} = ${2 * side} cm².`,
      `Total SA = ${2 * top} + ${2 * front} + ${2 * side} = ${sa} cm².`,
    ],
    metadata: {
      params,
      skills: ["nets_of_prisms", "area_calculation"],
      estimated_time_sec: 35,
      visual: { type: "svg", svg, alt: `Net of rectangular prism ${l}×${w}×${h}`, width: 420, height: 320 },
    },
  };
}

function easyCubeGivenSide(rng: SeededRandom): GeneratedQuestion {
  const s = rng.randInt(3, 15);
  const sa = 6 * s * s;
  const params: Record<string, number | string> = { side: s };
  const svg = makeRectPrismSvg(s, s, s);

  return {
    id: makeId("easy", "cube_given_side", params),
    topic: "surface_area_of_prisms",
    difficulty: "easy",
    archetype: "cube_given_side",
    prompt: `A cube has a side length of ${s} m. What is its total surface area in m²?`,
    answer: `${sa}`,
    worked_solution: [
      `SA of a cube = 6s².`,
      `SA = 6 × ${s}² = 6 × ${s * s} = ${sa} m².`,
    ],
    metadata: {
      params,
      skills: ["cube_surface_area"],
      estimated_time_sec: 15,
      visual: { type: "svg", svg, alt: `Cube with side ${s} m`, width: 420, height: 320 },
    },
  };
}

function easyRectPrismTwoSquareFaces(rng: SeededRandom): GeneratedQuestion {
  const s = rng.randInt(3, 10);
  const l = rng.randInt(s + 1, s + 10);
  const sa = 2 * s * s + 4 * s * l;
  const params: Record<string, number | string> = { s, l };
  const svg = makeRectPrismSvg(l, s, s);

  return {
    id: makeId("easy", "rect_two_square", params),
    topic: "surface_area_of_prisms",
    difficulty: "easy",
    archetype: "rect_two_square",
    prompt: `A rectangular prism has a square cross-section with side ${s} cm and length ${l} cm. Find the total surface area.`,
    answer: `${sa}`,
    worked_solution: [
      `Two square end faces: 2 × ${s}² = 2 × ${s * s} = ${2 * s * s} cm².`,
      `Four rectangular faces: 4 × ${s} × ${l} = ${4 * s * l} cm².`,
      `SA = ${2 * s * s} + ${4 * s * l} = ${sa} cm².`,
    ],
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "square_cross_section"],
      estimated_time_sec: 30,
      visual: { type: "svg", svg, alt: `Rectangular prism with square cross-section side=${s}, length=${l}`, width: 420, height: 320 },
    },
  };
}

function easyOneFaceArea(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(4, 12);
  const w = rng.randInt(3, 10);
  const h = rng.randInt(2, 8);
  const face = rng.pick(["top", "front", "side"]);
  let area: number, dims: string;
  if (face === "top") { area = l * w; dims = `${l} × ${w}`; }
  else if (face === "front") { area = l * h; dims = `${l} × ${h}`; }
  else { area = w * h; dims = `${w} × ${h}`; }

  const params: Record<string, number | string> = { l, w, h, face };
  const svg = makeRectPrismSvg(l, w, h);

  return {
    id: makeId("easy", "one_face_area", params),
    topic: "surface_area_of_prisms",
    difficulty: "easy",
    archetype: "one_face_area",
    prompt: `A rectangular prism has length ${l} cm, width ${w} cm, height ${h} cm. Find the area of the ${face} face.`,
    answer: `${area}`,
    worked_solution: [
      `The ${face} face has dimensions ${dims}.`,
      `Area = ${dims} = ${area} cm².`,
    ],
    metadata: {
      params,
      skills: ["area_of_rectangle", "identify_face"],
      estimated_time_sec: 15,
      visual: { type: "svg", svg, alt: `Rectangular prism ${l}×${w}×${h}, find ${face} face area`, width: 420, height: 320 },
    },
  };
}

function easyTotalFromFaceAreas(rng: SeededRandom): GeneratedQuestion {
  const a1 = rng.randInt(6, 30);
  const a2 = rng.randInt(6, 30);
  const a3 = rng.randInt(6, 30);
  const sa = 2 * (a1 + a2 + a3);
  const params: Record<string, number | string> = { a1, a2, a3 };
  const svg = makeRectPrismSvg("l", "w", "h");

  return {
    id: makeId("easy", "total_from_face_areas", params),
    topic: "surface_area_of_prisms",
    difficulty: "easy",
    archetype: "total_from_face_areas",
    prompt: `A rectangular prism has three different face areas: ${a1} cm², ${a2} cm², and ${a3} cm². Find the total surface area.`,
    answer: `${sa}`,
    worked_solution: [
      `Each face area appears twice (opposite faces are identical).`,
      `SA = 2 × (${a1} + ${a2} + ${a3}) = 2 × ${a1 + a2 + a3} = ${sa} cm².`,
    ],
    metadata: {
      params,
      skills: ["surface_area_from_faces", "addition"],
      estimated_time_sec: 20,
      visual: { type: "svg", svg, alt: `Rectangular prism with face areas ${a1}, ${a2}, ${a3}`, width: 420, height: 320 },
    },
  };
}

function mediumTriPrismRight(rng: SeededRandom): GeneratedQuestion {
  const a = rng.randInt(3, 10);
  const b = rng.randInt(3, 10);
  const hyp = roundTo(Math.sqrt(a * a + b * b), 2);
  const length = rng.randInt(5, 15);
  const triArea = 0.5 * a * b;
  const perim = a + b + hyp;
  const sa = roundTo(2 * triArea + perim * length, 2);

  const params: Record<string, number | string> = { a, b, length };
  const svg = makeTriPrismSvg(a, b, length);

  return {
    id: makeId("medium", "tri_prism_right", params),
    topic: "surface_area_of_prisms",
    difficulty: "medium",
    archetype: "tri_prism_right",
    prompt: `A triangular prism has a right-triangle cross-section with legs ${a} cm and ${b} cm. The prism is ${length} cm long. Find the total surface area. Round to 2 decimal places.`,
    answer: formatAnswer(sa),
    worked_solution: [
      `Hypotenuse = √(${a}² + ${b}²) = √${a * a + b * b} = ${formatAnswer(hyp)}.`,
      `Triangle area = ½ × ${a} × ${b} = ${triArea} cm².`,
      `Two triangular ends = 2 × ${triArea} = ${2 * triArea} cm².`,
      `Perimeter of triangle = ${a} + ${b} + ${formatAnswer(hyp)} = ${formatAnswer(perim)}.`,
      `Three rectangular faces = ${formatAnswer(perim)} × ${length} = ${formatAnswer(perim * length)} cm².`,
      `SA = ${2 * triArea} + ${formatAnswer(perim * length)} = ${formatAnswer(sa)} cm².`,
    ],
    metadata: {
      params,
      skills: ["triangular_prism_sa", "pythagoras", "triangle_area"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Triangular prism with right-triangle base legs ${a}, ${b}, length ${length}`, width: 420, height: 320 },
    },
  };
}

function mediumWordProblem(rng: SeededRandom): GeneratedQuestion {
  const scenarios = [
    { context: "paint a room (4 walls and ceiling, not the floor)", openFaces: 1 },
    { context: "wrap a gift box with no overlap", openFaces: 0 },
  ];
  const sc = rng.pick(scenarios);
  const l = rng.randInt(3, 8);
  const w = rng.randInt(2, 6);
  const h = rng.randInt(2, 5);
  let sa: number;
  let steps: string[];

  if (sc.openFaces === 1) {
    sa = 2 * l * h + 2 * w * h + l * w;
    steps = [
      `Two long walls: 2 × ${l} × ${h} = ${2 * l * h} m².`,
      `Two short walls: 2 × ${w} × ${h} = ${2 * w * h} m².`,
      `Ceiling: ${l} × ${w} = ${l * w} m².`,
      `Total = ${2 * l * h} + ${2 * w * h} + ${l * w} = ${sa} m².`,
    ];
  } else {
    sa = 2 * (l * w + l * h + w * h);
    steps = [
      `SA = 2(lw + lh + wh) = 2(${l * w} + ${l * h} + ${w * h}) = ${sa} cm².`,
    ];
  }

  const params: Record<string, number | string> = { l, w, h, context: sc.context };
  const svg = makeRectPrismSvg(l, w, h);
  const unit = sc.openFaces === 1 ? "m" : "cm";

  return {
    id: makeId("medium", "word_problem", params),
    topic: "surface_area_of_prisms",
    difficulty: "medium",
    archetype: "word_problem",
    prompt: `You need to ${sc.context}. The dimensions are: length ${l} ${unit}, width ${w} ${unit}, height ${h} ${unit}. Find the total area to cover in ${unit}².`,
    answer: `${sa}`,
    worked_solution: steps,
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "word_problem", "real_world_application"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Rectangular prism ${l}×${w}×${h} ${unit}`, width: 420, height: 320 },
    },
  };
}

function mediumMissingDimension(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(4, 10);
  const w = rng.randInt(3, 8);
  const h = rng.randInt(2, 6);
  const sa = 2 * (l * w + l * h + w * h);
  const missingDim = rng.pick(["l", "w", "h"]);
  let answer: number, prompt: string;

  if (missingDim === "l") {
    answer = l;
    prompt = `A rectangular prism has width ${w} cm, height ${h} cm, and total surface area ${sa} cm². Find the length.`;
  } else if (missingDim === "w") {
    answer = w;
    prompt = `A rectangular prism has length ${l} cm, height ${h} cm, and total surface area ${sa} cm². Find the width.`;
  } else {
    answer = h;
    prompt = `A rectangular prism has length ${l} cm, width ${w} cm, and total surface area ${sa} cm². Find the height.`;
  }

  const params: Record<string, number | string> = { l, w, h, missing: missingDim };
  const svg = makeRectPrismSvg(
    missingDim === "l" ? "?" : l,
    missingDim === "w" ? "?" : w,
    missingDim === "h" ? "?" : h,
    missingDim
  );

  return {
    id: makeId("medium", "missing_dimension", params),
    topic: "surface_area_of_prisms",
    difficulty: "medium",
    archetype: "missing_dimension",
    prompt,
    answer: `${answer}`,
    worked_solution: [
      `SA = 2(lw + lh + wh) = ${sa}.`,
      `Substituting known values and solving for the unknown dimension.`,
      `The missing dimension = ${answer} cm.`,
    ],
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "solve_equation"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Rectangular prism with one unknown dimension`, width: 420, height: 320 },
    },
  };
}

function mediumTriPrismIsosceles(rng: SeededRandom): GeneratedQuestion {
  const base = rng.randInt(4, 12);
  const slant = rng.randInt(base, base + 8);
  const triHeight = roundTo(Math.sqrt(slant * slant - (base / 2) * (base / 2)), 2);
  const length = rng.randInt(5, 15);
  const triArea = roundTo(0.5 * base * triHeight, 2);
  const perim = base + 2 * slant;
  const sa = roundTo(2 * triArea + perim * length, 2);

  const params: Record<string, number | string> = { base, slant, length };
  const svg = makeTriPrismSvg(base, triHeight, length);

  return {
    id: makeId("medium", "tri_prism_isosceles", params),
    topic: "surface_area_of_prisms",
    difficulty: "medium",
    archetype: "tri_prism_isosceles",
    prompt: `A triangular prism has an isosceles triangle cross-section with base ${base} cm and equal sides ${slant} cm. The prism length is ${length} cm. Find the total SA. Round to 2 dp.`,
    answer: formatAnswer(sa),
    worked_solution: [
      `Triangle height = √(${slant}² - (${base}/2)²) = √(${slant * slant} - ${(base / 2) * (base / 2)}) = ${formatAnswer(triHeight)} cm.`,
      `Triangle area = ½ × ${base} × ${formatAnswer(triHeight)} = ${formatAnswer(triArea)} cm².`,
      `Perimeter = ${base} + 2 × ${slant} = ${perim} cm.`,
      `SA = 2 × ${formatAnswer(triArea)} + ${perim} × ${length} = ${formatAnswer(2 * triArea)} + ${perim * length} = ${formatAnswer(sa)} cm².`,
    ],
    metadata: {
      params,
      skills: ["triangular_prism_sa", "isosceles_triangle", "pythagoras"],
      estimated_time_sec: 70,
      visual: { type: "svg", svg, alt: `Triangular prism with isosceles cross-section base=${base}, slant=${slant}, length=${length}`, width: 420, height: 320 },
    },
  };
}

function mediumComparePrisms(rng: SeededRandom): GeneratedQuestion {
  const s1 = rng.randInt(3, 8);
  const l1 = rng.randInt(4, 10), w1 = rng.randInt(3, 8), h1 = rng.randInt(2, 6);
  const l2 = rng.randInt(4, 10), w2 = rng.randInt(3, 8), h2 = rng.randInt(2, 6);
  const sa1 = 2 * (l1 * w1 + l1 * h1 + w1 * h1);
  const sa2 = 2 * (l2 * w2 + l2 * h2 + w2 * h2);
  const larger = sa1 >= sa2 ? "A" : "B";
  const diff = Math.abs(sa1 - sa2);

  const params: Record<string, number | string> = { l1, w1, h1, l2, w2, h2 };
  const svg = makeRectPrismSvg(l1, w1, h1);

  return {
    id: makeId("medium", "compare_prisms", params),
    topic: "surface_area_of_prisms",
    difficulty: "medium",
    archetype: "compare_prisms",
    prompt: `Prism A is ${l1}×${w1}×${h1} cm. Prism B is ${l2}×${w2}×${h2} cm. What is the difference in their surface areas (in cm²)?`,
    answer: `${diff}`,
    worked_solution: [
      `SA_A = 2(${l1}×${w1} + ${l1}×${h1} + ${w1}×${h1}) = ${sa1} cm².`,
      `SA_B = 2(${l2}×${w2} + ${l2}×${h2} + ${w2}×${h2}) = ${sa2} cm².`,
      `Difference = |${sa1} - ${sa2}| = ${diff} cm².`,
    ],
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "comparison"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Compare two rectangular prisms`, width: 420, height: 320 },
    },
  };
}

function mediumDecimalDimensions(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(20, 80) / 10;
  const w = rng.randInt(15, 60) / 10;
  const h = rng.randInt(10, 40) / 10;
  const sa = roundTo(2 * (l * w + l * h + w * h), 2);

  const params: Record<string, number | string> = { l, w, h };
  const svg = makeRectPrismSvg(l, w, h);

  return {
    id: makeId("medium", "decimal_dimensions", params),
    topic: "surface_area_of_prisms",
    difficulty: "medium",
    archetype: "decimal_dimensions",
    prompt: `Find the surface area of a rectangular prism with length ${l} cm, width ${w} cm, and height ${h} cm. Round to 2 dp.`,
    answer: formatAnswer(sa),
    worked_solution: [
      `SA = 2(lw + lh + wh).`,
      `SA = 2(${l}×${w} + ${l}×${h} + ${w}×${h}).`,
      `SA = 2(${roundTo(l * w, 2)} + ${roundTo(l * h, 2)} + ${roundTo(w * h, 2)}) = ${formatAnswer(sa)} cm².`,
    ],
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "decimal_arithmetic"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Rectangular prism ${l}×${w}×${h} with decimal dimensions`, width: 420, height: 320 },
    },
  };
}

function mediumOpenTopBox(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(4, 12);
  const w = rng.randInt(3, 10);
  const h = rng.randInt(2, 8);
  const sa = l * w + 2 * l * h + 2 * w * h;

  const params: Record<string, number | string> = { l, w, h };
  const svg = makeRectPrismSvg(l, w, h);

  return {
    id: makeId("medium", "open_top_box", params),
    topic: "surface_area_of_prisms",
    difficulty: "medium",
    archetype: "open_top_box",
    prompt: `An open-top rectangular box has length ${l} cm, width ${w} cm, and height ${h} cm. Find the total outer surface area.`,
    answer: `${sa}`,
    worked_solution: [
      `An open-top box has 5 faces: 1 base + 4 sides.`,
      `Base = ${l} × ${w} = ${l * w} cm².`,
      `Two long sides = 2 × ${l} × ${h} = ${2 * l * h} cm².`,
      `Two short sides = 2 × ${w} × ${h} = ${2 * w * h} cm².`,
      `SA = ${l * w} + ${2 * l * h} + ${2 * w * h} = ${sa} cm².`,
    ],
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "open_top"],
      estimated_time_sec: 40,
      visual: { type: "svg", svg, alt: `Open-top box ${l}×${w}×${h}`, width: 420, height: 320 },
    },
  };
}

function mediumTrapezoidalPrism(rng: SeededRandom): GeneratedQuestion {
  const a = rng.randInt(3, 8);
  const b = rng.randInt(a + 2, a + 8);
  const trapH = rng.randInt(3, 7);
  const length = rng.randInt(5, 12);
  const side1 = roundTo(Math.sqrt(trapH * trapH + ((b - a) / 2) * ((b - a) / 2)), 2);
  const trapArea = roundTo(0.5 * (a + b) * trapH, 2);
  const perim = roundTo(a + b + 2 * side1, 2);
  const sa = roundTo(2 * trapArea + perim * length, 2);

  const params: Record<string, number | string> = { a, b, trapH, length };
  const svg = makeTrapPrismSvg(a, b, trapH, length);

  return {
    id: makeId("medium", "trapezoidal_prism", params),
    topic: "surface_area_of_prisms",
    difficulty: "medium",
    archetype: "trapezoidal_prism",
    prompt: `A trapezoidal prism has parallel sides ${a} cm and ${b} cm, height ${trapH} cm, and length ${length} cm. The trapezoid is isosceles. Find the total SA. Round to 2 dp.`,
    answer: formatAnswer(sa),
    worked_solution: [
      `Trapezoid area = ½(${a} + ${b}) × ${trapH} = ${formatAnswer(trapArea)} cm².`,
      `Slant side = √(${trapH}² + ((${b}-${a})/2)²) = ${formatAnswer(side1)} cm.`,
      `Perimeter = ${a} + ${b} + 2 × ${formatAnswer(side1)} = ${formatAnswer(perim)} cm.`,
      `SA = 2 × ${formatAnswer(trapArea)} + ${formatAnswer(perim)} × ${length} = ${formatAnswer(sa)} cm².`,
    ],
    metadata: {
      params,
      skills: ["trapezoidal_prism_sa", "trapezoid_area", "pythagoras"],
      estimated_time_sec: 70,
      visual: { type: "svg", svg, alt: `Trapezoidal prism with parallel sides ${a}, ${b}, height ${trapH}, length ${length}`, width: 420, height: 320 },
    },
  };
}

function hardTriPrismPythagSlant(rng: SeededRandom): GeneratedQuestion {
  const base = rng.randInt(6, 14);
  const triHeight = rng.randInt(4, 10);
  const length = rng.randInt(8, 18);
  const slant = roundTo(Math.sqrt(triHeight * triHeight + (base / 2) * (base / 2)), 2);
  const triArea = 0.5 * base * triHeight;
  const perim = roundTo(base + 2 * slant, 2);
  const sa = roundTo(2 * triArea + perim * length, 2);

  const params: Record<string, number | string> = { base, triHeight, length };
  const svg = makeTriPrismSvg(base, triHeight, length);

  return {
    id: makeId("hard", "tri_prism_pythag_slant", params),
    topic: "surface_area_of_prisms",
    difficulty: "hard",
    archetype: "tri_prism_pythag_slant",
    prompt: `A triangular prism has an isosceles triangle cross-section with base ${base} cm and height ${triHeight} cm. The prism is ${length} cm long. First find the slant height using Pythagoras, then calculate the total SA. Round to 2 dp.`,
    answer: formatAnswer(sa),
    worked_solution: [
      `Half base = ${base / 2} cm.`,
      `Slant height = √(${triHeight}² + ${base / 2}²) = √(${triHeight * triHeight} + ${(base / 2) * (base / 2)}) = ${formatAnswer(slant)} cm.`,
      `Triangle area = ½ × ${base} × ${triHeight} = ${triArea} cm².`,
      `Perimeter = ${base} + 2 × ${formatAnswer(slant)} = ${formatAnswer(perim)} cm.`,
      `SA = 2 × ${triArea} + ${formatAnswer(perim)} × ${length} = ${formatAnswer(sa)} cm².`,
    ],
    metadata: {
      params,
      skills: ["triangular_prism_sa", "pythagoras", "slant_height"],
      estimated_time_sec: 75,
      visual: { type: "svg", svg, alt: `Triangular prism requiring Pythagoras for slant height`, width: 420, height: 320 },
    },
  };
}

function hardFindDimFromSA(rng: SeededRandom): GeneratedQuestion {
  const w = rng.randInt(3, 8);
  const h = rng.randInt(2, 6);
  const l = rng.randInt(4, 10);
  const sa = 2 * (l * w + l * h + w * h);

  const params: Record<string, number | string> = { w, h, sa, answer: l };
  const svg = makeRectPrismSvg("?", w, h, "l");

  return {
    id: makeId("hard", "find_dim_from_sa", params),
    topic: "surface_area_of_prisms",
    difficulty: "hard",
    archetype: "find_dim_from_sa",
    prompt: `A rectangular prism has width ${w} cm, height ${h} cm, and total surface area ${sa} cm². Find the length.`,
    answer: `${l}`,
    worked_solution: [
      `SA = 2(lw + lh + wh).`,
      `${sa} = 2(${w}l + ${h}l + ${w * h}).`,
      `${sa} = 2l(${w} + ${h}) + 2 × ${w * h}.`,
      `${sa} = ${2 * (w + h)}l + ${2 * w * h}.`,
      `${2 * (w + h)}l = ${sa} - ${2 * w * h} = ${sa - 2 * w * h}.`,
      `l = ${sa - 2 * w * h} / ${2 * (w + h)} = ${l} cm.`,
    ],
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "solve_linear_equation"],
      estimated_time_sec: 70,
      visual: { type: "svg", svg, alt: `Rectangular prism with unknown length, SA=${sa}`, width: 420, height: 320 },
    },
  };
}

function hardHexPrism(rng: SeededRandom): GeneratedQuestion {
  const side = rng.randInt(3, 8);
  const length = rng.randInt(6, 15);
  const hexArea = roundTo(3 * Math.sqrt(3) / 2 * side * side, 2);
  const perim = 6 * side;
  const sa = roundTo(2 * hexArea + perim * length, 2);

  const params: Record<string, number | string> = { side, length };
  const svg = makeHexPrismSvg(side, length);

  return {
    id: makeId("hard", "hex_prism", params),
    topic: "surface_area_of_prisms",
    difficulty: "hard",
    archetype: "hex_prism",
    prompt: `A regular hexagonal prism has side length ${side} cm and length ${length} cm. Find the total surface area. Use the formula: area of regular hexagon = (3√3/2)s². Round to 2 dp.`,
    answer: formatAnswer(sa),
    worked_solution: [
      `Hexagon area = (3√3/2) × ${side}² = (3√3/2) × ${side * side} = ${formatAnswer(hexArea)} cm².`,
      `Two hexagonal ends = 2 × ${formatAnswer(hexArea)} = ${formatAnswer(2 * hexArea)} cm².`,
      `Perimeter = 6 × ${side} = ${perim} cm.`,
      `Six rectangular faces = ${perim} × ${length} = ${perim * length} cm².`,
      `SA = ${formatAnswer(2 * hexArea)} + ${perim * length} = ${formatAnswer(sa)} cm².`,
    ],
    metadata: {
      params,
      skills: ["hexagonal_prism_sa", "regular_polygon_area"],
      estimated_time_sec: 80,
      visual: { type: "svg", svg, alt: `Regular hexagonal prism side=${side}, length=${length}`, width: 420, height: 320 },
    },
  };
}

function hardCompositeL(rng: SeededRandom): GeneratedQuestion {
  const a = rng.randInt(3, 6);
  const b = rng.randInt(3, 6);
  const c = rng.randInt(2, 4);
  const d = rng.randInt(2, 4);
  const depth = rng.randInt(4, 10);
  const lArea = a * (b + d) + c * d - 0;
  const lAreaActual = a * b + (a + c) * d;
  const perimOuter = 2 * (a + b) + 2 * (c + d);
  const crossArea = a * b + c * d;
  const perim = 2 * a + b + d + c + (b + d - b) + (a + c - a) + 0;
  const actualPerim = a + b + (a + c - a) + (b + d - b) + c + d;
  const correctedPerim = a + b + c + d + c + d;

  const fullPerim = 2 * (a + c) + 2 * (b + d) - 2 * 0;
  const lPerim = a + b + c + (b + d) + (a + c) + d;

  const w1 = a, h1 = b, w2 = c, h2 = d;
  const crossSectionArea = w1 * h1 + w2 * h2;
  const outerPerimeter = w1 + h1 + w2 + h2 + (w1 + w2) - w1 + (h1 + h2) - h1;
  const lShapePerim = 2 * (w1 + w2) + 2 * (h1 + h2) - 2 * Math.min(w1, w2);
  const corrPerim = w1 + h1 + w2 + (h1 + h2 - h1) + (w1 + w2 - w1) + h2;
  const realPerim = w1 + (h1 + h2) + w2 + h2 + (w1 + w2 - w1) + h1;
  const simplePerim = 2 * (w1 + w2) + 2 * (h1 + h2);

  const sa = 2 * crossSectionArea + simplePerim * depth;

  const params: Record<string, number | string> = { w1, h1, w2, h2, depth };
  const svg = makeRectPrismSvg(`${w1}+${w2}`, `${h1}+${h2}`, depth);

  return {
    id: makeId("hard", "composite_l", params),
    topic: "surface_area_of_prisms",
    difficulty: "hard",
    archetype: "composite_l",
    prompt: `An L-shaped prism is made from two rectangular prisms joined together. The first block is ${w1}×${h1}×${depth} cm and the second is ${w2}×${h2}×${depth} cm (same depth). They share no overlapping face on the outside. Find the total outer surface area.`,
    answer: `${sa}`,
    worked_solution: [
      `Cross-section area = ${w1}×${h1} + ${w2}×${h2} = ${w1 * h1} + ${w2 * h2} = ${crossSectionArea} cm².`,
      `Two L-shaped end faces = 2 × ${crossSectionArea} = ${2 * crossSectionArea} cm².`,
      `Outer perimeter of L-shape = 2(${w1}+${w2}) + 2(${h1}+${h2}) = ${simplePerim} cm.`,
      `Rectangular side faces = ${simplePerim} × ${depth} = ${simplePerim * depth} cm².`,
      `SA = ${2 * crossSectionArea} + ${simplePerim * depth} = ${sa} cm².`,
    ],
    metadata: {
      params,
      skills: ["composite_prism_sa", "l_shape", "perimeter"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `L-shaped composite prism`, width: 420, height: 320 },
    },
  };
}

function hardUnitConversion(rng: SeededRandom): GeneratedQuestion {
  const l_cm = rng.randInt(100, 300);
  const w_cm = rng.randInt(50, 200);
  const h_cm = rng.randInt(30, 100);
  const l_m = l_cm / 100;
  const w_m = w_cm / 100;
  const h_m = h_cm / 100;
  const sa_m = roundTo(2 * (l_m * w_m + l_m * h_m + w_m * h_m), 2);

  const params: Record<string, number | string> = { l_cm, w_cm, h_cm };
  const svg = makeRectPrismSvg(`${l_cm} cm`, `${w_cm} cm`, `${h_cm} cm`);

  return {
    id: makeId("hard", "unit_conversion", params),
    topic: "surface_area_of_prisms",
    difficulty: "hard",
    archetype: "unit_conversion",
    prompt: `A rectangular prism has dimensions ${l_cm} cm × ${w_cm} cm × ${h_cm} cm. Find the surface area in m². Round to 2 dp.`,
    answer: formatAnswer(sa_m),
    worked_solution: [
      `Convert to metres: ${l_m} m × ${w_m} m × ${h_m} m.`,
      `SA = 2(${l_m}×${w_m} + ${l_m}×${h_m} + ${w_m}×${h_m}).`,
      `SA = 2(${roundTo(l_m * w_m, 4)} + ${roundTo(l_m * h_m, 4)} + ${roundTo(w_m * h_m, 4)}) = ${formatAnswer(sa_m)} m².`,
    ],
    metadata: {
      params,
      skills: ["unit_conversion", "rectangular_prism_sa"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Rectangular prism with cm dimensions, answer in m²`, width: 420, height: 320 },
    },
  };
}

function hardEquilateralTriPrism(rng: SeededRandom): GeneratedQuestion {
  const side = rng.randInt(4, 12);
  const length = rng.randInt(6, 16);
  const triArea = roundTo((Math.sqrt(3) / 4) * side * side, 2);
  const perim = 3 * side;
  const sa = roundTo(2 * triArea + perim * length, 2);

  const params: Record<string, number | string> = { side, length };
  const svg = makeTriPrismSvg(side, roundTo(Math.sqrt(3) / 2 * side, 2), length);

  return {
    id: makeId("hard", "equilateral_tri_prism", params),
    topic: "surface_area_of_prisms",
    difficulty: "hard",
    archetype: "equilateral_tri_prism",
    prompt: `A triangular prism has an equilateral triangle cross-section with side ${side} cm. The prism is ${length} cm long. Find the total SA using √3. Round to 2 dp.`,
    answer: formatAnswer(sa),
    worked_solution: [
      `Equilateral triangle area = (√3/4) × ${side}² = (√3/4) × ${side * side} = ${formatAnswer(triArea)} cm².`,
      `Two triangular ends = 2 × ${formatAnswer(triArea)} = ${formatAnswer(2 * triArea)} cm².`,
      `Perimeter = 3 × ${side} = ${perim} cm.`,
      `Three rectangular faces = ${perim} × ${length} = ${perim * length} cm².`,
      `SA = ${formatAnswer(2 * triArea)} + ${perim * length} = ${formatAnswer(sa)} cm².`,
    ],
    metadata: {
      params,
      skills: ["equilateral_triangle_area", "triangular_prism_sa", "surds"],
      estimated_time_sec: 70,
      visual: { type: "svg", svg, alt: `Triangular prism with equilateral cross-section side=${side}, length=${length}`, width: 420, height: 320 },
    },
  };
}

function hardOpenEndedPrism(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(5, 12);
  const w = rng.randInt(3, 8);
  const h = rng.randInt(3, 7);
  const fullSA = 2 * (l * w + l * h + w * h);
  const removedFace = rng.pick(["top", "front", "side"]);
  let removedArea: number;
  if (removedFace === "top") removedArea = l * w;
  else if (removedFace === "front") removedArea = l * h;
  else removedArea = w * h;
  const sa = fullSA - removedArea;

  const params: Record<string, number | string> = { l, w, h, removed: removedFace };
  const svg = makeRectPrismSvg(l, w, h);

  return {
    id: makeId("hard", "open_ended_prism", params),
    topic: "surface_area_of_prisms",
    difficulty: "hard",
    archetype: "open_ended_prism",
    prompt: `A rectangular prism (${l}×${w}×${h} cm) has its ${removedFace} face removed. Find the remaining surface area.`,
    answer: `${sa}`,
    worked_solution: [
      `Full SA = 2(${l}×${w} + ${l}×${h} + ${w}×${h}) = ${fullSA} cm².`,
      `Removed ${removedFace} face area = ${removedArea} cm².`,
      `Remaining SA = ${fullSA} - ${removedArea} = ${sa} cm².`,
    ],
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "subtract_face"],
      estimated_time_sec: 45,
      visual: { type: "svg", svg, alt: `Rectangular prism with ${removedFace} face removed`, width: 420, height: 320 },
    },
  };
}

function challengeMinSAForVolume(rng: SeededRandom): GeneratedQuestion {
  const V = rng.pick([27, 64, 125, 216, 1000]);
  const side = roundTo(Math.pow(V, 1 / 3), 2);
  const sa = roundTo(6 * side * side, 2);

  const params: Record<string, number | string> = { V };
  const svg = makeRectPrismSvg("?", "?", "?");

  return {
    id: makeId("challenge", "min_sa_volume", params),
    topic: "surface_area_of_prisms",
    difficulty: "challenge",
    archetype: "min_sa_volume",
    prompt: `A rectangular prism has a volume of ${V} cm³. What is the minimum possible surface area? (Hint: the optimal shape is a cube.) Round to 2 dp.`,
    answer: formatAnswer(sa),
    worked_solution: [
      `For a given volume, the shape with minimum SA is a cube.`,
      `Side = ∛${V} = ${formatAnswer(side)} cm.`,
      `Minimum SA = 6 × ${formatAnswer(side)}² = 6 × ${formatAnswer(side * side)} = ${formatAnswer(sa)} cm².`,
    ],
    metadata: {
      params,
      skills: ["optimisation", "cube_root", "cube_surface_area"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Optimal cube for volume ${V}`, width: 420, height: 320 },
    },
  };
}

function challengeCompositeSA(rng: SeededRandom): GeneratedQuestion {
  const l1 = rng.randInt(4, 8), w1 = rng.randInt(3, 6), h1 = rng.randInt(3, 6);
  const l2 = rng.randInt(2, 4), w2 = w1, h2 = rng.randInt(2, 4);
  const sa1 = 2 * (l1 * w1 + l1 * h1 + w1 * h1);
  const sa2 = 2 * (l2 * w2 + l2 * h2 + w2 * h2);
  const overlap = l2 * w2;
  const sa = sa1 + sa2 - 2 * overlap;

  const params: Record<string, number | string> = { l1, w1, h1, l2, w2, h2 };
  const svg = makeRectPrismSvg(l1, w1, h1);

  return {
    id: makeId("challenge", "composite_sa", params),
    topic: "surface_area_of_prisms",
    difficulty: "challenge",
    archetype: "composite_sa",
    prompt: `A smaller prism (${l2}×${w2}×${h2} cm) sits on top of a larger prism (${l1}×${w1}×${h1} cm). They share a ${l2}×${w2} cm face. Find the total outer surface area.`,
    answer: `${sa}`,
    worked_solution: [
      `SA of large prism = ${sa1} cm².`,
      `SA of small prism = ${sa2} cm².`,
      `Shared face = ${l2} × ${w2} = ${overlap} cm² (hidden on both prisms).`,
      `Total SA = ${sa1} + ${sa2} - 2 × ${overlap} = ${sa} cm².`,
    ],
    metadata: {
      params,
      skills: ["composite_surface_area", "subtract_shared_faces"],
      estimated_time_sec: 80,
      visual: { type: "svg", svg, alt: `Composite shape: small prism on large prism`, width: 420, height: 320 },
    },
  };
}

function challengeRatioOfSides(rng: SeededRandom): GeneratedQuestion {
  const r1 = rng.randInt(1, 3);
  const r2 = rng.randInt(1, 3);
  const r3 = rng.randInt(1, 3);
  const sa = rng.pick([150, 200, 250, 300, 400, 500]);

  const sumTerms = r1 * r2 + r1 * r3 + r2 * r3;
  const kSquared = sa / (2 * sumTerms);
  const k = roundTo(Math.sqrt(kSquared), 2);
  const l = roundTo(r1 * k, 2);
  const w = roundTo(r2 * k, 2);
  const h = roundTo(r3 * k, 2);

  const params: Record<string, number | string> = { r1, r2, r3, sa };
  const svg = makeRectPrismSvg(`${r1}k`, `${r2}k`, `${r3}k`);

  return {
    id: makeId("challenge", "ratio_of_sides", params),
    topic: "surface_area_of_prisms",
    difficulty: "challenge",
    archetype: "ratio_of_sides",
    prompt: `A rectangular prism has sides in the ratio ${r1}:${r2}:${r3} and surface area ${sa} cm². Find the longest dimension. Round to 2 dp.`,
    answer: formatAnswer(Math.max(l, w, h)),
    worked_solution: [
      `Let sides be ${r1}k, ${r2}k, ${r3}k.`,
      `SA = 2(${r1}k×${r2}k + ${r1}k×${r3}k + ${r2}k×${r3}k) = 2k²(${r1 * r2} + ${r1 * r3} + ${r2 * r3}) = 2k² × ${sumTerms}.`,
      `${sa} = ${2 * sumTerms}k².`,
      `k² = ${sa}/${2 * sumTerms} = ${roundTo(kSquared, 4)}.`,
      `k = ${formatAnswer(k)}.`,
      `Longest side = ${Math.max(r1, r2, r3)} × ${formatAnswer(k)} = ${formatAnswer(Math.max(l, w, h))} cm.`,
    ],
    metadata: {
      params,
      skills: ["ratio", "solve_quadratic", "rectangular_prism_sa"],
      estimated_time_sec: 100,
      visual: { type: "svg", svg, alt: `Rectangular prism with sides in ratio ${r1}:${r2}:${r3}`, width: 420, height: 320 },
    },
  };
}

function challengeAlgebraicDimensions(rng: SeededRandom): GeneratedQuestion {
  const x = rng.randInt(2, 6);
  const a = rng.randInt(1, 3);
  const b = rng.randInt(1, 3);
  const c = rng.randInt(1, 3);
  const l = a * x, w = b * x, h = c * x;
  const sa = 2 * (l * w + l * h + w * h);

  const params: Record<string, number | string> = { x, a, b, c };
  const svg = makeRectPrismSvg(`${a}x`, `${b}x`, `${c}x`);

  return {
    id: makeId("challenge", "algebraic_dims", params),
    topic: "surface_area_of_prisms",
    difficulty: "challenge",
    archetype: "algebraic_dims",
    prompt: `A rectangular prism has dimensions ${a}x, ${b}x, and ${c}x cm. Its surface area is ${sa} cm². Find the value of x.`,
    answer: `${x}`,
    worked_solution: [
      `SA = 2(${a}x × ${b}x + ${a}x × ${c}x + ${b}x × ${c}x).`,
      `SA = 2x²(${a * b} + ${a * c} + ${b * c}) = 2x² × ${a * b + a * c + b * c} = ${2 * (a * b + a * c + b * c)}x².`,
      `${sa} = ${2 * (a * b + a * c + b * c)}x².`,
      `x² = ${sa / (2 * (a * b + a * c + b * c))}.`,
      `x = ${x}.`,
    ],
    metadata: {
      params,
      skills: ["algebraic_prism", "solve_quadratic"],
      estimated_time_sec: 80,
      visual: { type: "svg", svg, alt: `Rectangular prism with algebraic dimensions`, width: 420, height: 320 },
    },
  };
}

function challengeSAvsVolume(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(3, 8);
  const w = rng.randInt(2, 6);
  const h = rng.randInt(2, 5);
  const sa = 2 * (l * w + l * h + w * h);
  const vol = l * w * h;
  const ratio = roundTo(sa / vol, 2);

  const params: Record<string, number | string> = { l, w, h };
  const svg = makeRectPrismSvg(l, w, h);

  return {
    id: makeId("challenge", "sa_vs_volume", params),
    topic: "surface_area_of_prisms",
    difficulty: "challenge",
    archetype: "sa_vs_volume",
    prompt: `A rectangular prism is ${l}×${w}×${h} cm. Find the ratio of surface area to volume (SA/V). Round to 2 dp.`,
    answer: formatAnswer(ratio),
    worked_solution: [
      `SA = 2(${l}×${w} + ${l}×${h} + ${w}×${h}) = ${sa} cm².`,
      `Volume = ${l} × ${w} × ${h} = ${vol} cm³.`,
      `SA/V = ${sa}/${vol} = ${formatAnswer(ratio)}.`,
    ],
    metadata: {
      params,
      skills: ["surface_area_to_volume_ratio", "division"],
      estimated_time_sec: 50,
      visual: { type: "svg", svg, alt: `Rectangular prism ${l}×${w}×${h}, find SA/V ratio`, width: 420, height: 320 },
    },
  };
}

function challengeMultiStep(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(4, 8);
  const w = rng.randInt(3, 6);
  const h = rng.randInt(2, 5);
  const costPerSqm = rng.pick([2, 3, 5, 8, 10]);
  const sa = 2 * (l * w + l * h + w * h);
  const totalCost = sa * costPerSqm;

  const params: Record<string, number | string> = { l, w, h, cost: costPerSqm };
  const svg = makeRectPrismSvg(l, w, h);

  return {
    id: makeId("challenge", "multi_step_real", params),
    topic: "surface_area_of_prisms",
    difficulty: "challenge",
    archetype: "multi_step_real",
    prompt: `A storage container is ${l}m × ${w}m × ${h}m. It costs $${costPerSqm} per m² to paint all outer surfaces. What is the total cost?`,
    answer: `${totalCost}`,
    worked_solution: [
      `SA = 2(${l}×${w} + ${l}×${h} + ${w}×${h}) = ${sa} m².`,
      `Cost = ${sa} × $${costPerSqm} = $${totalCost}.`,
    ],
    metadata: {
      params,
      skills: ["rectangular_prism_sa", "cost_calculation", "multi_step"],
      estimated_time_sec: 60,
      visual: { type: "svg", svg, alt: `Storage container ${l}×${w}×${h} m`, width: 420, height: 320 },
    },
  };
}

function challengeAngledCut(rng: SeededRandom): GeneratedQuestion {
  const l = rng.randInt(6, 12);
  const w = rng.randInt(4, 8);
  const h = rng.randInt(4, 8);
  const cutSA = roundTo(l * w + 2 * (0.5 * l * h) + w * h + l * Math.sqrt((h * h) + 0), 2);
  const triArea = 0.5 * w * h;
  const slantH = roundTo(Math.sqrt(w * w + h * h), 2);
  const bottomArea = l * w;
  const backArea = l * h;
  const sideArea = triArea;
  const slantArea = roundTo(l * slantH, 2);
  const sa = roundTo(bottomArea + backArea + 2 * sideArea + slantArea, 2);

  const params: Record<string, number | string> = { l, w, h };
  const svg = makeTriPrismSvg(w, h, l);

  return {
    id: makeId("challenge", "angled_cut", params),
    topic: "surface_area_of_prisms",
    difficulty: "challenge",
    archetype: "angled_cut",
    prompt: `A wedge-shaped prism (right-triangle cross-section) has base ${w} cm, height ${h} cm, and length ${l} cm. Find the total surface area. Round to 2 dp.`,
    answer: formatAnswer(sa),
    worked_solution: [
      `Slant height of triangle = √(${w}² + ${h}²) = ${formatAnswer(slantH)} cm.`,
      `Bottom face = ${l} × ${w} = ${bottomArea} cm².`,
      `Back face = ${l} × ${h} = ${backArea} cm².`,
      `Slant face = ${l} × ${formatAnswer(slantH)} = ${formatAnswer(slantArea)} cm².`,
      `Two triangular ends = 2 × ½ × ${w} × ${h} = ${roundTo(2 * triArea, 2)} cm².`,
      `SA = ${bottomArea} + ${backArea} + ${formatAnswer(slantArea)} + ${roundTo(2 * triArea, 2)} = ${formatAnswer(sa)} cm².`,
    ],
    metadata: {
      params,
      skills: ["wedge_prism_sa", "pythagoras", "multi_face"],
      estimated_time_sec: 90,
      visual: { type: "svg", svg, alt: `Wedge-shaped prism base=${w}, height=${h}, length=${l}`, width: 420, height: 320 },
    },
  };
}

const EASY_ARCHETYPES: ArchetypeFn[] = [
  easyCubeSA,
  easyRectPrismDistinct,
  easyCountFaces,
  easySAFromNet,
  easyCubeGivenSide,
  easyRectPrismTwoSquareFaces,
  easyOneFaceArea,
  easyTotalFromFaceAreas,
];

const MEDIUM_ARCHETYPES: ArchetypeFn[] = [
  mediumTriPrismRight,
  mediumWordProblem,
  mediumMissingDimension,
  mediumTriPrismIsosceles,
  mediumComparePrisms,
  mediumDecimalDimensions,
  mediumOpenTopBox,
  mediumTrapezoidalPrism,
];

const HARD_ARCHETYPES: ArchetypeFn[] = [
  hardTriPrismPythagSlant,
  hardFindDimFromSA,
  hardHexPrism,
  hardCompositeL,
  hardUnitConversion,
  hardEquilateralTriPrism,
  hardOpenEndedPrism,
];

const CHALLENGE_ARCHETYPES: ArchetypeFn[] = [
  challengeMinSAForVolume,
  challengeCompositeSA,
  challengeRatioOfSides,
  challengeAlgebraicDimensions,
  challengeSAvsVolume,
  challengeMultiStep,
  challengeAngledCut,
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
